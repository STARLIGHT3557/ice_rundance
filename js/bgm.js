'use strict';
// ===================== BGM（5首洗脑循环·比赛随机挑选） =====================
const TRACKS=[
  {name:'鸡你太美', stepDur:0.12, lead:'square', leadVol:0.055, melody:[72,72,76,72,79,76,72,-1,72,72,76,72,79,81,79,76], bass:[48,43,45,41]},
  {name:'像素冲刺', stepDur:0.11, lead:'square', leadVol:0.05, melody:[60,64,67,72,76,79,76,72,67,64,60,64,67,72,76,79], bass:[36,43,48,41]},
  {name:'魔性方块', stepDur:0.14, lead:'triangle', leadVol:0.09, melody:[79,76,72,76,79,84,79,76,72,76,79,76,72,67,72,76], bass:[43,41,45,48]},
  {name:'跳跳乐', stepDur:0.10, lead:'square', leadVol:0.045, melody:[67,67,71,67,74,71,67,-1,67,67,71,67,76,74,71,67], bass:[48,48,45,45]},
  {name:'冰面狂想', stepDur:0.13, lead:'triangle', leadVol:0.09, melody:[76,72,79,72,81,79,76,72,74,76,79,81,84,79,76,74], bass:[48,45,43,41]}
];
const BGM={
  actx:null, master:null, noise:null, timer:null, step:0, nextTime:0, playing:false, track:TRACKS[0],
  nf(m){ return 440*Math.pow(2,(m-69)/12); },
  init(){
    if(this.actx) return;
    try{
      this.actx=new (window.AudioContext||window.webkitAudioContext)();
      this.master=this.actx.createGain(); this.master.gain.value=0.55; this.master.connect(this.actx.destination);
      const len=Math.floor(this.actx.sampleRate*0.1); this.noise=this.actx.createBuffer(1,len,this.actx.sampleRate);
      const d=this.noise.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    }catch(e){}
  },
  start(track){
    if(!settings.bgm) return;
    this.init(); if(!this.actx) return;
    if(this.actx.state==='suspended'){ try{ this.actx.resume(); }catch(e){} }
    if(track) this.track=track;
    if(this.playing) return;
    this.playing=true; this.step=0; this.nextTime=this.actx.currentTime+0.06;
    if(this.timer) clearInterval(this.timer);
    this.timer=setInterval(()=>this.schedule(),30);
  },
  playRandom(){ if(TRACKS.length) this.start(TRACKS[Math.floor(Math.random()*TRACKS.length)]); },
  stop(){
    this.playing=false;
    if(this.timer){ clearInterval(this.timer); this.timer=null; }
  },
  schedule(){
    if(!this.playing || !this.actx) return;
    while(this.nextTime < this.actx.currentTime+0.12){
      this.playStep(this.step, this.nextTime);
      this.step=(this.step+1)%this.track.melody.length;
      this.nextTime += this.track.stepDur;
    }
  },
  tone(freq,t,dur,type,vol){
    const o=this.actx.createOscillator(), g=this.actx.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.012); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t+dur+0.03);
  },
  kick(t){
    const o=this.actx.createOscillator(), g=this.actx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(45,t+0.12);
    g.gain.setValueAtTime(0.6,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.18);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t+0.2);
  },
  hat(t){
    if(!this.noise) return;
    const src=this.actx.createBufferSource(); src.buffer=this.noise;
    const f=this.actx.createBiquadFilter(); f.type='highpass'; f.frequency.value=8500;
    const g=this.actx.createGain(); g.gain.setValueAtTime(0.12,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.05);
    src.connect(f); f.connect(g); g.connect(this.master); src.start(t); src.stop(t+0.06);
  },
  playStep(i,t){
    const T=this.track;
    const m=T.melody[i];
    if(m>=0) this.tone(this.nf(m), t, T.stepDur*0.9, T.lead, T.leadVol);
    if(i%2===0){ const b=T.bass[(i/2)%T.bass.length]; this.tone(this.nf(b), t, T.stepDur*1.8, 'triangle', 0.16); }
    if(i%4===0) this.kick(t);
    if(i%2===1) this.hat(t);
  }
};
