(function(){
  const $=s=>document.querySelector(s);
  const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

  const mascot=CapiMascot.create($(".capy-stage"));
  let playing=false;
  const MSG={pomo:"Hora de focar!",short:"Hora de uma pausa!",long:"Pausa longa. Hora de relaxar."};
  let mins=store.get("capi-mins",{pomo:25,short:5,long:15});
  let tasks=store.get("capi-tasks",[]);
  let activeId=store.get("capi-active",tasks[0]?tasks[0].id:null);
  let count=store.get("capi-count",1);
  const lightModes={pomo:false,short:false,long:false};   // modo com fundo claro (texto escuro), calculado pelo tema
  let mode="pomo", left=mins.pomo*60, total=left, running=false, endAt=0, tick=null;

  const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
  const TITLE_MODE={pomo:"Foco",short:"Pausa curta",long:"Pausa longa"};
  // ciclo: pausa longa a cada N focos, início automático e notificação (#17, #14)
  let flow=Object.assign({longEvery:4,autoBreak:false,autoPomo:false,notify:false},store.get("capi-flow",{}));
  flow.longEvery=Math.min(10,Math.max(2,parseInt(flow.longEvery)||4));
  let autoT=null,quiet=false;
  // timer salvo no navegador para sobreviver a recarregar a página (#15)
  function saveTimer(){store.set("capi-timer",{mode,total,left,running,endAt:running?endAt:0});}
  // tela acesa durante o foco (#16)
  let wakeLock=null,wakePending=false;
  function syncWake(){try{
    const want=running&&mode==="pomo"&&!(typeof document!=="undefined"&&document.hidden);
    if(want&&!wakeLock&&!wakePending&&typeof navigator!=="undefined"&&navigator.wakeLock&&navigator.wakeLock.request){
      wakePending=true;
      navigator.wakeLock.request("screen").then(l=>{wakePending=false;wakeLock=l;
        if(l.addEventListener)l.addEventListener("release",()=>{if(wakeLock===l)wakeLock=null;});
        if(!(running&&mode==="pomo"))syncWake();
      }).catch(()=>{wakePending=false;});
    }else if(!want&&wakeLock){const l=wakeLock;wakeLock=null;try{l.release().catch(()=>{})}catch(e){}}
  }catch(e){}}
  // notificação do navegador ao fim de cada etapa (#14)
  const NOTIFY_MSG={pomo:"Fim da pausa. Bora focar?",short:"Fim do foco! Hora de uma pausa curta.",long:"Fim do foco! Hora da pausa longa."};
  function notifyEnd(next){try{
    if(!flow.notify||typeof Notification==="undefined"||Notification.permission!=="granted")return;
    if(typeof document!=="undefined"&&!document.hidden&&document.hasFocus&&document.hasFocus())return;   // app na frente: o alarme basta
    const n=new Notification("Capifocus",{body:NOTIFY_MSG[next],icon:"assets/mascot/capy-default.png",tag:"capifocus-ciclo",renotify:true});
    n.onclick=()=>{try{window.focus()}catch(e){}n.close();};
  }catch(e){}}   // Android exige service worker para notificar: aí simplesmente não mostra
  // confirmação ao trocar de aba com o timer rodando (#10)
  let pendingMode=null;
  let lastTitle="";
  function updateTitle(){
    const t=(running||left<total)?(running?"":"⏸ ")+fmt(left)+" · "+TITLE_MODE[mode]+" | Capifocus":"Capifocus";
    if(t!==lastTitle){lastTitle=t;document.title=t;}
  }
  function render(){
    mascot.update({mode,running,playing});
    $("#time").textContent=fmt(left);
    $("#progress").style.width=((1-left/total)*100)+"%";
    $("#main").textContent=running?"Pausar":"Começar";
    $("#main").classList.toggle("running",running);
    $("#skip").hidden=!(running||left<total);
    $("#reset").hidden=!(left<total);
    // cada classe de estado é ligada/desligada sozinha; "ringing" e "celebrate" são cuidadas pelo alarme e pela comemoração
    const B=document.body.classList;
    ["pomo","short","long"].forEach(m=>B.toggle(m,m===mode));
    B.toggle("running",running);
    B.toggle("on-light",!!lightModes[mode]);
    updateTitle();
    syncWake();
    const DO={pomo:"Concentrada no foco",short:"Curtindo uma pausa",long:"Relaxando na pausa longa"};
    $("#doing").textContent=running?DO[mode]:(playing?"Curtindo a Capi Rádio":"Esperando você começar");
    document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-pressed",t.dataset.mode===mode));
    $("#count").textContent="#"+count;
    const a=tasks.find(t=>t.id===activeId);
    $("#msg").textContent=(mode==="pomo"&&a&&!a.done)?a.name:MSG[mode];
    if(typeof mediaUI==="function")mediaUI();
  }
  function setMode(m,auto){
    if(!auto){clearTimeout(autoT);
      if(running&&m===mode)return;
      if(running)return confirmSwitch(m);
    }
    stop();mode=m;left=total=mins[m]*60;saveTimer();render();
  }
  function confirmSwitch(m){
    pendingMode=m;
    $("#cf-text").textContent="O timer de "+TITLE_MODE[mode]+" está rodando com "+fmt(left)+" restantes. Trocar para "+TITLE_MODE[m]+" descarta esse tempo.";
    $("#confirm").hidden=false;try{$("#cf-cancel").focus()}catch(e){}
  }
  function closeConfirm(apply){
    const m=pendingMode;pendingMode=null;$("#confirm").hidden=true;
    if(apply&&m){stop();mode=m;left=total=mins[m]*60;saveTimer();render();}
  }
  function start(){running=true;endAt=Date.now()+left*1000;clearInterval(tick);tick=setInterval(step,250);saveTimer();render();}
  function stop(){running=false;clearInterval(tick);saveTimer();render();}
  function step(){
    left=Math.max(0,Math.round((endAt-Date.now())/1000));
    if(left===0){finish();return}
    render();
  }
  var finish=function(){
    const completedNaturally=!skipping,loud=completedNaturally&&!quiet;
    stop();if(loud){chime();mascot.complete();}skipping=false;
    if(mode==="pomo"){
      if(completedNaturally){
        const a=tasks.find(t=>t.id===activeId);if(a){a.act++;saveTasks();}
        const next=(count%flow.longEvery===0)?"long":"short";count++;store.set("capi-count",count);
        setMode(next,true);
      }else setMode("short",true);   // foco pulado: não conta pomodoro nem aproxima a pausa longa
    }else setMode("pomo",true);
    if(loud){
      notifyEnd(mode);
      const go=mode==="pomo"?flow.autoPomo:flow.autoBreak;   // início automático só depois de uma etapa completa
      if(go){clearTimeout(autoT);autoT=setTimeout(()=>{if(!running){start();if(typeof musicFollow==="function")musicFollow();}},1500);}
    }
  }
  let ctx;
  let skipping=false;
  let alarmTimers=[];
  const ALARMS={
    sino:{rep:1.6,play(t,out){[[880,0],[1318.5,.22],[1760,.44]].forEach(([fq,d])=>bell(t+d,fq,1.6,.5,out));}},
    despertador:{rep:1.1,play(t,out){for(let i=0;i<4;i++){beep(t+i*.14,1046,.09,"square",.18,out);}}},
    marimba:{rep:1.4,play(t,out){[523.25,659.25,783.99,1046.5].forEach((fq,i)=>mar(t+i*.13,fq,out));}},
    capi:{rep:1.8,play(t,out){[[392,0],[523.25,.16],[659.25,.32],[523.25,.56],[783.99,.72]].forEach(([fq,d])=>mar(t+d,fq,out));}}
  };
  function bell(t,fq,dec,peak,out){[[1,1],[2.76,.35],[5.4,.12]].forEach(([r,a])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=fq*r;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak*a,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+dec/r);o.connect(g).connect(out);o.start(t);o.stop(t+dec+.05);});}
  function beep(t,fq,len,type,peak,out){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=fq;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+.005);g.gain.setValueAtTime(peak,t+len-.01);g.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(g).connect(out);o.start(t);o.stop(t+len+.02);}
  function mar(t,fq,out){bell(t,fq,.7,.55,out);const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=fq*4;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.08,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+.08);o.connect(g).connect(out);o.start(t);o.stop(t+.1);}
  let alarm=store.get("capi-alarm",{sound:"sino",rep:3,vol:80});
  function chime(){
    try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume();
      stopAlarm();
      const A=ALARMS[alarm.sound]||ALARMS.sino,out=ctx.createGain();out.gain.value=alarm.vol/100*1.2;out.connect(ctx.destination);
      const t0=ctx.currentTime+.05;for(let i=0;i<alarm.rep;i++)A.play(t0+i*A.rep,out);
      const total=alarm.rep*A.rep+.6;
      if(typeof Lofi!=="undefined")Lofi.duck(total);
      document.body.classList.add("ringing");alarmTimers.push(setTimeout(()=>document.body.classList.remove("ringing"),total*1000));
      alarmTimers.push(out);
    }catch(e){}
  }
  function stopAlarm(){alarmTimers.forEach(x=>{if(typeof x==="number")clearTimeout(x);else try{x.gain.setTargetAtTime(0,ctx.currentTime,.03)}catch(e){}});alarmTimers=[];document.body.classList.remove("ringing");}

  $("#main").addEventListener("click",()=>{ensureAudio();stopAlarm(); running?stop():start();});
  $("#skip").addEventListener("click",()=>{skipping=true;left=0;finish();});
  $("#reset").addEventListener("click",()=>{clearTimeout(autoT);stop();left=total=mins[mode]*60;saveTimer();render();});
  document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>setMode(t.dataset.mode)));
  function typingIn(el){return !!el&&(/^(INPUT|BUTTON|TEXTAREA|SELECT)$/.test(el.tagName)||el.isContentEditable===true);}
  document.addEventListener("keydown",e=>{if(e.code==="Space"&&!typingIn(document.activeElement)){e.preventDefault();$("#main").click();}});

  // tarefas
  // monta elementos com propriedades/atributos, sem interpretar HTML (dados do localStorage nunca viram marcação)
  function el(tag,props,attrs){const n=document.createElement(tag);if(props)Object.assign(n,props);if(attrs)for(const k in attrs)n.setAttribute(k,attrs[k]);return n;}
  function checkIcon(){const NS="http://www.w3.org/2000/svg",svg=document.createElementNS(NS,"svg"),path=document.createElementNS(NS,"path");
    [["width","14"],["height","14"],["viewBox","0 0 24 24"]].forEach(([k,v])=>svg.setAttribute(k,v));
    [["d","M5 12.5l4.5 4.5L19 7.5"],["stroke","currentColor"],["stroke-width","3.2"],["fill","none"],["stroke-linecap","round"],["stroke-linejoin","round"]].forEach(([k,v])=>path.setAttribute(k,v));
    svg.appendChild(path);return svg;}
  function saveTasks(){store.set("capi-tasks",tasks);store.set("capi-active",activeId);renderTasks();render();}
  function renderTasks(){
    const ul=$("#tasks");ul.replaceChildren();
    tasks.forEach(t=>{
      const li=el("li",{className:"task"+(t.id===activeId?" active":"")+(t.done?" done":"")});li.dataset.id=String(t.id);
      const chk=el("button",{className:"chk",type:"button"},{"aria-label":"Concluir"});chk.appendChild(checkIcon());
      const name=el("span",{className:"name"});name.appendChild(el("span",{className:"nt",textContent:String(t.name)}));
      const pom=el("span",{className:"pom"});pom.append(el("b",{textContent:String(+t.act||0)}),"/"+(+t.est||0));
      const del=el("button",{className:"del",type:"button",textContent:"×"},{"aria-label":"Remover"});
      li.append(chk,name,pom,del);
      li.addEventListener("click",()=>{activeId=t.id;saveTasks();});
      chk.addEventListener("click",e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();t.done=!t.done;saveTasks();if(t.done)celebrate(t.id,r);});
      del.addEventListener("click",e=>{e.stopPropagation();tasks=tasks.filter(x=>x.id!==t.id);if(activeId===t.id)activeId=tasks[0]?tasks[0].id:null;saveTasks();});
      ul.appendChild(li);
    });
    const pend=tasks.filter(t=>!t.done),rem=pend.reduce((s,t)=>s+Math.max(0,t.est-t.act),0);
    const fin=new Date(Date.now()+rem*mins.pomo*60000+Math.max(0,rem-1)*mins.short*60000);
    const s1=el("span",{textContent:"Pomos: "});s1.appendChild(el("b",{textContent:tasks.reduce((s,t)=>s+(+t.act||0),0)+"/"+tasks.reduce((s,t)=>s+(+t.est||0),0)}));
    const s2=el("span",{textContent:"Termina às "});s2.append(el("b",{textContent:fin.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})})," ("+(rem*mins.pomo/60).toFixed(1).replace(".",",")+"h)");
    $("#summary").replaceChildren(s1,s2);
    $("#summary").hidden=!tasks.length;
  }
  $("#add").addEventListener("click",()=>{$("#newtask").hidden=false;$("#add").hidden=true;$("#nt-name").focus();});
  $("#nt-cancel").addEventListener("click",()=>{$("#newtask").hidden=true;$("#add").hidden=false;});
  $("#newtask").addEventListener("submit",e=>{e.preventDefault();const n=$("#nt-name").value.trim();if(!n)return;
    const t={id:Date.now(),name:n,est:Math.max(1,+$("#nt-est").value||1),act:0,done:false};tasks.push(t);if(!activeId)activeId=t.id;
    $("#nt-name").value="";$("#nt-est").value=1;$("#newtask").hidden=true;$("#add").hidden=false;saveTasks();});

  // ajustes
  $("#set-pomo").value=mins.pomo;$("#set-short").value=mins.short;$("#set-long").value=mins.long;
  function setSettings(open){const w=$("#settings-wrap");w.classList.toggle("open",open);w.inert=!open;$("#btn-settings").setAttribute("aria-expanded",open);}
  setSettings(false);
  $("#btn-settings").addEventListener("click",()=>setSettings(!$("#settings-wrap").classList.contains("open")));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#settings-wrap").classList.contains("open"))setSettings(false);});
  $("#sback").addEventListener("click",()=>setSettings(false));
  // ---------- comemoração ao concluir tarefa ----------
  const CHEERS=["Tarefa concluída!","Mandou bem!","Uma a menos!","Capivara aprova!","Isso aí!"];
  let cheerT;
  function celebrate(id,r){
    const li=document.querySelector('.task[data-id="'+id+'"]');if(li)li.classList.add("just-done");
    $("#cheer").textContent=CHEERS[Math.floor(Math.random()*CHEERS.length)];
    mascot.complete();
    document.body.classList.add("celebrate");clearTimeout(cheerT);
    cheerT=setTimeout(()=>document.body.classList.remove("celebrate"),1900);
    if(!matchMedia("(prefers-reduced-motion: reduce)").matches)confetti(r.left+r.width/2,r.top+r.height/2);
    doneSound();
  }
  function confetti(x,y){
    const cs=getComputedStyle(document.documentElement),cols=[cs.getPropertyValue("--bg-pomo"),cs.getPropertyValue("--bg-short"),cs.getPropertyValue("--bg-long"),"#f2c14e","#e07a9b","#7fb069"].map(c=>c.trim()||"#f2c14e");
    for(let i=0;i<26;i++){const d=document.createElement("span");d.className="confetti";d.style.left=x+"px";d.style.top=y+"px";d.style.background=cols[i%cols.length];
      if(i%3===0)d.style.borderRadius="50%";document.body.appendChild(d);
      const a=Math.random()*Math.PI*2,v=50+Math.random()*90,dx=Math.cos(a)*v,dy=Math.sin(a)*v-60;
      d.animate([{transform:"translate(-50%,-50%) rotate(0)",opacity:1},{transform:`translate(${dx}px,${dy}px) rotate(${Math.random()*540}deg)`,opacity:1,offset:.6},{transform:`translate(${dx*1.2}px,${dy+90}px) rotate(${Math.random()*720}deg)`,opacity:0}],{duration:900+Math.random()*500,easing:"cubic-bezier(.2,.7,.3,1)"}).onfinish=()=>d.remove();}
  }
  function doneSound(){try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume();
    const out=ctx.createGain();out.gain.value=Math.max(.15,alarm.vol/100)*.7;out.connect(ctx.destination);const t=ctx.currentTime+.03;
    [[783.99,0],[987.77,.08],[1174.66,.16],[1567.98,.26]].forEach(([fq,d])=>mar(t+d,fq,out));}catch(e){}}
  let toastT;
  function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove("show"),3500);}
  $("#save-settings").addEventListener("click",()=>{
    const c=(v,d)=>Math.min(120,Math.max(1,parseInt(v)||d));
    mins={pomo:c($("#set-pomo").value,25),short:c($("#set-short").value,5),long:c($("#set-long").value,15)};
    store.set("capi-mins",mins);
    flow.longEvery=Math.min(10,Math.max(2,parseInt($("#set-every").value)||4));$("#set-every").value=flow.longEvery;everyHint();
    flow.autoBreak=!!$("#auto-break").checked;flow.autoPomo=!!$("#auto-pomo").checked;store.set("capi-flow",flow);
    setSettings(false);
    // não mexe num timer em andamento: os novos tempos valem a partir da próxima etapa
    if(!running&&left===total){left=total=mins[mode]*60;saveTimer();render();}
    else if(mins[mode]*60!==total)toast("Ajustes salvos. O novo tempo vale ao reiniciar ou na próxima etapa.");
    renderTasks();
  });

  // ---------- Capi Rádio: estações geradas no navegador ----------
  const Lofi=(()=>{
    let mediaEl=null,c,master,music,dry,wet,wow,lp,lfoG,pumpG,timer=null,stopT=null,next=0,step=0,bar=0,prog=0,noise,on=false,cur="classico";
    const f=m=>440*Math.pow(2,(m-69)/12);
    const pick=a=>a[Math.floor(Math.random()*a.length)];
    // ----- instrumentos -----
    function env(g,t,peak,a,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec);}
    function nz(t,type,freq,peak,dec){const s=c.createBufferSource();s.buffer=noise;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=freq;const g=c.createGain();env(g,t,peak,.003,dec);s.connect(fl).connect(g).connect(dry);s.start(t,Math.random());s.stop(t+dec+.05);}
    function kick(t,v,short){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(short?150:110,t);o.frequency.exponentialRampToValueAtTime(short?50:40,t+(short?.07:.15));env(g,t,v,.004,short?.16:.36);o.connect(g).connect(music);o.start(t);o.stop(t+.42);}
    function tone(t,m,type,peak,a,dec,det,dest,noWow){const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f(m);o.detune.value=det||0;if(!noWow)wow.connect(o.detune);env(g,t,peak,a,dec);o.connect(g).connect(dest||dry);o.start(t);o.stop(t+a+dec+.05);}
    function keys(t,notes,len,lvl,a){notes.forEach((m,i)=>{const tt=t+i*.022;tone(tt,m,"triangle",.04*lvl,a||.04,len,-7);tone(tt,m,"sine",.055*lvl,a||.04,len,6);});}
    function rhodes(t,notes,len,lvl){notes.forEach((m,i)=>{const tt=t+i*.018;
      tone(tt,m,"sine",.05*lvl,.008,len,-9,pumpG);tone(tt,m,"sine",.045*lvl,.008,len,9,pumpG);
      tone(tt,m+12,"sine",.014*lvl,.003,.35,0,pumpG);tone(tt,m+24,"sine",.006*lvl,.002,.12,0,pumpG);});}
    function keyLead(t,m,len){tone(t,m,"sine",.075,.004,len,0);tone(t,m+12,"sine",.02,.003,.3,0);tone(t,m-12,"triangle",.018,.006,len*.8,0);}
    function vox(t,m,len,vw){const o=c.createOscillator();o.type="sawtooth";o.frequency.value=f(m);wow.connect(o.detune);
      const F=vw==="a"?[800,1150]:[450,800],g=c.createGain();env(g,t,.05,.04,len);
      F.forEach((fq,j)=>{const bp=c.createBiquadFilter();bp.type="bandpass";bp.frequency.value=fq;bp.Q.value=9;const fg=c.createGain();fg.gain.value=j?.6:1;o.connect(bp).connect(fg).connect(g);});
      g.connect(dry);o.start(t);o.stop(t+len+.1);}
    function pump(t){if(!pumpG)return;pumpG.gain.cancelScheduledValues(t);pumpG.gain.setValueAtTime(.4,t);pumpG.gain.linearRampToValueAtTime(1,t+.28);}
    function bell(t,m,v){tone(t,m,"sine",v,.004,1.2,0);tone(t,m+19,"sine",v*.25,.004,.5,0);}
    function pluck(t,m,v){tone(t,m,"triangle",v,.004,.45,0);tone(t,m+12,"sine",v*.35,.004,.25,0);}
    const snare=t=>nz(t,"bandpass",1600,.24,.18), rim=t=>nz(t,"bandpass",3300,.18,.035), brush=t=>nz(t,"bandpass",2600,.09,.32);
    // ----- estações -----
    const ST={
      classico:{nome:"Lo-fi clássico",bpm:72,swing:.3,cut:2000,wobble:500,wet:.32,
        progs:[{ch:[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]],bs:[41,40,38,36]},
               {ch:[[57,60,64,67],[50,53,57,60,64],[55,59,62,65],[48,52,55,59,62]],bs:[45,38,43,36]},
               {ch:[[50,53,57,60],[55,59,62,65],[52,55,59,62],[57,60,64,67]],bs:[38,43,40,45]}],
        play(i,t,ch,r){
          if(i===0||i===7||(i===10&&bar%2===0))kick(t,.85);
          if(i===4||i===12)snare(t);
          if(i%2===0)nz(t,"highpass",7800,i%4===0?.06:.035,.04);
          if(i===0)keys(t,ch,this.spb*3.6,1);
          if(i===10)keys(t,ch,this.spb*1.4,.45);
          if(i===0)tone(t,r,"sine",.34,.012,this.spb*2,0,music);
          if(i===10)tone(t,r+(Math.random()<.5?0:7),"sine",.26,.012,this.spb*1.2,0,music);
          if(i%2===0&&Math.random()<.16)tone(t,pick([69,72,74,76,79,81]),"sine",.045,.02,this.spb*1.1);
        }},
      anime:{nome:"Anime lo-fi",bpm:82,swing:.22,cut:3800,wobble:350,wet:.34,
        // progressões de J-pop/anime: "marusa" (IVmaj7–III7–vim7–vm7/I7), estrada real (IV–V–iii–VI7) e ii–V–I emotivo
        progs:[{ch:[[53,57,60,64],[52,56,59,62],[57,60,64,67],[55,58,62,65]],bs:[41,40,45,43],half:{3:{ch:[52,55,58,60],bs:36}}},
               {ch:[[53,57,60,64],[55,59,64,65],[52,55,59,62],[55,57,61,64]],bs:[41,43,40,45]},
               {ch:[[50,53,57,60,64],[53,59,64,67],[52,55,59,62],[55,59,60,64]],bs:[38,43,36,45]}],
        scale:[72,74,76,77,79,81,83,84,86,88],
        motif:null,
        newMotif(){
          const T=[[0,3,6,8,10,14,16,19,22,24,28],[2,4,6,10,12,18,20,22,26],[0,4,6,7,8,12,16,20,22,24],[0,2,4,7,10,12,14,18,20,23,26]];
          const pos=pick(T);let k=3+Math.floor(Math.random()*3);
          this.motif=pos.map(p=>{k=Math.max(0,Math.min(this.scale.length-1,k+pick([-2,-1,-1,0,1,1,2])));return{p,k};});
        },
        onLoop(){this.motif=null;},
        play(i,t,ch,r){
          const P=this.progs[prog%this.progs.length];
          if(P.half&&P.half[bar]&&i>=8){ch=P.half[bar].ch;r=P.half[bar].bs;}
          const sp=this.spb;
          // bateria boom-bap com "respiro" nos acordes a cada bumbo
          if(i===0||i===10||(i===7&&Math.random()<.4)){kick(t,i===7?.5:.9);pump(t);}
          if(i===4||i===12){snare(t);rim(t+.004);}
          if(i%2===0)nz(t,"highpass",8200,i%4===0?.05:.032,.035);
          else if(Math.random()<.3)nz(t,"highpass",9000,.016,.02);
          // piano elétrico com chorus
          if(i===0)rhodes(t,ch,sp*2.2,1);
          if(i===6)rhodes(t,ch.slice(1),sp*.9,.55);
          if(i===8&&P.half&&P.half[bar])rhodes(t,ch,sp*2,.9);
          else if(i===11)rhodes(t,ch.slice(1),sp*1.2,.5);
          // baixo sincopado
          if(i===0||(i===8&&P.half&&P.half[bar]))tone(t,r,"sine",.34,.01,sp*1.3,0,music);
          if(i===6)tone(t,r+12,"sine",.2,.01,sp*.5,0,music);
          if(i===10)tone(t,r+7,"sine",.24,.01,sp*.8,0,music);
          if(i===14&&Math.random()<.5)tone(t,r+(Math.random()<.5?10:-1),"sine",.2,.01,sp*.4,0,music);
          // melodia: um motivo de 2 compassos que se repete com variação
          if(!this.motif)this.newMotif();
          const pos=(bar%2)*16+i,n=this.motif.find(x=>x.p===pos);
          if(n){
            let k=n.k+(bar>=2&&Math.random()<.25?1:0);k=Math.min(k,this.scale.length-1);
            let m=this.scale[k];
            const tones=[];ch.forEach(c=>{for(let o=0;o<4;o++){const v=c%12+60+o*12;if(v>=71&&v<=89)tones.push(v);}});
            if(pos%4===0||(bar===3&&pos>=24))m=tones.reduce((a,b)=>Math.abs(b-m)<Math.abs(a-m)?b:a,tones[0]);
            const nx=this.motif.find(x=>x.p>pos),dur=((nx?nx.p:32)-pos)*this.s16;
            keyLead(t,m,Math.min(dur*1.4,sp*1.6));
          }
          // vocal "aah" picotado
          if(bar%2===1&&i===8&&Math.random()<.55)vox(t,ch[ch.length-1]+12,sp*.9,"a");
          if(bar%2===1&&i===12&&Math.random()<.45)vox(t,ch[ch.length-2]+12,sp*1.2,"o");
        }},
      jazz:{nome:"Jazz café",bpm:92,swing:.5,cut:2600,wobble:300,wet:.26,
        progs:[{ch:[[50,53,57,60,64],[53,59,64],[52,55,59,62],[55,61,64,70]],bs:[38,43,36,45]},
               {ch:[[52,55,59,62],[57,61,64,67],[50,53,57,60,64],[55,59,62,65]],bs:[40,45,38,43]}],
        play(i,t,ch,r){
          if(i===0||i===8)kick(t,.35);
          if([0,4,6,8,12,14].includes(i))nz(t,"highpass",5800,i%4===0?.05:.035,.28);
          if(i===4||i===12)brush(t);
          if(i===0)keys(t,ch,this.spb*1.6,1);
          if(i===6||(i===11&&Math.random()<.5))keys(t,ch,this.spb*.7,.6);
          if(i%4===0){const P=this.progs[prog%this.progs.length],nr=P.bs[(bar+1)%4];const walk=[r,r+7,r+10,nr+1][i/4];tone(t,walk,"triangle",.3,.01,this.spb*.85,0,music);}
          if(i%2===0&&Math.random()<.14)tone(t,pick([74,76,77,79,81,83,84,86]),"sine",.05,.015,this.spb*.55);
        }},
      noturna:{nome:"Noturna",bpm:60,swing:.2,cut:1300,wobble:250,wet:.55,
        progs:[{ch:[[57,60,64,67,71],[53,57,60,64],[50,53,57,60,64],[52,55,59,62]],bs:[45,41,38,40]},
               {ch:[[57,60,64,67],[55,59,62,66],[53,57,60,64],[52,56,59,62]],bs:[45,43,41,40]}],
        play(i,t,ch,r){
          if(i===0||i===10)kick(t,.6);
          if(i===8)rim(t);
          if(i%4===2)nz(t,"highpass",7000,.018,.05);
          if(i===0)keys(t,ch,this.spb*4.2,1.1,.5);
          if(i===0)tone(t,r-12,"sine",.38,.05,this.spb*3.6,0,music);
          if(i%4===0&&Math.random()<.1)tone(t,pick([64,67,69,71,72,76]),"sine",.04,.08,this.spb*2.2);
        }},
      chip:{nome:"8-bit",bpm:118,swing:0,cut:6500,wobble:0,wet:.06,
        progs:[{ch:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]],bs:[36,33,29,31]},
               {ch:[[53,57,60],[55,59,62],[52,55,59],[57,60,64]],bs:[29,31,28,33]}],
        play(i,t,ch,r){
          if(i===0||i===8||i===11)kick(t,.6,true);
          if(i===4||i===12)nz(t,"highpass",2200,.16,.07);
          tone(t,ch[i%ch.length]+12,"square",.028,.003,this.s16*.8,0,dry,true);
          if(i%2===0)tone(t,r+12+(i%4===2?12:0),"square",.045,.003,this.s16*1.6,0,dry,true);
          if(i%2===0&&Math.random()<.22)tone(t,pick([72,74,76,79,81,84]),"square",.025,.003,this.s16*2.5,0,dry,true);
        }}
    };
    Object.values(ST).forEach(s=>{s.spb=60/s.bpm;s.s16=s.spb/4;});
    function init(ctx){
      if(c)return;c=ctx;
      master=c.createGain();master.gain.value=vol();
      // No Android, só mídia tocada por um elemento <audio> ganha controles na notificação e na tela de bloqueio
      // e continua tocando com o navegador minimizado. Sem suporte, volta para a saída direta.
      try{
        if(c.createMediaStreamDestination&&typeof Audio!=="undefined"){
          const dst=c.createMediaStreamDestination();master.connect(dst);
          mediaEl=new Audio();mediaEl.srcObject=dst.stream;mediaEl.setAttribute("playsinline","");
        }else master.connect(c.destination);
      }catch(e){mediaEl=null;try{master.disconnect()}catch(_){}master.connect(c.destination);}
      const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;comp.connect(master);
      lp=c.createBiquadFilter();lp.type="lowpass";lp.Q.value=.5;lp.connect(comp);
      const lfo=c.createOscillator();lfoG=c.createGain();lfo.frequency.value=.07;lfo.connect(lfoG).connect(lp.frequency);lfo.start();
      music=c.createGain();music.gain.value=0;music.connect(lp);
      dry=c.createGain();dry.connect(music);
      pumpG=c.createGain();pumpG.connect(dry);
      const ir=c.createBuffer(2,c.sampleRate*2.6,c.sampleRate);
      for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);}
      const conv=c.createConvolver();conv.buffer=ir;wet=c.createGain();dry.connect(conv).connect(wet).connect(music);
      wow=c.createGain();wow.gain.value=7;const wo=c.createOscillator();wo.frequency.value=.55;wo.connect(wow);wo.start();
      noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
      fx(true);
    }
    function fx(now){const S=ST[cur],t=c.currentTime,k=now?.001:.6;
      lp.frequency.setTargetAtTime(S.cut,t,k);lfoG.gain.setTargetAtTime(S.wobble,t,k);wet.gain.setTargetAtTime(S.wet,t,k);}
    // Agendador: com a aba visível, agenda 0,2 s à frente (troca de estação responde rápido).
    // Em segundo plano o navegador atrasa os timers, então agenda 1,5 s à frente para não faltar nota.
    // O "tique" vem de um Web Worker, que sofre menos com essa desaceleração do que a página.
    let ticker=null,ticking=false;
    const ahead=()=>(typeof document!=="undefined"&&document.hidden)?1.5:.2;
    function startTick(){
      if(ticking)return;ticking=true;
      if(ticker===null){
        try{
          const src="let t=null;onmessage=e=>{clearInterval(t);if(e.data>0)t=setInterval(()=>postMessage(0),e.data)}";
          ticker=new Worker(URL.createObjectURL(new Blob([src],{type:"text/javascript"})));
          ticker.onmessage=sched;
          ticker.onerror=()=>{ticker=false;if(ticking){ticking=false;startTick();}};   // bloqueado: usa o timer da página
        }catch(e){ticker=false;}
      }
      if(ticker)ticker.postMessage(25);else timer=setInterval(sched,25);
    }
    function stopTick(){ticking=false;if(ticker)ticker.postMessage(0);clearInterval(timer);timer=null;}
    function sched(){const S=ST[cur];
      if(next<c.currentTime-.05){next=c.currentTime+.05;step=0;}   // ficou para trás: recomeça o compasso em vez de despejar notas atrasadas
      while(next<c.currentTime+ahead()){const P=S.progs[prog%S.progs.length];
        S.play(step,next+((step%4===2)?S.s16*S.swing:0),P.ch[bar],P.bs[bar]);
        next+=S.s16;step=(step+1)%16;
        if(step===0){bar=(bar+1)%4;if(bar===0){if(Math.random()<.5)prog=Math.floor(Math.random()*S.progs.length);if(S.onLoop)S.onLoop();}}}}
    function vol(){return (+document.getElementById("snd-vol").value||0)/100*.85;}
    return{
      init,ST,
      get station(){return cur},
      setStation(id){if(!ST[id])return;cur=id;prog=0;if(c){fx(false);}},
      setVol(){if(master)master.gain.setTargetAtTime(vol(),c.currentTime,.05);},
      duck(sec){if(!master)return;const n=c.currentTime;master.gain.cancelScheduledValues(n);master.gain.setValueAtTime(master.gain.value,n);master.gain.linearRampToValueAtTime(vol()*.15,n+.2);master.gain.setValueAtTime(vol()*.15,n+sec);master.gain.linearRampToValueAtTime(vol(),n+sec+1.2);},
      music(want){
        if(!c||want===on)return;on=want;const now=c.currentTime;
        music.gain.cancelScheduledValues(now);music.gain.setValueAtTime(music.gain.value,now);
        if(want){clearTimeout(stopT);if(!ticking){next=now+.06;step=0;bar=0;startTick();}music.gain.linearRampToValueAtTime(1,now+1.5);
          if(mediaEl){const pr=mediaEl.play();if(pr&&pr.catch)pr.catch(()=>{mediaEl=null;try{master.disconnect()}catch(_){}master.connect(c.destination);});}}
        else{music.gain.linearRampToValueAtTime(0,now+1);stopT=setTimeout(()=>{stopTick();if(mediaEl)mediaEl.pause();},1100);}
      }
    };
  })();
  let snd=Object.assign({lofi:true,vol:55,breaks:false,station:"classico"},store.get("capi-snd2",{}));
  Lofi.setStation(snd.station);
  $("#snd-vol").value=snd.vol;$("#mus-breaks").checked=snd.breaks;
  const allowed=m=>m==="pomo"||snd.breaks;
  function ensureAudio(){try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume();Lofi.init(ctx);}catch(e){}}
  function setPlaying(v){playing=v;Lofi.music(v);playerUI();render();}
  function playerUI(){
    $("#player").classList.toggle("on",playing);
    $("#mus-play").setAttribute("aria-label",playing?"Pausar lo-fi":"Tocar lo-fi");
    const S=Lofi.ST[Lofi.station];
    $("#st-name").textContent=S.nome;
    mediaUI();
    $("#mus-status").textContent=playing?("Tocando agora · "+S.bpm+" BPM"):(snd.lofi?("Toca junto com o timer · "+S.bpm+" BPM"):"Desligado · aperte play para ouvir");
  }
  function saveSnd(){store.set("capi-snd2",snd);playerUI();}
  // ---------- controles de mídia do sistema (notificação, tela de bloqueio, fones) ----------
  const MS=(typeof navigator!=="undefined"&&navigator.mediaSession)?navigator.mediaSession:null;
  const MODE_LABEL={pomo:"Pomodoro",short:"Pausa curta",long:"Pausa longa"};
  let mediaKey="";
  function mediaUI(){try{mediaSync()}catch(e){}}   // render() pode rodar antes da rádio existir
  function mediaSync(){
    if(!MS)return;
    const S=Lofi.ST[Lofi.station],album=MODE_LABEL[mode]+" · "+(running?"timer rodando":"timer parado"),key=S.nome+"|"+album+"|"+playing;
    if(key===mediaKey)return;mediaKey=key;
    try{
      if(typeof MediaMetadata!=="undefined")MS.metadata=new MediaMetadata({title:S.nome,artist:"Capi Rádio · Capifocus",album,
        artwork:[{src:"assets/mascot/capy-radio.png",sizes:"1254x1254",type:"image/png"}]});
      MS.playbackState=playing?"playing":"paused";
    }catch(e){}
  }
  function mediaAction(name,fn){try{MS.setActionHandler(name,fn)}catch(e){}}
  if(MS){
    mediaAction("play",()=>{ensureAudio();setPlaying(true);snd.lofi=true;saveSnd();});
    mediaAction("pause",()=>{setPlaying(false);snd.lofi=false;saveSnd();});
    mediaAction("stop",()=>{setPlaying(false);snd.lofi=false;saveSnd();});
    mediaAction("nexttrack",()=>tune(1));
    mediaAction("previoustrack",()=>tune(-1));
  }
  $("#mus-play").addEventListener("click",()=>{ensureAudio();setPlaying(!playing);snd.lofi=playing;saveSnd();});
  $("#snd-vol").addEventListener("input",()=>{snd.vol=+$("#snd-vol").value;Lofi.setVol();saveSnd();});
  $("#mus-breaks").addEventListener("change",()=>{snd.breaks=$("#mus-breaks").checked;saveSnd();
    if(playing&&!allowed(mode))setPlaying(false);
    else if(!playing&&snd.lofi&&running&&allowed(mode)){ensureAudio();setPlaying(true);}});
  // o som acompanha o timer
  function musicFollow(){if(running&&!playing&&snd.lofi&&allowed(mode))setPlaying(true);}
  $("#main").addEventListener("click",()=>{
    if(running)musicFollow();
    else if(playing&&!snd.breaks)setPlaying(false);   // pausou com "Tocar nas pausas" desligado: a música para junto
  });
  $("#reset").addEventListener("click",()=>{if(playing&&!snd.breaks)setPlaying(false);});
  const _finish=finish;finish=function(){_finish();if(playing&&!allowed(mode))setPlaying(false);};
  const ST_IDS=Object.keys(Lofi.ST);
  function tune(dir){const i=(ST_IDS.indexOf(Lofi.station)+dir+ST_IDS.length)%ST_IDS.length;snd.station=ST_IDS[i];Lofi.setStation(snd.station);
    const n=$("#st-name");n.classList.remove("swap");void n.offsetWidth;n.classList.add("swap");saveSnd();}
  $("#st-prev").addEventListener("click",()=>tune(-1));$("#st-next").addEventListener("click",()=>tune(1));
  playerUI();
  $("#al-sound").value=alarm.sound;$("#al-rep").value=alarm.rep;$("#al-vol").value=alarm.vol;
  function readAlarm(){alarm={sound:$("#al-sound").value,rep:Math.min(10,Math.max(1,parseInt($("#al-rep").value)||1)),vol:+$("#al-vol").value};store.set("capi-alarm",alarm);}
  ["#al-sound","#al-rep","#al-vol"].forEach(id=>$(id).addEventListener("change",readAlarm));
  $("#al-test").addEventListener("click",()=>{readAlarm();const r=alarm.rep;alarm.rep=1;chime();alarm.rep=r;});
  // ---------- temas de cor ----------
  const {THEMES,customTheme,lum}=CapiTheme;
  function validHex(v,fallback="#a28bd4"){return typeof v==="string"&&/^#[0-9a-fA-F]{6}$/.test(v)?v.toLowerCase():fallback;}
  let theme=store.get("capi-theme",{id:"lavanda",custom:"#a28bd4"});
  if(!theme||typeof theme!=="object")theme={id:"lavanda",custom:"#a28bd4"};
  theme={id:(theme.id==="custom"||Object.prototype.hasOwnProperty.call(THEMES,theme.id))?theme.id:"lavanda",custom:validHex(theme.custom)};
  function applyTheme(){
    const t=theme.id==="custom"?customTheme(theme.custom):(THEMES[theme.id]||THEMES.lavanda);
    const r=document.documentElement.style;
    ["pomo","short","long"].forEach(m=>{r.setProperty("--bg-"+m,t[m][0]);r.setProperty("--acc-"+m,t[m][1]);lightModes[m]=lum(t[m][0])>.5;});
    if(typeof render==="function")render();
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",t.pomo[0]);
    document.querySelectorAll(".theme").forEach(b=>b.setAttribute("aria-pressed",b.dataset.theme===theme.id));
  }
  function renderThemes(){
    const box=$("#themes");box.replaceChildren();
    const c=el("label",{className:"theme custom"},{for:"theme-custom"});c.dataset.theme="custom";
    const sw=el("span",{className:"sw"});
    const input=el("input",{id:"theme-custom",type:"color",value:validHex(theme.custom)},{"aria-label":"Escolher cor personalizada"});
    sw.appendChild(input);c.append(sw,"Sua cor");box.appendChild(c);
    input.addEventListener("input",e=>{const v=validHex(e.target.value,null);if(!v)return;theme={id:"custom",custom:v};store.set("capi-theme",theme);applyTheme();});
    Object.entries(THEMES).forEach(([id,t])=>{
      const b=el("button",{type:"button",className:"theme"});b.dataset.theme=id;
      const swatch=el("span",{className:"sw"});swatch.style.background="conic-gradient("+t.pomo[0]+" 0 33%,"+t.short[0]+" 0 66%,"+t.long[0]+" 0)";
      b.append(swatch,t.nome);
      b.addEventListener("click",()=>{theme.id=id;store.set("capi-theme",theme);applyTheme();});
      box.appendChild(b);
    });
  }
  // carrossel de temas
  function themeNav(){const b=$("#themes"),max=b.scrollWidth-b.clientWidth-2;
    $("#th-prev").hidden=b.scrollLeft<=2;$("#th-next").hidden=b.scrollLeft>=max;
    b.style.setProperty("--fl",b.scrollLeft>2?"28px":"0px");b.style.setProperty("--fr",b.scrollLeft<max?"28px":"0px");}
  function themeStep(dir){const b=$("#themes");b.scrollBy({left:dir*Math.max(140,b.clientWidth*.7),behavior:"smooth"});}
  $("#th-prev").addEventListener("click",()=>themeStep(-1));$("#th-next").addEventListener("click",()=>themeStep(1));
  $("#themes").addEventListener("scroll",themeNav,{passive:true});window.addEventListener("resize",themeNav);
  function showActiveTheme(){const b=$("#themes"),a=b.querySelector('[aria-pressed="true"]');
    b.style.scrollBehavior="auto";b.scrollLeft=0;if(a){const r=a.offsetLeft-b.offsetLeft+a.offsetWidth+36;if(r>b.clientWidth)b.scrollLeft=r-b.clientWidth;}b.style.scrollBehavior="";themeNav();}
  $("#btn-settings").addEventListener("click",()=>requestAnimationFrame(showActiveTheme));
  renderThemes();applyTheme();
  // ciclo e notificação nos ajustes
  function everyHint(){const n=Math.min(10,Math.max(2,parseInt($("#set-every").value)||4))-1;
    $("#every-hint").textContent=n+(n===1?" pausa curta":" pausas curtas")+" e depois 1 pausa longa";}
  $("#set-every").addEventListener("input",everyHint);
  $("#set-every").value=flow.longEvery;everyHint();$("#auto-break").checked=flow.autoBreak;$("#auto-pomo").checked=flow.autoPomo;
  $("#notify-on").checked=flow.notify&&typeof Notification!=="undefined"&&Notification.permission==="granted";
  $("#notify-on").addEventListener("change",()=>{
    const box=$("#notify-on"),setN=v=>{flow.notify=v;box.checked=v;store.set("capi-flow",flow);};
    if(!box.checked)return setN(false);
    if(typeof Notification==="undefined"){setN(false);return toast("Este navegador não suporta notificações.");}
    if(Notification.permission==="granted")return setN(true);
    if(Notification.permission==="denied"){setN(false);return toast("As notificações estão bloqueadas para este site nas configurações do navegador.");}
    Promise.resolve(Notification.requestPermission()).then(p=>{if(p==="granted")setN(true);else{setN(false);toast("Sem permissão, o Capifocus avisa só com o alarme.");}}).catch(()=>setN(false));
  });
  // confirmação de troca de aba
  $("#confirm").hidden=true;
  $("#cf-ok").addEventListener("click",()=>closeConfirm(true));
  $("#cf-cancel").addEventListener("click",()=>closeConfirm(false));
  $("#cf-back").addEventListener("click",()=>closeConfirm(false));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&pendingMode)closeConfirm(false);});
  // Wake Lock é solto pelo navegador quando a aba some; ao voltar, pede de novo
  document.addEventListener("visibilitychange",syncWake);
  // retoma o timer salvo
  (function restoreTimer(){
    const sv=store.get("capi-timer",null);
    if(!sv||!MSG[sv.mode])return;
    const tot=+sv.total,lf=+sv.left;
    if(!(tot>0)||!(lf>=0)||lf>tot)return;
    mode=sv.mode;total=tot;left=lf;
    if(!sv.running&&left===total){left=total=mins[mode]*60;return;}   // zerado: usa os tempos atuais
    if(sv.running&&+sv.endAt>0){
      const rem=Math.round((+sv.endAt-Date.now())/1000);
      if(rem>0){left=Math.min(rem,total);endAt=+sv.endAt;running=true;clearInterval(tick);tick=setInterval(step,250);}
      else{
        const was=TITLE_MODE[mode];left=0;quiet=true;finish();quiet=false;   // terminou com o app fechado: registra sem tocar alarme
        toast("O "+(was==="Foco"?"foco":was.toLowerCase())+" terminou enquanto o Capifocus estava fechado.");
      }
    }
  })();
  renderTasks();render();
})();
