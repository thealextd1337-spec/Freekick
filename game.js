(()=>{
  'use strict';
  const canvas=document.querySelector('#pitch'),ctx=canvas.getContext('2d');
  const $=s=>document.querySelector(s);
  const images={};
  for(const name of ['player-home','player-away','keeper','ball','goal']){const im=new Image();im.src=`assets/${name}.png?v=2`;im.onload=draw;images[name]=im}
  const state={mode:'free',aim:{x:0,y:-3},power:65,curve:0,phase:'ready',t:0,goals:0,tries:0,keeperX:0,shot:null,drag:false,resetTimer:null};
  const W=960,H=600,origin={x:475,y:157};
  const project=(x,y,z=0)=>({x:origin.x+x*16+y*7.5,y:origin.y+y*10.5-x*3.8-z*31});
  const unproject=(sx,sy)=>{const dx=sx-origin.x,dy=sy-origin.y;return{x:(dx*10.5-dy*7.5)/196.5,y:(dy*16+dx*3.8)/196.5}};
  function poly(points,fill,stroke,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
  function line(a,b,color,width=2){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
  function circle(p,r,fill,stroke){ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
  function field(){ctx.fillStyle='#87acd0';ctx.fillRect(0,0,W,H);ctx.fillStyle='#4c8062';ctx.fillRect(0,110,W,H-110);
    for(let i=0;i<16;i++){const a=project(-27,-5+i*2.6),b=project(27,-5+i*2.6),c=project(27,-5+(i+1)*2.6),d=project(-27,-5+(i+1)*2.6);poly([a,b,c,d],i%2?'#438852':'#4b9459')}
    poly([project(-27,-5),project(27,-5),project(27,36),project(-27,36)],null,'#d9ebc4',3);
    line(project(-27,0),project(27,0),'#d9ebc4',3);
    poly([project(-13,0),project(13,0),project(13,16),project(-13,16)],null,'#d9ebc4',3);
    poly([project(-7,0),project(7,0),project(7,6),project(-7,6)],null,'#d9ebc4',3);
    circle(project(0,12),3,'#e5f4dc');
    const goal=images.goal;
    if(goal?.complete&&goal.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.drawImage(goal,347,-35,240,285)}
    else{const g1=project(-3.7,0),g2=project(3.7,0);line(g1,project(-3.7,0,2.5),'#f6f7ea',6);line(g2,project(3.7,0,2.5),'#f6f7ea',6);line(project(-3.7,0,2.5),project(3.7,0,2.5),'#f6f7ea',6)}
  }
  function sprite(name,x,y,size=56,z=0){const p=project(x,y,z),im=images[name];circle({x:p.x,y:p.y+4},size*.21,'#102a2780');if(im?.complete&&im.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.drawImage(im,p.x-size/2,p.y-size*.76,size,size)}else{circle({x:p.x,y:p.y-16},size*.23,name==='keeper'?'#f7c85d':name==='player-home'?'#a7e65b':'#6aaaf1')}}
  function baseBall(){return state.mode==='free'?{x:-3,y:25}:{x:-24,y:3}}
  function people(){sprite('keeper',state.keeperX,1,92);if(state.mode==='free'){
      [-4.5,-2.3,0,2.3].forEach(x=>sprite('player-away',x,14,74));sprite('player-home',-5,26,80)
    }else{[[-8,10],[-2,7],[4,11],[9,8]].forEach(v=>sprite('player-away',v[0],v[1],74));[[-5,12],[2,10],[8,14]].forEach(v=>sprite('player-home',v[0],v[1],77));sprite('player-home',-25,4,80)}
  }
  function trajectory(t){const b=baseBall(),s=state.shot||{aim:state.aim,power:state.power,curve:state.curve};let end;
    if(state.mode==='free'){const reach=.62+(s.power-25)/75*.76;end={x:b.x+(s.aim.x-b.x)*reach,y:b.y+(s.aim.y-b.y)*reach-2}}
    else{const reach=.63+(s.power-25)/75*.72;end={x:b.x+(s.aim.x-b.x)*reach,y:b.y+(s.aim.y-b.y)*reach}}
    const x=b.x+(end.x-b.x)*t+(s.curve/100)*5*Math.sin(Math.PI*t)*t;
    const y=b.y+(end.y-b.y)*t;
    const loft=state.mode==='free'?2.7:5.4;
    const z=Math.max(0,loft*4*t*(1-t)+Math.max(0,s.power-80)*.008*t);
    return{x,y,z}
  }
  function aim(){const p=project(state.aim.x,state.aim.y);const pulse=3*Math.sin(performance.now()/260);circle(p,16+pulse,'#d9fc5a44','#f4ffb1');line({x:p.x-24,y:p.y},{x:p.x+24,y:p.y},'#f4ffb1',2);line({x:p.x,y:p.y-24},{x:p.x,y:p.y+24},'#f4ffb1',2);
    if(state.phase==='ready'){ctx.setLineDash([7,7]);for(let i=0;i<25;i++){const q=trajectory(i/24),r=trajectory((i+1)/24);line(project(q.x,q.y,q.z),project(r.x,r.y,r.z),'#f6ffbfaa',2)}ctx.setLineDash([])}
  }
  function draw(){ctx.clearRect(0,0,W,H);field();people();if(state.phase==='ready')aim();let b=baseBall();if(state.phase==='flight')b=trajectory(state.t);const p=project(b.x,b.y,b.z||0);if(state.phase==='flight')circle(project(b.x,b.y),10,'#122a2870');const im=images.ball;if(im?.complete&&im.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(im,p.x-18,p.y-19,36,36)}else circle(p,9,'#f4f0da','#192e38');
    ctx.fillStyle='#102931b8';ctx.fillRect(16,16,208,36);ctx.fillStyle='#e5fb81';ctx.font='bold 17px monospace';ctx.fillText(state.mode==='free'?'01 / FREISTOSS':'02 / ECKBALL',28,40)
  }
  function clampAim(raw){return state.mode==='free'?{x:Math.max(-9,Math.min(9,raw.x)),y:-3}:{x:Math.max(-11,Math.min(10,raw.x)),y:Math.max(5,Math.min(18,raw.y))}}
  function aimFromEvent(e){const r=canvas.getBoundingClientRect(),scale=W/r.width,p=unproject((e.clientX-r.left)*scale,(e.clientY-r.top)*scale);state.aim=clampAim(p);draw()}
  canvas.addEventListener('pointerdown',e=>{if(state.phase!=='ready')return;state.drag=true;canvas.setPointerCapture(e.pointerId);aimFromEvent(e)});
  canvas.addEventListener('pointermove',e=>{if(state.drag&&state.phase==='ready')aimFromEvent(e)});
  canvas.addEventListener('pointerup',()=>state.drag=false);canvas.addEventListener('pointercancel',()=>state.drag=false);
  function setMode(mode){clearTimeout(state.resetTimer);state.mode=mode;state.aim=mode==='free'?{x:0,y:-3}:{x:-1,y:10};state.phase='ready';state.shot=null;state.keeperX=0;$('#free').classList.toggle('active',mode==='free');$('#corner').classList.toggle('active',mode==='corner');$('#tip').textContent=mode==='free'?'Ziehe die Zielmarke am Tor':'Ziehe die Zielmarke in den Strafraum';$('#status').textContent=mode==='free'?'Ziele am Tor vorbei an der Mauer.':'Flanke in den Strafraum und finde einen Mitspieler.';$('#shoot').disabled=false;$('#shoot').innerHTML='SCHIESSEN <span>➜</span>';draw()}
  function result(){let goal=false,message='';const end=trajectory(1);
    if(state.mode==='free'){
      const b=baseBall(),crossT=(b.y-0)/(b.y-end.y),cross=trajectory(Math.max(0,Math.min(1,crossT)));
      const wallT=(b.y-14)/(b.y-end.y),wall=trajectory(Math.max(0,Math.min(1,wallT)));
      if(end.y>0){message='Zu wenig Kraft – der Ball erreicht das Tor nicht.'}
      else if(wall.x>-5.7&&wall.x<3.3&&wall.z<1.55){message='Die Mauer blockt den Schuss.'}
      else if(Math.abs(cross.x)>3.65||cross.z>2.5){message='Knapp vorbei! Versuch es noch einmal.'}
      else if(Math.abs(cross.x-state.keeperX)<1.6&&cross.z<1.9){message='Starke Parade des Torwarts!'}
      else{goal=true;message='TOR! Perfekt getroffen.'}
    }else{
      const mates=[[-5,12],[2,10],[8,14]],nearest=Math.min(...mates.map(([x,y])=>Math.hypot(end.x-x,end.y-y)));
      if(state.power<39)message='Die Flanke bleibt zu kurz.';
      else if(nearest>5)message='Die Flanke findet keinen Mitspieler.';
      else if(Math.abs(end.x-state.keeperX)<2&&end.y<8)message='Der Torwart fängt die Flanke ab.';
      else if(nearest>2.7)message='Kopfball! Der Ball geht knapp vorbei.';
      else{goal=true;message='TOR! Die Ecke wird eingeköpft.'}
    }
    state.tries++;if(goal)state.goals++;$('#goals').textContent=state.goals;$('#tries').textContent=state.tries;$('#status').textContent=message;state.phase='result';$('#shoot').disabled=false;$('#shoot').innerHTML='NOCH EIN VERSUCH <span>↻</span>';draw()
  }
  function shoot(){if(state.phase==='result'){state.phase='ready';state.shot=null;state.keeperX=0;$('#shoot').innerHTML='SCHIESSEN <span>➜</span>';$('#status').textContent='Richte deinen Schuss aus.';draw();return}if(state.phase!=='ready')return;
    state.shot={aim:{...state.aim},power:state.power,curve:state.curve};state.t=0;state.phase='flight';state.keeperX=Math.max(-2.5,Math.min(2.5,state.aim.x*.28));$('#shoot').disabled=true;$('#status').textContent='Der Ball ist unterwegs …';let last=performance.now();function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;state.t=Math.min(1,state.t+dt/1.35);draw();if(state.t<1&&state.phase==='flight')requestAnimationFrame(frame);else if(state.phase==='flight')result()}requestAnimationFrame(frame)
  }
  $('#free').onclick=()=>setMode('free');$('#corner').onclick=()=>setMode('corner');$('#shoot').onclick=shoot;
  for(const key of ['power','curve']){$('#'+key).addEventListener('input',e=>{state[key]=Number(e.target.value);$('#'+key+'-value').textContent=key==='power'?`${state.power} %`:state.curve===0?'0':`${state.curve>0?'+':''}${state.curve}`;draw()})}
  document.addEventListener('keydown',e=>{if(e.target?.tagName==='INPUT')return;if(e.code==='Space'){e.preventDefault();shoot()}else if(state.phase==='ready'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();const dx=e.code==='ArrowLeft'?-1:e.code==='ArrowRight'?1:0,dy=e.code==='ArrowUp'?-1:e.code==='ArrowDown'?1:0;state.aim=clampAim({x:state.aim.x+dx,y:state.aim.y+dy});draw()}});
  setMode('free');
})();
