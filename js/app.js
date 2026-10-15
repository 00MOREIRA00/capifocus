// Capifocus: módulo principal. Liga o timer, as tarefas, a Capi Rádio, os temas e os ajustes à página.
// CapiMascot (js/components/mascot.js) e CapiTheme (js/theme.js) são scripts clássicos carregados antes,
// para o mascote e o tema aparecerem antes deste módulo.
import {$,store,el,toast} from "./dom.js";
import {TITLE_MODE,fmt,clampLongEvery,clampMinutes,nextStage,remaining,titleFor,restoreState,validateDurations} from "./timer.js";
import {sanitizeStats,addPomodoro,lastDays,streak} from "./stats.js";
import {renderTaskList,moveItem} from "./tasks.js";
import {createLofi} from "./lofi.js";

const mascot=CapiMascot.create($(".capy-stage"),{onGrumpy:()=>grumble()});
let playing=false;
const MSG={pomo:"Hora de focar!",short:"Hora de uma pausa!",long:"Pausa longa. Hora de relaxar."};
let mins=store.get("capi-mins",{pomo:25,short:5,long:15});
let tasks=store.get("capi-tasks",[]);
tasks=tasks.map(t=>({...t,name:String(t.name).slice(0,120)}));
store.set("capi-tasks",tasks);
let activeId=store.get("capi-active",tasks[0]?tasks[0].id:null);
let count=store.get("capi-count",1);
const lightModes={pomo:false,short:false,long:false};   // modo com fundo claro (texto escuro), calculado pelo tema
let mode="pomo", left=mins.pomo*60, total=left, running=false, endAt=0, tick=null;

