'use strict';
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const homeUI=document.getElementById('homeUI');
const readyUI=document.getElementById('readyUI');
const petUI=document.getElementById('petUI');
const settingsUI=document.getElementById('settingsUI');
const overUI=document.getElementById('overUI');
const homePetName=document.getElementById('homePetName');
const petShowName=document.getElementById('petShowName');
const readyPetName=document.getElementById('readyPetName');
const timeResultEl=document.getElementById('timeResult');
const rankList=document.getElementById('rankList');
const playBtn=document.getElementById('playBtn');
const startRaceBtn=document.getElementById('startRaceBtn');
const petBtn=document.getElementById('petBtn');
const settingsBtn=document.getElementById('settingsBtn');
const petConfirmBtn=document.getElementById('petConfirmBtn');
const settingsBackBtn=document.getElementById('settingsBackBtn');
const restartBtn=document.getElementById('restartBtn');
const homeBtn=document.getElementById('homeBtn');
const gameHomeBtn=document.getElementById('gameHomeBtn');
const soundToggle=document.getElementById('soundToggle');
const vibrateToggle=document.getElementById('vibrateToggle');
const fallToggle=document.getElementById('fallToggle');
const bgmToggle=document.getElementById('bgmToggle');
const homePet=document.getElementById('homePet');
const petShow=document.getElementById('petShow');
const readyPet=document.getElementById('readyPet');

const Sound={
  actx:null,
  init(){ try{ if(!this.actx) this.actx=new (window.AudioContext||window.webkitAudioContext)(); if(this.actx.state==='suspended') this.actx.resume(); }catch(e){} },
  beep(freq,dur,type,vol,slideTo){
    if(!settings.sound || !this.actx) return;
    try{ const t=this.actx.currentTime; const o=this.actx.createOscillator(); const g=this.actx.createGain();
      o.type=type||'sine'; o.frequency.setValueAtTime(freq,t); if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);
      g.gain.setValueAtTime(vol||0.12,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      o.connect(g); g.connect(this.actx.destination); o.start(t); o.stop(t+dur+0.03);
    }catch(e){}
  },
  tap(){ this.beep(880,0.08,'triangle',0.10,1240); },
  miss(){ this.beep(170,0.26,'sawtooth',0.10,70); },
  count(){ this.beep(660,0.1,'sine',0.12); },
  go(){ this.beep(990,0.25,'sine',0.14); },
  win(){ this.beep(523,0.16,'sine',0.13); setTimeout(()=>this.beep(659,0.16,'sine',0.13),130); setTimeout(()=>this.beep(784,0.34,'sine',0.13),260); }
};

