const POS=[[24,12,300,'Atacante Direito','y'],[76,12,300,'Atacante Esquerdo','y'],[28,29,450,'Meio Campo','y'],[72,29,450,'Meio Campo','y'],[50,42,650,'Meio Campo','y'],[50,58,650,'Volante','b'],[28,71,450,'Zagueiro Esquerdo','b'],[72,71,450,'Zagueiro Direito','b'],[24,88,300,'Lateral Esquerdo','b'],[76,88,300,'Lateral Direito','b']];
const GOAL_LV=5,TIME=120,per=l=>3000*l;
const $=id=>document.getElementById(id);
let X=[0,0],L=[1,1],xp,lv,left,tick,over,ac,raf,last,t0,tickFn,paused=false,pauseAt=0;
function move(ts){
 if(over)return;
 const dt=Math.min(.05,(ts-last)/1000);last=ts;
 const prog=Math.min(1,(TIME-left)/TIME),spd=prog<.5?9*(3+30*prog*prog+4*prog):70+100*(prog-.5);
 document.querySelectorAll('.pos').forEach(b=>{if(b.classList.contains('ice'))return;const s=b._s;
  s.a+=(Math.random()-.5)*.08;
  s.x+=Math.cos(s.a)*spd*s.m*dt;s.y+=Math.sin(s.a)*spd*s.m*dt;
  if(s.x<17){s.x=17;s.a=Math.PI-s.a}if(s.x>83){s.x=83;s.a=Math.PI-s.a}
  if(s.y<7){s.y=7;s.a=-s.a}if(s.y>92){s.y=92;s.a=-s.a}
  b.style.left=s.x+'%';b.style.top=s.y+'%'});
 raf=requestAnimationFrame(move);
}
function beep(f,d=.08){try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;o.type='square';g.gain.value=.05;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}}
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id))}
function build(){
 const f=$('field');f.querySelectorAll('.pos').forEach(e=>e.remove());
 POS.forEach(p=>{const b=document.createElement('button');b.className='pos '+p[4];b.style.left=p[0]+'%';b.style.top=p[1]+'%';b._s={x:p[0],y:p[1],a:Math.random()*6.28,m:.6+(p[2]-300)/350*.9};
  b.innerHTML=`<b>${p[2]} XP</b><small>${p[3]}</small><span class="cd"></span>`;
  b.onpointerdown=e=>{e.preventDefault();hit(b,p,e)};f.appendChild(b)});
}
function hit(b,p,e){
 if(over||b.classList.contains('cool'))return;
 const red=b.classList.contains('red'),ice=b.classList.contains('ice'),gain=red?-p[2]:ice?-p[2]/2:p[2],ms=p[2]*5;
 b.style.setProperty('--t',ms+'ms');b.classList.add('cool');setTimeout(()=>b.classList.remove('cool'),ms);
 const r=$('game').getBoundingClientRect(),n=document.createElement('div');n.className='pop';n.textContent=(gain>0?'+':'')+gain+' XP';if(gain<0)n.style.color='#ff5a5a';
 n.style.left=(e.clientX-r.left)+'px';n.style.top=(e.clientY-r.top-20)+'px';$('game').appendChild(n);setTimeout(()=>n.remove(),900);
 const i=p[4]=='y'?0:1;X[i]=Math.max(cum(L[i]),X[i]+gain);beep(gain<0?140:520+p[2]/2,gain<0?.3:.08);
 while(X[i]>=cum(L[i]+1)){L[i]++;beep(900,.25)}
 render();
 
}
const cum=l=>{let s=0;for(let i=1;i<l;i++)s+=per(i);return s};
function render(){
 const a=cum(L[0]),need=per(L[0]),a1=cum(L[1]),n1=per(L[1]);
 $('lvFill').style.width=Math.min(100,(X[0]-a)/need*100)+'%';
 $('lvChip').textContent='Lv. '+L[0];
 $('goalFill').style.width=Math.min(100,(X[1]-a1)/n1*100)+'%';
 $('goalTxt').textContent=`Lv.${L[1]} · ${Math.floor(X[1]-a1)} / ${n1} XP`;
}
function fmt(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
let cdT;
function say(t){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='pt-BR';u.rate=.95;speechSynthesis.speak(u)}catch(e){}}
function start(){
 clearInterval(tick);clearInterval(cdT);cancelAnimationFrame(raf);
 X=[0,0];L=[1,1];left=TIME;over=true;build();render();$('end').classList.remove('on');$('tm').textContent=fmt(TIME);$('timer').classList.remove('low');show('game');
 const W=['','um','dois','três','quatro','cinco'],c=$('cd');let n=5;
 const step=()=>{
  c.classList.add('on');c.style.animation='none';void c.offsetWidth;c.style.animation='';
  if(n>0){c.textContent=n;say(W[n]);beep(600,.15);n--}
  else{clearInterval(cdT);c.textContent='JÁ!';say('Já!');beep(1000,.3);setTimeout(()=>c.classList.remove('on'),700);begin()}
 };
 step();cdT=setInterval(step,1000);
}
function hazard(sel,sp,mx){
 const bl=[...document.querySelectorAll(sel)];
 if(left<=90&&left>60){
  const target=Math.min(mx,Math.floor((90-left)/6)+1),reds=bl.filter(e=>e.classList.contains('red'));
  if(reds.length<target){const free=bl.filter(e=>!e.classList.contains('red'));
   if(free.length){if(sp&&!reds.length)say('Cuidado!');free[Math.floor(Math.random()*free.length)].classList.add('red');beep(150,.2)}}
 }else bl.forEach(e=>e.classList.remove('red'));
}
let lastIce=0;
function freeze(){
 const ys=[...document.querySelectorAll('.pos.y')],now=Date.now();
 ys.forEach(e=>{if(e._ice&&now>e._ice){e._ice=0;e.classList.remove('ice')}});
 if(left<=90&&left>60){
  if(now-lastIce>4000){lastIce=now;const free=ys.filter(e=>!e._ice);
   if(free.length){const e=free[Math.floor(Math.random()*free.length)];e._ice=now+5000;e.classList.add('ice');beep(1200,.15)}}
 }else ys.forEach(e=>{e._ice=0;e.classList.remove('ice')});
}
function pause(){
 if(over||paused)return;
 paused=true;pauseAt=Date.now();clearInterval(tick);cancelAnimationFrame(raf);
 try{speechSynthesis.cancel()}catch(e){}
 $('pause').classList.add('on');$('field').classList.add('paused');
}
function resume(){
 if(!paused)return;
 paused=false;t0+=Date.now()-pauseAt;
 $('pause').classList.remove('on');$('field').classList.remove('paused');
 last=performance.now();raf=requestAnimationFrame(move);tick=setInterval(tickFn,100);
}
let flipped=false;
function flipper(){
 const on=left<=50&&left>30&&(50-left)%8<3.5;
 if(on!==flipped){flipped=on;$('field').classList.toggle('flip',on);if(on){say('Campo virado!');beep(300,.25)}}
}
let fogSlot=-1;
function fog(){
 const all=[...document.querySelectorAll('.pos')];
 if(left<=60&&left>0){
  const hard=left<=30,P=hard?2.5:4,t=60-left,slot=Math.floor(t/P),ph=t%P;if(hard&&!$('field').classList.contains('hard'))say('Neblina forte! Botões menores!');$('field').classList.toggle('hard',hard);
  if(slot!==fogSlot){fogSlot=slot;if(slot===0)say('Neblina!');all.forEach(e=>e.classList.remove('ghost'));all.sort(()=>Math.random()-.5).slice(0,hard?6:3).forEach(e=>e.classList.add('ghost'))}
  if(ph>P-(hard?.6:1.5))all.forEach(e=>e.classList.remove('ghost'));
 }else{all.forEach(e=>e.classList.remove('ghost'));$('field').classList.remove('hard')}
}
function begin(){
 X=[0,0];L=[1,1];left=TIME;over=false;fogSlot=-1;lastIce=0;flipped=false;$('field').classList.remove('flip');$('field').classList.remove('hard');build();render();$('end').classList.remove('on');show('game');
 t0=Date.now();paused=false;$('pause').classList.remove('on');$('field').classList.remove('paused');clearInterval(tick);cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(move);
 tick=setInterval(tickFn=()=>{left=TIME-(Date.now()-t0)/1000;$('tm').textContent=fmt(left);$('timer').classList.toggle('low',left<=15);hazard('.pos.b',1,4);hazard('.pos.y',0,4);fog();flipper();if(left<=0)finish()},100);
}
function finish(){
 if(over)return;over=true;clearInterval(tick);
 const a=L[0],b=L[1],w=a!==b?(a>b?0:1):(X[0]===X[1]?-1:(X[0]>X[1]?0:1)),win=false;
 $('resTxt').textContent=w<0?'EMPATE':w===0?'LARANJA VENCEU':'AZUL VENCEU';
 $('result').className='btn '+(w===1?'blue':w===0?'orange':'');
 $('result').style.filter='';
 $('sum').innerHTML=`${win?'🎉 Meta atingida!':'⏱ Tempo esgotado!'}<br>Laranja: Lv.${a} · Azul: Lv.${b}`;
 $('tm').textContent=win?fmt(left):'0:00';
 beep(1000,.4);say(w<0?'Empate!':w===0?'Laranja venceu!':'Azul venceu!');$('end').classList.add('on');
}
$('gear').onclick=pause;$('resume').onclick=resume;
$('quit').onclick=()=>{paused=false;$('pause').classList.remove('on');$('field').classList.remove('paused');$('menuBtn').onclick()};
$('play').onclick=start;$('again').onclick=start;
$('menuBtn').onclick=()=>{clearInterval(tick);clearInterval(cdT);cancelAnimationFrame(raf);try{speechSynthesis.cancel()}catch(e){}$('cd').classList.remove('on');show('menu')};
