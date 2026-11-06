'use strict';
const CFG={ W:540,H:960,N:72,STEP:96,ROLE_Y:744,COLS:4,HOP:0.15,FALL_JUMP:0.30,FALL_WAIT:1000,GW:118,GH:84,RR:18 };
const laneW=CFG.W/CFG.COLS;
const colCenter=c=>(c+0.5)*laneW;

const PET_NAMES={cat:'小猫',dog:'小狗',fox:'九尾狐'};
const PET_COLORS={
  cat:{body:'#f7a45a',dark:'#d97a2b',inner:'#ffd9c2'},
  dog:{body:'#e8a95a',dark:'#c98a4a',inner:'#d98b6a'},
  fox:{body:'#f2e6d0',dark:'#d9a441',inner:'#f2b6c9'}
};
const DIFFICULTY={
  novice:{name:'新手',lo:0.70,hi:0.95,miss:0.30},
  normal:{name:'普通',lo:0.50,hi:0.72,miss:0.15},
  hard:{name:'高手',lo:0.35,hi:0.50,miss:0.08},
  master:{name:'大师',lo:0.22,hi:0.34,miss:0.03}
};
let selectedPet='cat';
let difficulty='normal';
let settings={sound:true,vibrate:true,fall:true,bgm:true};