// ===================== 游戏主控 =====================
class Game{
  constructor(){
    this.state='home'; this.rows=[]; this.racers=[]; this.raceStart=0; this.countdownStart=0; this.overtimeStart=0;
    this.flash=0; this.particles=[];
    this.last=performance.now(); this.snow=[];
    for(let i=0;i<70;i++) this.snow.push({x:rand(0,CFG.W),y:rand(0,CFG.H),r:rand(1,3),s:rand(18,60),dr:rand(-12,12)});
  }
  screenY(r){ return CFG.ROLE_Y - (r - this.racers[0].index)*CFG.STEP; }
  get human(){ return this.racers[0]; }
  randRow(cnt){ const cols=[0,1,2,3]; for(let i=3;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=cols[i]; cols[i]=cols[j]; cols[j]=t; } const c=[false,false,false,false]; for(let k=0;k<cnt;k++) c[cols[k]]=true; return c; }
  makeRacer(pet,isAI,col,aiInterval){ return {pet,isAI,index:0,col,viewX:colCenter(col),hop:0,fall:null,aiTimer:rand(0.4,1.1),aiInterval,elapsed:0,finishTime:null,started:false,startTime:0}; }
  prepare(){
    this.rows=[];
    this.rows.push([true,true,true,true]);
    for(let r=1;r<CFG.N-1;r++) this.rows.push(this.randRow(Math.random()<0.5?1:2));
    this.rows.push(this.randRow(1));
    const aiPets=shuffle(['cat','dog','fox']);
    const D=DIFFICULTY[difficulty];
    this.racers=[this.makeRacer(selectedPet,false,0,0), this.makeRacer(aiPets[0],true,1,rand(D.lo,D.hi)), this.makeRacer(aiPets[1],true,2,rand(D.lo,D.hi)), this.makeRacer(aiPets[2],true,3,rand(D.lo,D.hi))];
    this.particles=[]; this.flash=0;
    this.countdownStart=performance.now();
    BGM.playRandom(); Sound.init(); this.state='countdown';
  }
  makeFall(racer,toX,toY){ return {phase:'jump',t:0,dur:CFG.FALL_JUMP,fromX:colCenter(racer.col),fromY:this.screenY(racer.index),toX,toY}; }
  spawnSplash(x,y){ for(let i=0;i<28;i++) this.particles.push({x:x+rand(-28,28),y:y+rand(-6,8),vx:rand(-140,140),vy:rand(-320,-90),life:rand(0.4,0.8),max:0.8,r:rand(2,5),color:(i%3===0?'#eaf9ff':'#cdeeff')}); }
  advanceFall(racer,dt){
    racer.fall.t+=dt;
    if(racer.fall.phase==='jump' && racer.fall.t>=racer.fall.dur){ this.spawnSplash(racer.fall.toX,racer.fall.toY); racer.fall.phase='underwater'; racer.fall.t=0; racer.fall.dur=CFG.FALL_WAIT/1000; racer.viewX=colCenter(racer.col); }
    else if(racer.fall.phase==='underwater' && racer.fall.t>=racer.fall.dur){ racer.fall=null; }
  }
  tap(x,y){
    if(this.state!=='playing' && this.state!=='overtime') return;
    const h=this.human;
    if(h.fall || h.index>=CFG.N-1) return;
    const ti=h.index+1, ty=this.screenY(ti);
    if(y<ty-CFG.GH/2 || y>ty+CFG.GH/2) return;
    let col=Math.floor(x/laneW); col=clamp(col,0,CFG.COLS-1);
    if(this.rows[ti][col]){
      if(!h.started){ h.started=true; h.startTime=performance.now(); }
      h.col=col; h.index=ti; h.hop=1; Sound.tap();
      if(h.index>=CFG.N-1 && h.finishTime==null) h.finishTime=h.elapsed;
    }else{
      if(!settings.fall){ this.flash=0.4; return; }
      h.fall=this.makeFall(h,x,y); this.flash=0.4; Sound.miss();
      if(settings.vibrate && navigator.vibrate){ try{ navigator.vibrate(80); }catch(e){} }
    }
  }
  updateAI(ai,dt){
    if(ai.fall) return;
    if(ai.index>=CFG.N-1){ if(ai.finishTime==null) ai.finishTime=ai.elapsed; return; }
    ai.aiTimer-=dt;
    if(ai.aiTimer<=0){
      ai.aiTimer=ai.aiInterval*(0.85+Math.random()*0.3);
      const ti=ai.index+1, grass=[], water=[];
      for(let c=0;c<CFG.COLS;c++){ if(this.rows[ti][c]) grass.push(c); else water.push(c); }
      if(!grass.length) return;
      if(Math.random() >= DIFFICULTY[difficulty].miss){
        ai.col=grass[Math.floor(Math.random()*grass.length)]; ai.index=ti; ai.hop=1;
        if(ai.index>=CFG.N-1) ai.finishTime=ai.elapsed;
      }else{
        const wc=water[Math.floor(Math.random()*water.length)];
        ai.fall=this.makeFall(ai,colCenter(wc),this.screenY(ti));
      }
    }
  }
  finish(){
    this.state='over';
    const done=this.racers.filter(r=>r.finishTime!=null).sort((a,b)=>a.finishTime-b.finishTime);
    const notDone=this.racers.filter(r=>r.finishTime==null).sort((a,b)=>b.index-a.index);
    const ranked=done.concat(notDone);
    const myRank=ranked.findIndex(r=>!r.isAI)+1;
    const champ=ranked[0];
    timeResultEl.textContent=(champ.isAI?(PET_NAMES[champ.pet]+' 夺冠'):'你夺冠')+'，你是第 '+myRank+' 名';
    rankList.innerHTML='';
    const medals=['🥇','🥈','🥉','4'];
    ranked.forEach((r,i)=>{
      const div=document.createElement('div');
      div.className='rank-line'+(r.isAI?'':' me');
      const nm=r.isAI?PET_NAMES[r.pet]:'你·'+PET_NAMES[r.pet];
      const info=(r.finishTime!=null)?(r.finishTime.toFixed(2)+'s'):((r.index+1)+' 格');
      div.innerHTML='<span>'+medals[i]+' '+nm+'</span><span>'+info+'</span>';
      rankList.appendChild(div);
    });
    showScreen('over'); Sound.win();
  }
  update(dt){
    for(const s of this.snow){ s.y+=s.s*dt; s.x+=s.dr*dt; if(s.y>CFG.H){s.y=-4;s.x=rand(0,CFG.W);} if(s.x<-10)s.x+=CFG.W+20; if(s.x>CFG.W+10)s.x-=CFG.W+20; }
    for(let i=this.particles.length-1;i>=0;i--){ const p=this.particles[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=700*dt; p.life-=dt; if(p.life<=0) this.particles.splice(i,1); }
    if(this.flash>0) this.flash=Math.max(0,this.flash-dt*1.8);
    if(this.state==='home' || this.state==='ready') return;
    if(this.state==='countdown'){
      if(performance.now()-this.countdownStart>=3000){ this.state='playing'; this.raceStart=performance.now(); Sound.go(); }
      return;
    }
    const now=performance.now();
    for(const r of this.racers){
      if(r.hop>0) r.hop=Math.max(0,r.hop-dt/CFG.HOP);
      if(r.fall) this.advanceFall(r,dt);
      else { const tx=colCenter(r.col); r.viewX+=(tx-r.viewX)*Math.min(1,dt*18); }
    }
    for(const r of this.racers){
      if(r.isAI) r.elapsed=(now-this.raceStart)/1000;
      else if(r.started) r.elapsed=(now-r.startTime)/1000;
    }
    for(let i=1;i<this.racers.length;i++) this.updateAI(this.racers[i],dt);
    if(this.state==='playing' && this.racers.some(r=>r.finishTime!=null)){
      this.state='overtime'; this.overtimeStart=performance.now();
    }
    if(this.state==='overtime' && performance.now()-this.overtimeStart>=10000){ this.finish(); }
  }
  // 绘制
  rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  drawPool(){
    const g=ctx.createLinearGradient(0,0,0,CFG.H);
    g.addColorStop(0,'#c4ecfa'); g.addColorStop(0.55,'#8fd8ef'); g.addColorStop(1,'#4db4de');
    ctx.fillStyle=g; ctx.fillRect(0,0,CFG.W,CFG.H);
    ctx.strokeStyle='rgba(255,255,255,0.16)'; ctx.lineWidth=1.5;
    for(let i=0;i<9;i++){ const yy=100+i*100; ctx.beginPath(); for(let x=0;x<=CFG.W;x+=18){ const yy2=yy+Math.sin(x*0.04+performance.now()/400+i)*3; if(x===0)ctx.moveTo(x,yy2); else ctx.lineTo(x,yy2);} ctx.stroke(); }
    ctx.fillStyle='rgba(255,255,255,0.75)'; for(const s of this.snow){ ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,TAU); ctx.fill(); }
  }
  drawGrass(cx,cy,o){
    const gw=CFG.GW, gh=CFG.GH, r=CFG.RR, x=cx-gw/2, y=cy-gh/2;
    ctx.save();
    if(o.isTarget){ ctx.shadowColor='rgba(255,255,255,0.95)'; ctx.shadowBlur=14; }
    const grad=ctx.createLinearGradient(x,y,x,y+gh);
    if(o.isGoal){ grad.addColorStop(0,'#ffe79a'); grad.addColorStop(0.6,'#f7c95c'); grad.addColorStop(1,'#d9a332'); }
    else { grad.addColorStop(0,'#8ed36a'); grad.addColorStop(0.5,'#5cb94e'); grad.addColorStop(1,'#3e9a43'); }
    ctx.fillStyle=grad; this.rr(x,y,gw,gh,r); ctx.fill();
    ctx.shadowBlur=0;
    ctx.strokeStyle=o.isGoal?'rgba(170,120,30,0.85)':'rgba(40,110,55,0.55)';
    ctx.lineWidth=o.isTarget?4:2; this.rr(x,y,gw,gh,r); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1.5; ctx.lineCap='round';
    const sx=[-28,-12,4,20,32];
    for(let i=0;i<5;i++){ const gx=cx+sx[i]; ctx.beginPath(); ctx.moveTo(gx,y+gh-14); ctx.lineTo(gx,y+gh-6); ctx.stroke(); }
    if(o.passed){ ctx.fillStyle='rgba(180,220,255,0.4)'; this.rr(x,y,gw,gh,r); ctx.fill(); }
    ctx.restore();
  }
  drawWaterTile(cx,cy){
    const gw=CFG.GW, gh=CFG.GH, r=CFG.RR, x=cx-gw/2, y=cy-gh/2;
    const grad=ctx.createLinearGradient(x,y,x,y+gh);
    grad.addColorStop(0,'#bfe9fb'); grad.addColorStop(0.5,'#8fd4ef'); grad.addColorStop(1,'#5eb8df');
    ctx.fillStyle=grad; this.rr(x,y,gw,gh,r); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.45)'; ctx.lineWidth=2; this.rr(x,y,gw,gh,r); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(x+16,y+gh*0.4); ctx.lineTo(x+gw-16,y+gh*0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+16,y+gh*0.65); ctx.lineTo(x+gw-16,y+gh*0.65); ctx.stroke();
  }
  drawGoalFlag(cx,cy){
    const fx=cx+14, fy=cy-CFG.GH/2-40;
    ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(fx,fy+38); ctx.lineTo(fx,fy); ctx.stroke();
    ctx.fillStyle='#ff5a5f'; ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(fx+26,fy+7); ctx.lineTo(fx,fy+14); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='bold 13px "Microsoft YaHei"'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('终点',fx+4,fy+40);
  }
  drawLanes(){
    ctx.strokeStyle='rgba(255,255,255,0.14)'; ctx.lineWidth=1.5; ctx.setLineDash([5,9]);
    for(let c=1;c<CFG.COLS;c++){ const x=c*laneW; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CFG.H); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  drawGrid(){
    if(!this.rows.length) return;
    const hi=this.human.index;
    for(let r=0;r<CFG.N;r++){
      const sy=this.screenY(r);
      if(sy<-CFG.GH*2 || sy>CFG.H+CFG.GH*2) continue;
      const isGoal=(r===CFG.N-1), passed=(r<hi);
      for(let c=0;c<CFG.COLS;c++){
        if(this.rows[r][c]){ this.drawGrass(colCenter(c),sy,{isTarget:false,isGoal:isGoal,passed:passed}); if(isGoal) this.drawGoalFlag(colCenter(c),sy); }
        else this.drawWaterTile(colCenter(c),sy);
      }
    }
    const hti=hi+1;
    if(hti<CFG.N){ const tsy=this.screenY(hti); for(let c=0;c<CFG.COLS;c++){ if(this.rows[hti][c]) this.drawGrass(colCenter(c),tsy,{isTarget:true,isGoal:false,passed:false}); } }
  }
  drawRacers(){
    const t=performance.now()/1000;
    for(const r of this.racers){
      if(r.fall && r.fall.phase==='underwater') continue;
      let x=r.viewX, y=this.screenY(r.index), phase=0;
      if(r.fall && r.fall.phase==='jump'){
        const p=clamp(r.fall.t/r.fall.dur,0,1);
        x=r.fall.fromX+(r.fall.toX-r.fall.fromX)*p;
        y=r.fall.fromY+(r.fall.toY-r.fall.fromY)*p+Math.sin(p*Math.PI)*32;
        phase=p;
      }else if(r.hop>0){
        y-=Math.sin(r.hop*Math.PI)*30; phase=r.hop;
      }
      if(y>CFG.H+40 || y<-40) continue;
      drawCuteAnimal(ctx,r.pet,x,y,0.7,t,phase);
    }
  }
  drawParticles(){
    for(const p of this.particles){ ctx.globalAlpha=clamp(p.life/p.max,0,1); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,TAU); ctx.fill(); }
    ctx.globalAlpha=1;
  }
  drawHUD(){
    ctx.fillStyle='rgba(7,22,44,0.7)'; ctx.fillRect(0,0,CFG.W,112);
    const h=this.human;
    let rank=1; for(const r of this.racers){ if(r.index>h.index) rank++; }
    ctx.textBaseline='middle';
    ctx.textAlign='left'; ctx.font='bold 28px "Microsoft YaHei"'; ctx.fillStyle='#fff'; ctx.fillText('⏱ '+h.elapsed.toFixed(2)+'s',16,32);
    ctx.textAlign='center'; ctx.font='bold 18px "Microsoft YaHei"'; ctx.fillStyle='#9fd8ff'; ctx.fillText('第 '+rank+' 名 · '+h.index+' / '+(CFG.N-1)+' 行',CFG.W/2,32);
    const bx=24, bw=CFG.W-48, by=66, bh=12;
    ctx.fillStyle='rgba(255,255,255,0.18)'; this.rr(bx,by,bw,bh,6); ctx.fill();
    const prog=(CFG.N>1)?h.index/(CFG.N-1):1;
    if(prog>0){ ctx.fillStyle='#5cd6ff'; this.rr(bx,by,Math.max(bh,bw*prog),bh,6); ctx.fill(); }
    ctx.textAlign='left'; ctx.font='13px "Microsoft YaHei"'; ctx.fillStyle='#cfe9ff'; ctx.fillText('起点',bx-2,by+bh+12); ctx.textAlign='right'; ctx.fillText('终点',bx+bw+2,by+bh+12);
    const mx=bx+bw*prog; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(mx,by+bh/2,9,0,TAU); ctx.fill(); ctx.fillStyle='#0288d1'; ctx.beginPath(); ctx.arc(mx,by+bh/2,5,0,TAU); ctx.fill();
  }
  drawCountdown(){
    const el=(performance.now()-this.countdownStart)/1000;
    let num=3-Math.floor(el); if(num<0) num=0;
    ctx.fillStyle='rgba(7,22,44,0.55)'; ctx.fillRect(0,0,CFG.W,CFG.H);
    ctx.fillStyle='#fff'; ctx.font='bold 150px "Microsoft YaHei"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(num>0?String(num):'GO!', CFG.W/2, CFG.H/2-30);
    ctx.font='bold 30px'; ctx.fillText('准备出发', CFG.W/2, CFG.H/2+100);
  }
  drawOvertime(){
    const left=Math.max(0,10-(performance.now()-this.overtimeStart)/1000);
    ctx.fillStyle='rgba(255,70,70,0.92)'; ctx.fillRect(0,112,CFG.W,42);
    ctx.fillStyle='#fff'; ctx.font='bold 22px "Microsoft YaHei"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('⏳ 距离结算 '+left.toFixed(1)+'s', CFG.W/2, 133);
  }
  drawFlash(){
    if(this.flash<=0) return;
    ctx.fillStyle='rgba(255,40,40,'+(this.flash*0.14)+')'; ctx.fillRect(0,0,CFG.W,CFG.H);
    ctx.strokeStyle='rgba(255,40,40,'+(this.flash*0.85)+')'; ctx.lineWidth=20; ctx.strokeRect(0,0,CFG.W,CFG.H);
  }
  draw(){
    ctx.clearRect(0,0,CFG.W,CFG.H);
    this.drawPool(); this.drawLanes();
    if(this.state==='playing'||this.state==='countdown'||this.state==='overtime'||this.state==='over'){ this.drawGrid(); this.drawParticles(); this.drawRacers(); this.drawHUD(); this.drawFlash(); }
    if(this.state==='countdown') this.drawCountdown();
    if(this.state==='overtime') this.drawOvertime();
  }
}

