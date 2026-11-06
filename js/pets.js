'use strict';
// ===================== 宠物：俯视趴姿（背对玩家） =====================
function drawBackTail(g,type,t,jp,speed,amp){
  if(type==='cat'){
    const wag=Math.sin(t*speed)*amp + jp*7;
    g.strokeStyle='#f7a45a'; g.lineWidth=6; g.lineCap='round';
    g.beginPath(); g.moveTo(0,12); g.quadraticCurveTo(14+wag,18,10+wag,32); g.stroke();
    g.strokeStyle='#d97a2b'; g.beginPath(); g.moveTo(10+wag,32); g.lineTo(8+wag,38); g.stroke();
  }else if(type==='dog'){
    const wag=Math.sin(t*speed)*amp;
    g.strokeStyle='#e8a95a'; g.lineWidth=7; g.lineCap='round';
    g.beginPath(); g.arc(0,4,9,Math.PI*1.1+wag*0.05,Math.PI*1.9+wag*0.05); g.stroke();
  }else{
    const sway=Math.sin(t*speed)*0.1 + jp*0.3;
    for(let i=0;i<9;i++){
      const a=(i-4)/4*1.7+sway;
      g.save(); g.translate(0,13); g.rotate(a);
      const grad=g.createLinearGradient(0,0,0,28);
      grad.addColorStop(0,'#f2e6d0'); grad.addColorStop(1,'#fbf0d8');
      g.fillStyle=grad; g.beginPath(); g.ellipse(0,15,5,16,0,0,TAU); g.fill();
      g.fillStyle='#fff'; g.beginPath(); g.ellipse(0,27,3,6,0,0,TAU); g.fill();
      g.restore();
    }
  }
}
function drawBackPattern(g,type,C){
  if(type==='cat'){
    g.strokeStyle=C.dark; g.lineWidth=2; g.lineCap='round';
    g.beginPath(); g.moveTo(-5,-9); g.lineTo(-5,9); g.stroke();
    g.beginPath(); g.moveTo(0,-11); g.lineTo(0,11); g.stroke();
    g.beginPath(); g.moveTo(5,-9); g.lineTo(5,9); g.stroke();
  }else if(type==='dog'){
    g.fillStyle='#fdf0dc'; g.beginPath(); g.ellipse(0,-1,10,6,0,0,TAU); g.fill();
  }else{
    g.strokeStyle='#d9a441'; g.lineWidth=2; g.lineCap='round';
    g.beginPath(); g.moveTo(0,-10); g.lineTo(0,10); g.stroke();
    g.beginPath(); g.moveTo(-7,-4); g.lineTo(7,-4); g.stroke();
  }
}
function drawBackEars(g,type,C,earTw){
  if(type==='cat'){
    const tw=earTw*2;
    g.fillStyle=C.body; g.beginPath(); g.moveTo(-9,-27); g.lineTo(-13,-37-tw); g.lineTo(-2,-31); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(9,-27); g.lineTo(13,-37-tw); g.lineTo(2,-31); g.closePath(); g.fill();
  }else if(type==='dog'){
    g.fillStyle=C.body; g.beginPath(); g.ellipse(-10,-24,5,8,0.4+earTw*0.15,0,TAU); g.fill();
    g.beginPath(); g.ellipse(10,-24,5,8,-0.4-earTw*0.15,0,TAU); g.fill();
  }else{
    const tw=earTw*2.5;
    g.fillStyle=C.body; g.beginPath(); g.moveTo(-8,-27); g.lineTo(-12,-40-tw); g.lineTo(-1,-31); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(8,-27); g.lineTo(12,-40-tw); g.lineTo(1,-31); g.closePath(); g.fill();
    g.fillStyle=C.inner; g.beginPath(); g.moveTo(-8,-29); g.lineTo(-11,-36-tw); g.lineTo(-3,-31); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(8,-29); g.lineTo(11,-36-tw); g.lineTo(3,-31); g.closePath(); g.fill();
  }
}
function drawCuteAnimal(g,type,x,y,s,t,phase){
  const C=PET_COLORS[type];
  const jp=Math.sin((phase||0)*Math.PI);
  let bob=Math.sin(t*2.6)*1.6, earTw=((t%3.6)<0.12)?1:0, speed=3, amp=4;
  if(type==='cat'){ bob+=Math.max(0,Math.sin(t*1.1))*1.2; speed=2.5; amp=5; }
  else if(type==='dog'){ bob=Math.abs(Math.sin(t*5))*2.6; speed=7; amp=6; }
  else { bob=Math.sin(t*2)*1.5; speed=2; amp=3; }
  g.save(); g.translate(x,y); g.scale(s,s); g.translate(0,bob);
  g.scale(1+jp*0.08,1-jp*0.12);
  const leg=3+jp*5;
  drawBackTail(g,type,t,jp,speed,amp);
  g.fillStyle=C.dark;
  g.beginPath(); g.ellipse(-(12+leg),8,5.5,7,0.5,0,TAU); g.fill();
  g.beginPath(); g.ellipse((12+leg),8,5.5,7,-0.5,0,TAU); g.fill();
  g.fillStyle=C.dark;
  g.beginPath(); g.ellipse(-(10+leg),-7,5,7,-0.5,0,TAU); g.fill();
  g.beginPath(); g.ellipse((10+leg),-7,5,7,0.5,0,TAU); g.fill();
  g.fillStyle=C.body; g.beginPath(); g.ellipse(0,0,19,13,0,0,TAU); g.fill();
  drawBackPattern(g,type,C);
  g.fillStyle=C.body; g.beginPath(); g.arc(0,-21,11,0,TAU); g.fill();
  drawBackEars(g,type,C,earTw);
  g.restore();
}

function startPetPreview(cv,type,scale){
  const g=cv.getContext('2d');
  (function render(){
    const t=performance.now()/1000;
    g.clearRect(0,0,cv.width,cv.height);
    drawCuteAnimal(g,type,cv.width/2,cv.height/2+22,scale,t,0);
    requestAnimationFrame(render);
  })();
}
