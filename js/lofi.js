// Capi Rádio: música gerada ao vivo com a Web Audio API, sem arquivos de áudio.
// createLofi(getVolume) devolve o controle da rádio; getVolume() informa o volume de 0 a 1.
export function createLofi(getVolume){
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
  // sino de igreja ao longe: grave, com parciais "desafinadas" e decaimento longo
  function churchBell(t,m,v){[[0,1,3.2],[12,.45,2.2],[15,.28,1.8],[19,.2,1.4],[24,.12,1]].forEach(([d,a,len])=>tone(t,m+d,"sine",v*a,.006,len,0,dry,true));}
  // cravo: corda beliscada, brilhante no ataque e escurecendo rápido
  function harpsi(t,m,v){const fl=c.createBiquadFilter();fl.type="lowpass";fl.Q.value=2;fl.frequency.setValueAtTime(3400,t);fl.frequency.exponentialRampToValueAtTime(700,t+.45);
    const g=c.createGain();env(g,t,v,.004,.7);fl.connect(g).connect(dry);
    [["sawtooth",1,0],["square",2,.35],["sawtooth",1,4]].forEach(([type,mul,amp],j)=>{const o=c.createOscillator(),og=c.createGain();o.type=type;o.frequency.value=f(m)*mul;o.detune.value=j===2?6:0;og.gain.value=amp||1;o.connect(og).connect(fl);o.start(t);o.stop(t+.75);});}
  // violino: serra filtrada, arco entrando devagar e vibrato que aparece depois do ataque
  function violin(t,m,len,v){const o=c.createOscillator(),fl=c.createBiquadFilter(),g=c.createGain(),vb=c.createOscillator(),vg=c.createGain();
    o.type="sawtooth";o.frequency.value=f(m);fl.type="lowpass";fl.frequency.value=1800;fl.Q.value=1;
    vb.frequency.value=5.6;vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(f(m)*.012,t+Math.min(.35,len*.5));vb.connect(vg).connect(o.frequency);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+Math.min(.3,len*.35));g.gain.setValueAtTime(v,t+len*.7);g.gain.exponentialRampToValueAtTime(.0001,t+len);
    o.connect(fl).connect(g).connect(dry);o.start(t);vb.start(t);o.stop(t+len+.05);vb.stop(t+len+.05);}
  // órgão de igreja: fundamental, oitava e quinta, entrando devagar
  function organ(t,notes,len,lvl){notes.forEach(m=>{tone(t,m,"sine",.03*lvl,.35,len,0,dry,true);tone(t,m+12,"sine",.018*lvl,.35,len,0,dry,true);tone(t,m+19,"sine",.008*lvl,.35,len*.8,0,dry,true);});}
  // vento: ruído filtrado com o filtro passeando, como uma rajada que vem e vai
  function wind(t,len,v){const s=c.createBufferSource();s.buffer=noise;s.loop=true;const bp=c.createBiquadFilter();bp.type="bandpass";bp.Q.value=7;
    bp.frequency.setValueAtTime(380,t);bp.frequency.linearRampToValueAtTime(900+Math.random()*500,t+len*.45);bp.frequency.linearRampToValueAtTime(420,t+len);
    const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+len*.4);g.gain.linearRampToValueAtTime(.0001,t+len);
    s.connect(bp).connect(g).connect(music);s.start(t,Math.random());s.stop(t+len+.05);}
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
    // estação de temporada: só aparece na rádio durante o Halloween.
    // Valsa gótica de castelo na Transilvânia, lenta e calma, em compasso de 3 (12 semicolcheias):
    // cravo macio no "um-dois-três", órgão por baixo, violino cigano na escala menor húngara,
    // coro grave e, bem ao fundo, vento e o sino da meia-noite.
    transilvania:{nome:"Transilvânia",season:"halloween",bpm:66,steps:12,swing:0,cut:2800,wobble:180,wet:.58,
      progs:[{ch:[[62,65,69],[55,58,62],[57,61,64,67],[62,65,69]],bs:[38,43,45,38]},    // Dm, Gm, A7, Dm
             {ch:[[62,65,69],[58,62,65],[55,58,62],[57,61,64,67]],bs:[38,46,43,45]},    // Dm, Bb, Gm, A7
             {ch:[[62,65,69],[63,67,70],[57,61,64,67],[62,65,69]],bs:[38,39,45,38]}],   // Dm, Eb, A7, Dm
      // ré menor húngara: ré, mi, fá, sol sustenido, lá, si bemol, dó sustenido (as segundas aumentadas dão o sotaque)
      gypsy:[62,64,65,68,69,70,73,74,76,77],
      last:69,
      play(i,t,ch,r){
        // valsa: baixo macio no um, cravo leve no dois e no três
        if(i===0){harpsi(t,r-12,.06);tone(t,r-12,"sine",.2,.03,this.spb*2.8,0,music);}
        if(i===4||(i===8&&Math.random()<.7))ch.forEach((m,j)=>harpsi(t+j*.012,m,.026));
        // órgão grave segurando o acorde
        if(i===0)organ(t,ch.map(m=>m-12),this.spb*3.1,.9);
        // arpejo do cravo descendo devagar no fim da frase
        if(bar===3&&i%2===0&&Math.random()<.7){const dn=ch.concat(ch.map(m=>m+12)).reverse();harpsi(t,dn[(i/2)%dn.length],.022);}
        // violino: frases longas na escala húngara, andando por graus perto da nota anterior
        if((i===0||(i===6&&Math.random()<.45))&&bar!==3&&Math.random()<.7){
          const sc=this.gypsy,k=sc.indexOf(this.last),nk=Math.max(0,Math.min(sc.length-1,(k<0?4:k)+pick([-1,-1,1,1,2,-2])));
          this.last=sc[nk];violin(t,this.last,i===0?this.spb*2.7:this.spb*1.4,.03);}
        // coro grave "aah" no começo de cada volta
        if(i===0&&bar===0)vox(t,ch[0]-12,this.spb*3.2,"a");
        // bem ao fundo: vento e, de vez em quando, o sino da meia-noite
        if(i===0&&bar%2===0)wind(t,this.spb*6.5,.03);
        if(i===0&&bar===0&&Math.random()<.3)churchBell(t+this.spb,pick([38,43]),.045);
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
      next+=S.s16;step=(step+1)%(S.steps||16);
      if(step===0){bar=(bar+1)%4;if(bar===0){if(Math.random()<.5)prog=Math.floor(Math.random()*S.progs.length);if(S.onLoop)S.onLoop();}}}}
  const vol=()=>getVolume();
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
}