function showScreen(name){
  if(name==='home'||name==='ready') BGM.start(); else BGM.stop();
  homeUI.classList.add('hidden'); readyUI.classList.add('hidden'); petUI.classList.add('hidden'); settingsUI.classList.add('hidden'); overUI.classList.add('hidden'); gameHomeBtn.classList.add('hidden');
  if(name==='home') homeUI.classList.remove('hidden');
  else if(name==='ready') readyUI.classList.remove('hidden');
  else if(name==='pet') petUI.classList.remove('hidden');
  else if(name==='settings') settingsUI.classList.remove('hidden');
  else if(name==='over') overUI.classList.remove('hidden');
  else if(name==='playing') gameHomeBtn.classList.remove('hidden');
}

const game=new Game();
function toCanvas(ev){ const r=canvas.getBoundingClientRect(); return {x:(ev.clientX-r.left)*(CFG.W/r.width),y:(ev.clientY-r.top)*(CFG.H/r.height)}; }
if(window.PointerEvent){ canvas.addEventListener('pointerdown',e=>{ e.preventDefault(); const c=toCanvas(e); game.tap(c.x,c.y); }); }
else{ canvas.addEventListener('mousedown',e=>{ const c=toCanvas(e); game.tap(c.x,c.y); }); canvas.addEventListener('touchstart',e=>{ e.preventDefault(); const t=e.touches[0]; const c=toCanvas(t); game.tap(c.x,c.y); },{passive:false}); }

