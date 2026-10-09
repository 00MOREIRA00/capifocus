(function(){
  const THEMES={
    lavanda:{nome:"Lavanda",pomo:["#a28bd4","#6f55ad"],short:["#8f9be0","#5662b0"],long:["#b78ad6","#8150a6"]},
    menta:{nome:"Menta",pomo:["#5fb3a0","#2b7563"],short:["#62a8c4","#2d6c86"],long:["#79b884","#3c7448"]},
    oceano:{nome:"Oceano",pomo:["#4f8fd1","#24589a"],short:["#45a3bf","#1d6780"],long:["#6c7fd6","#3a4aa0"]},
    sunset:{nome:"Pôr do sol",pomo:["#de8668","#a3442a"],short:["#dc9a52","#9a5a1c"],long:["#d77894","#983a57"]},
    morango:{nome:"Morango",pomo:["#de7389","#a1364e"],short:["#d488b0","#944573"],long:["#c287d3","#7a4291"]},
    noite:{nome:"Noite",pomo:["#3d3656","#3d3656"],short:["#2f3c58","#2f3c58"],long:["#4a3a5e","#4a3a5e"]},
    preto:{nome:"Preto",pomo:["#111111","#111111"],short:["#1c1c1f","#1c1c1f"],long:["#18161c","#18161c"]},
    branco:{nome:"Branco",pomo:["#ffffff","#6f55ad"],short:["#f6f6f9","#5662b0"],long:["#faf7fc","#8150a6"]}
  };
  function hexToHsl(h){const r=parseInt(h.slice(1,3),16)/255,g=parseInt(h.slice(3,5),16)/255,b=parseInt(h.slice(5,7),16)/255;
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let H=0,S=0;
    if(mx!==mn){const d=mx-mn;S=l>.5?d/(2-mx-mn):d/(mx+mn);H=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;H*=60;}
    return[H,S*100,l*100];}
  const hsl=(h,s,l)=>`hsl(${((h%360)+360)%360} ${Math.round(s)}% ${Math.round(l)}%)`;
  function hslHex(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(100,s))/100;l=Math.max(0,Math.min(100,l))/100;
    const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
    return"#"+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("");}
  function lum(hex){const c=[1,3,5].map(i=>{const v=parseInt(hex.slice(i,i+2),16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
  function customTheme(hex){
    const [h,s,l]=hexToHsl(hex);
    const gray=s<8;                                   // preto, branco e cinzas: varia só o brilho
    const dl=l>85?-3:l<15?4:2;                        // pausas ficam um pouco mais claras/escuras
    const bg=(dh,k)=>gray?hslHex(h,s,l+dl*k):hslHex(h+dh,s,l+(k===1?2:0));
    const light=lum(hex)>.5;
    const acc=c=>{const [hh,ss,ll]=hexToHsl(c);return light?hslHex(hh,Math.min(ss,60),Math.min(ll,32)):(ll<28?c:hslHex(hh,ss+5,ll-26));};
    const P=hex,S=bg(-22,1),L=bg(24,2);
    return{nome:"Personalizada",pomo:[P,acc(P)],short:[S,acc(S)],long:[L,acc(L)]};
  }
  window.CapiTheme={THEMES,customTheme,lum};
  let saved;
  try { saved=JSON.parse(localStorage.getItem('capi-theme') || 'null'); } catch (_) {}
  const color = saved && saved.id === 'custom' && /^#[0-9a-f]{6}$/i.test(saved.custom)
    ? customTheme(saved.custom) : (THEMES[saved && saved.id] || THEMES.lavanda);
  const root=document.documentElement.style;
  ['pomo','short','long'].forEach(mode=>{
    root.setProperty('--bg-'+mode,color[mode][0]);
    root.setProperty('--acc-'+mode,color[mode][1]);
  });
  root.setProperty('--bg',color.pomo[0]);
  root.setProperty('--accent-ink',color.pomo[1]);
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',color.pomo[0]);
})();