// ciclo: pausa longa a cada N focos, início automático e notificação (#17, #14)
let flow=Object.assign({longEvery:4,autoBreak:false,autoPomo:false,notify:false},store.get("capi-flow",{}));
flow.longEvery=clampLongEvery(flow.longEvery);
let autoT=null,quiet=false;
// estatísticas por dia (#18)
let stats=sanitizeStats(store.get("capi-stats",null));
const WEEKDAY=["dom","seg","ter","qua","qui","sex","sáb"];
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
  const opts={body:NOTIFY_MSG[next],icon:"assets/icons/icon-192.png",badge:"assets/icons/icon-192.png",tag:"capifocus-ciclo",renotify:true};
  const sw=typeof navigator!=="undefined"&&navigator.serviceWorker;
  // No Android só o service worker pode notificar; no computador ele também é o caminho preferido.
  if(sw&&sw.controller&&sw.ready)return sw.ready.then(r=>r.showNotification("Capifocus",opts)).catch(()=>plainNotify(opts));
  plainNotify(opts);
}catch(e){}}
function plainNotify(opts){try{const n=new Notification("Capifocus",opts);n.onclick=()=>{try{window.focus()}catch(e){}n.close();};}catch(e){}}
// confirmação ao trocar de aba com o timer rodando (#10)
let pendingMode=null;
let lastTitle="";
function updateTitle(){
  const t=titleFor({running,left,total,mode});
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
  left=remaining(endAt,Date.now());
  if(left===0){finish();return}
  render();
}
var finish=function(){
  const completedNaturally=!skipping,loud=completedNaturally&&!quiet;
  stop();if(loud){chime();mascot.complete();}skipping=false;
  const nx=nextStage({mode,completed:completedNaturally,count,longEvery:flow.longEvery});
  if(nx.credit){
    const a=tasks.find(t=>t.id===activeId);if(a){a.act++;saveTasks();}
    count=nx.count;store.set("capi-count",count);
    creditStats(quiet&&endAt?new Date(endAt):new Date());
  }
  setMode(nx.mode,true);
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
function saveTasks(){store.set("capi-tasks",tasks);store.set("capi-active",activeId);renderTasks();render();}
function renderTasks(){
  const completed=tasks.filter(t=>t.done).length;
  $("#clear-done").hidden=!completed;
  $("#clear-done").textContent="Limpar concluídas ("+completed+")";
  renderTaskList({tasks,activeId,mins,
    onSelect:t=>{activeId=t.id;saveTasks();},
    onToggle:(t,r)=>{t.done=!t.done;saveTasks();if(t.done)celebrate(t.id,r);},
    onDelete:t=>{tasks=tasks.filter(x=>x.id!==t.id);if(activeId===t.id)activeId=tasks[0]?tasks[0].id:null;saveTasks();},
    onReorder:(from,to,id)=>{tasks=moveItem(tasks,from,to);saveTasks();
      const li=document.querySelector('.task[data-id="'+id+'"]');if(li&&li.focus)try{li.focus({preventScroll:true})}catch(e){}}});
}
$("#add").addEventListener("click",()=>{$("#newtask").hidden=false;$("#add").hidden=true;$("#nt-name").focus();});
$("#nt-cancel").addEventListener("click",()=>{$("#newtask").hidden=true;$("#add").hidden=false;});
function updateNameRemaining(){
  const input=$("#nt-name");input.value=input.value.slice(0,120);
  $("#nt-remaining").textContent=(120-input.value.length)+" caracteres restantes";
}
$("#nt-name").addEventListener("input",updateNameRemaining);
$("#clear-done").addEventListener("click",()=>{
  const removed=tasks.map((task,index)=>({task,index})).filter(x=>x.task.done);
  if(!removed.length||!window.confirm("Limpar "+removed.length+" tarefa(s) concluída(s)?"))return;
  const previousActive=activeId;
  tasks=tasks.filter(t=>!t.done);
  const activeRemoved=removed.some(x=>x.task.id===activeId);
  if(activeRemoved)activeId=tasks[0]?tasks[0].id:null;
  saveTasks();$("#add").focus();
  toast("Tarefas concluídas removidas.",{label:"Desfazer",run:()=>{
    removed.forEach(({task,index})=>tasks.splice(Math.min(index,tasks.length),0,task));
    if(activeRemoved)activeId=previousActive;
    saveTasks();$("#clear-done").focus();
  }},8000);
});
$("#newtask").addEventListener("submit",e=>{e.preventDefault();const n=$("#nt-name").value.trim().slice(0,120);if(!n)return;
  const t={id:Date.now(),name:n,est:Math.max(1,+$("#nt-est").value||1),act:0,done:false};tasks.push(t);if(!activeId)activeId=t.id;
  $("#nt-name").value="";updateNameRemaining();$("#nt-est").value=1;$("#newtask").hidden=true;$("#add").hidden=false;saveTasks();});

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
  document.body.classList.remove("grumpy");clearTimeout(grumbleT);
  mascot.complete();
  document.body.classList.add("celebrate");clearTimeout(cheerT);
  cheerT=setTimeout(()=>document.body.classList.remove("celebrate"),1900);
  if(!matchMedia("(prefers-reduced-motion: reduce)").matches)confetti(r.left+r.width/2,r.top+r.height/2);
  doneSound();
}
// ---------- capivara bolada (#8): cliques demais viram reclamação ----------
const GRUMBLES=["Ô, para de me cutucar!","Tô focando aqui, pô!","Mais um clique e eu tiro o fone.","Capivara também tem limite!","Vai fazer sua tarefa, vai!"];
// easter egg: a cada 3 reclamações, a proposta de paz
const PLUS_GRUMBLE="Paga o plano Plus que talvez eu reclame menos.";
let grumbles=0,grumbleT;
function grumble(){
  grumbles++;
  $("#cheer").textContent=grumbles%3===0?PLUS_GRUMBLE:GRUMBLES[Math.floor(Math.random()*GRUMBLES.length)];
  document.body.classList.remove("celebrate");clearTimeout(cheerT);
  document.body.classList.add("grumpy");clearTimeout(grumbleT);
  grumbleT=setTimeout(()=>document.body.classList.remove("grumpy"),CapiMascot.GRUMPY_TIME);
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
$("#save-settings").addEventListener("click",()=>{
  const next={pomo:clampMinutes($("#set-pomo").value,25),short:clampMinutes($("#set-short").value,5),long:clampMinutes($("#set-long").value,15)};
  // tempos fora do acordo (#28): não salva nada e mostra o que ajustar
  const problems=validateDurations(next);
  ["pomo","short","long"].forEach(k=>$("#set-"+k).setAttribute("aria-invalid",String(problems.some(p=>p.field===k))));
  $("#set-error").textContent=problems.map(p=>p.message).join(" ");
  $("#set-error").hidden=!problems.length;
  if(problems.length){try{$("#set-"+problems[0].field).focus()}catch(e){}return;}
  mins=next;store.set("capi-mins",mins);
  flow.longEvery=clampLongEvery($("#set-every").value);$("#set-every").value=flow.longEvery;everyHint();
  flow.autoBreak=!!$("#auto-break").checked;flow.autoPomo=!!$("#auto-pomo").checked;store.set("capi-flow",flow);
  setSettings(false);
  // não mexe num timer em andamento: os novos tempos valem a partir da próxima etapa
  if(!running&&left===total){left=total=mins[mode]*60;saveTimer();render();}
  else if(mins[mode]*60!==total)toast("Ajustes salvos. O novo tempo vale ao reiniciar ou na próxima etapa.");
  renderTasks();
});

// ---------- Capi Rádio: estações geradas no navegador ----------
const Lofi=createLofi(()=>(+$("#snd-vol").value||0)/100*.85);
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
const {THEMES,lum,resolve:resolveTheme,uniform}=CapiTheme;
function validHex(v,fallback="#a28bd4"){return typeof v==="string"&&/^#[0-9a-fA-F]{6}$/.test(v)?v.toLowerCase():fallback;}
let theme=store.get("capi-theme",{id:"lavanda",custom:"#a28bd4"});
if(!theme||typeof theme!=="object")theme={id:"lavanda",custom:"#a28bd4"};
theme={id:(theme.id==="custom"||Object.prototype.hasOwnProperty.call(THEMES,theme.id))?theme.id:"lavanda",custom:validHex(theme.custom),same:theme.same===true};
function applyTheme(){
  const t=resolveTheme(theme);
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
  input.addEventListener("input",e=>{const v=validHex(e.target.value,null);if(!v)return;theme={id:"custom",custom:v,same:theme.same};store.set("capi-theme",theme);applyTheme();});
  Object.entries(THEMES).forEach(([id,t])=>{
    const b=el("button",{type:"button",className:"theme"});b.dataset.theme=id;
    const swatch=el("span",{className:"sw"});const v=theme.same?uniform(t):t;swatch.style.background=v.pomo[0]===v.short[0]&&v.pomo[0]===v.long[0]?v.pomo[0]:"conic-gradient("+v.pomo[0]+" 0 33%,"+v.short[0]+" 0 66%,"+v.long[0]+" 0)";
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
// mesma cor em Pomodoro e pausas (#29)
$("#theme-same").checked=theme.same;
$("#theme-same").addEventListener("change",()=>{theme.same=!!$("#theme-same").checked;store.set("capi-theme",theme);renderThemes();applyTheme();});
// limpa o aviso de tempos ao editar os campos
["pomo","short","long"].forEach(k=>$("#set-"+k).addEventListener("input",()=>{$("#set-error").hidden=true;["pomo","short","long"].forEach(j=>$("#set-"+j).setAttribute("aria-invalid","false"));}));
// ciclo e notificação nos ajustes
function everyHint(){const n=clampLongEvery($("#set-every").value)-1;
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
  const st=restoreState(store.get("capi-timer",null),mins,Date.now());
  if(!st)return;
  mode=st.mode;total=st.total;left=st.left;
  if(st.running){endAt=st.endAt;running=true;clearInterval(tick);tick=setInterval(step,250);}
  else if(st.expired){
    endAt=st.endAt;const was=TITLE_MODE[mode];quiet=true;finish();quiet=false;   // terminou com o app fechado: registra sem tocar alarme
    toast("O "+(was==="Foco"?"foco":was.toLowerCase())+" terminou enquanto o Capifocus estava fechado.");
  }
})();
// ---------- estatísticas (#18) ----------
function creditStats(date){stats=addPomodoro(stats,date);store.set("capi-stats",stats);renderStats();}
function renderStats(){
  const today=new Date(),days=lastDays(stats,today,7),max=Math.max(1,...days.map(d=>d.count));
  const tot=days.reduce((s,d)=>s+d.count,0),seq=streak(stats,today);
  $("#st-today").textContent=String(days[6].count);
  $("#st-week").textContent=String(tot);
  $("#st-streak").textContent=String(seq);
  $("#st-streak-label").textContent=seq===1?"dia seguido":"dias seguidos";
  const week=$("#week");week.replaceChildren();
  days.forEach((d,i)=>{
    const label=(i===6?"Hoje":WEEKDAY[d.date.getDay()]+" "+d.date.getDate())+": "+d.count+(d.count===1?" pomodoro":" pomodoros");
    const col=el("div",{className:"wk"+(i===6?" today":"")+(d.count?"":" zero"),title:label},{role:"listitem","aria-label":label});
    const bar=el("span",{className:"wk-bar"});bar.style.height=(d.count?Math.max(8,d.count/max*100):0)+"%";
    const val=el("span",{className:"wk-val",textContent:d.count?String(d.count):""});
    const lab=el("span",{className:"wk-day",textContent:i===6?"hoje":WEEKDAY[d.date.getDay()]});
    const area=el("span",{className:"wk-area"});area.append(val,bar);
    col.append(area,lab);week.appendChild(col);
  });
}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)renderStats();});   // vira o dia com o app aberto
renderStats();
// ---------- app instalável e offline (#19) ----------
if(typeof navigator!=="undefined"&&navigator.serviceWorker&&typeof location!=="undefined"&&/^https?:$/.test(location.protocol)){
  window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{});});
}
renderTasks();render();