function applyPetSelection(){
  homePetName.textContent=PET_NAMES[selectedPet];
  petShowName.textContent=PET_NAMES[selectedPet];
  readyPetName.textContent=PET_NAMES[selectedPet];
  document.querySelectorAll('.pet-card').forEach(el=>{ el.classList.toggle('selected', el.dataset.pet===selectedPet); });
  startPetPreview(homePet,selectedPet,1.4);
  startPetPreview(petShow,selectedPet,1.9);
  startPetPreview(readyPet,selectedPet,1.3);
}
function applyDifficulty(){
  document.querySelectorAll('.diff-btn').forEach(el=>{ el.classList.toggle('selected', el.dataset.diff===difficulty); });
}
playBtn.addEventListener('click',()=>{ applyPetSelection(); applyDifficulty(); showScreen('ready'); game.state='ready'; });
startRaceBtn.addEventListener('click',()=>{ showScreen('playing'); game.prepare(); });
petBtn.addEventListener('click',()=>{ applyPetSelection(); showScreen('pet'); });
settingsBtn.addEventListener('click',()=>{ showScreen('settings'); });
petConfirmBtn.addEventListener('click',()=>{ applyPetSelection(); showScreen('home'); });
settingsBackBtn.addEventListener('click',()=>{ showScreen('home'); });
restartBtn.addEventListener('click',()=>{ applyDifficulty(); showScreen('ready'); game.state='ready'; });
homeBtn.addEventListener('click',()=>{ game.state='home'; showScreen('home'); });
gameHomeBtn.addEventListener('click',()=>{ game.state='home'; showScreen('home'); });
document.querySelectorAll('.pet-card').forEach(el=>{ el.addEventListener('click',()=>{ selectedPet=el.dataset.pet; applyPetSelection(); }); });
document.querySelectorAll('.diff-btn').forEach(el=>{ el.addEventListener('click',()=>{ difficulty=el.dataset.diff; applyDifficulty(); }); });
function bindToggle(btn,key){ btn.addEventListener('click',()=>{ settings[key]=!settings[key]; btn.textContent=settings[key]?'开':'关'; btn.classList.toggle('on',settings[key]); }); }
bindToggle(soundToggle,'sound'); bindToggle(vibrateToggle,'vibrate'); bindToggle(fallToggle,'fall');
bgmToggle.addEventListener('click',()=>{ settings.bgm=!settings.bgm; bgmToggle.textContent=settings.bgm?'开':'关'; bgmToggle.classList.toggle('on',settings.bgm); if(settings.bgm){ if(game.state==='home'||game.state==='ready') BGM.start(); } else BGM.stop(); });
document.querySelectorAll('.pet-card canvas').forEach(cv=>{ startPetPreview(cv,cv.parentElement.dataset.pet,1.15); });
applyPetSelection(); applyDifficulty();

function loop(now){
  const dt=Math.min(0.05,(now-game.last)/1000);
  game.last=now; game.update(dt); game.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
