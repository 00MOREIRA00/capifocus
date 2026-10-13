// Lista de tarefas e resumo. Recebe os dados e os callbacks do app; não guarda estado.
import {$,el,checkIcon} from "./dom.js";

// Move um item de "from" para "to" (posições na lista) e devolve uma nova lista.
export function moveItem(list,from,to){
  const out=list.slice();if(from<0||from>=out.length)return out;
  to=Math.max(0,Math.min(out.length-1,to));const [m]=out.splice(from,1);out.splice(to,0,m);return out;
}

// Arrastar para reordenar (mouse e toque, via Pointer Events).
// Mouse: começa ao mover alguns pixels com o botão apertado. Toque: segurar ~0,3 s e arrastar,
// para não atrapalhar a rolagem da página. Botões dentro do cartão não iniciam o arraste.
const LONG_PRESS=280,SLOP=6;
function enableDrag(li,ul,onDrop){
  let pid=null,startX=0,startY=0,dragging=false,touch=false,hold=null,from=-1;
  const isButton=t=>!!(t&&t.closest&&t.closest("button"));
  li.addEventListener("pointerdown",e=>{
    if(pid!==null||isButton(e.target)||(e.pointerType==="mouse"&&e.button!==0))return;
    pid=e.pointerId;startX=e.clientX;startY=e.clientY;touch=e.pointerType!=="mouse";
    if(touch)hold=setTimeout(begin,LONG_PRESS);
  });
  li.addEventListener("pointermove",e=>{
    if(e.pointerId!==pid)return;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    if(!dragging){
      if(touch){if(Math.hypot(dx,dy)>SLOP)reset();return;}   // dedo andou antes da hora: é rolagem
      if(Math.abs(dy)<=SLOP)return;
      begin();
    }
    e.preventDefault();move(e.clientY);
  });
  li.addEventListener("touchmove",e=>{if(dragging)e.preventDefault();},{passive:false});   // impede a página de rolar durante o arraste
  li.addEventListener("pointerup",e=>{if(e.pointerId===pid)finish();});
  li.addEventListener("pointercancel",e=>{if(e.pointerId===pid)finish();});
  function begin(){
    dragging=true;from=[...ul.children].indexOf(li);
    try{li.setPointerCapture(pid)}catch(e){}
    li.classList.add("dragging");ul.classList.add("sorting");
    try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}
  }
  function move(y){
    li.style.transform="translateY("+(y-startY)+"px) scale(1.02)";
    const others=[...ul.children].filter(n=>n!==li);
    let before=null;
    for(const n of others){const r=n.getBoundingClientRect();if(y<r.top+r.height/2){before=n;break;}}
    if(before===li.nextElementSibling||(before===null&&li===ul.lastElementChild))return;
    // troca de lugar com animação (FLIP) e mantém o cartão sob o dedo/cursor
    const tops=new Map(others.map(n=>[n,n.getBoundingClientRect().top]));
    const prev=li.getBoundingClientRect().top-(y-startY);
    ul.insertBefore(li,before);
    const now=li.getBoundingClientRect().top-(y-startY);
    startY+=now-prev;li.style.transform="translateY("+(y-startY)+"px) scale(1.02)";
    if(!(typeof matchMedia!=="undefined"&&matchMedia("(prefers-reduced-motion: reduce)").matches))
      others.forEach(n=>{const d=tops.get(n)-n.getBoundingClientRect().top;if(d&&n.animate)n.animate([{transform:"translateY("+d+"px)"},{transform:"none"}],{duration:160,easing:"ease-out"});});
  }
  function finish(){
    const was=dragging;reset();
    if(!was)return;
    li.classList.remove("dragging");ul.classList.remove("sorting");li.style.transform="";
    // o clique que vem logo depois do arraste não deve selecionar a tarefa
    li.addEventListener("click",e=>{e.stopPropagation();e.preventDefault();},{capture:true,once:true});
    const to=[...ul.children].indexOf(li);
    if(to!==from)onDrop(from,to);
  }
  function reset(){clearTimeout(hold);hold=null;dragging=false;try{if(pid!==null)li.releasePointerCapture(pid)}catch(e){}pid=null;}
}

export function renderTaskList({tasks,activeId,mins,onSelect,onToggle,onDelete,onReorder}){
  const ul=$("#tasks");ul.replaceChildren();
  tasks.forEach(t=>{
    const li=el("li",{className:"task"+(t.id===activeId?" active":"")+(t.done?" done":""),tabIndex:0,title:"Arraste para mudar a ordem"},{"aria-keyshortcuts":"Alt+ArrowUp Alt+ArrowDown"});li.dataset.id=String(t.id);
    const chk=el("button",{className:"chk",type:"button"},{"aria-label":"Concluir"});chk.appendChild(checkIcon());
    const name=el("span",{className:"name"});name.appendChild(el("span",{className:"nt",textContent:String(t.name)}));
    const pom=el("span",{className:"pom"});pom.append(el("b",{textContent:String(+t.act||0)}),"/"+(+t.est||0));
    const del=el("button",{className:"del",type:"button",textContent:"×"},{"aria-label":"Remover"});
    li.append(chk,name,pom,del);
    li.addEventListener("click",()=>onSelect(t));
    // teclado: Alt+↑ / Alt+↓ move a tarefa com foco
    li.addEventListener("keydown",e=>{
      if(!e.altKey||(e.key!=="ArrowUp"&&e.key!=="ArrowDown"))return;
      e.preventDefault();const i=tasks.indexOf(t),j=i+(e.key==="ArrowUp"?-1:1);
      if(j>=0&&j<tasks.length&&onReorder)onReorder(i,j,t.id);
    });
    if(onReorder)enableDrag(li,ul,(from,to)=>onReorder(from,to,t.id));
    chk.addEventListener("click",e=>{e.stopPropagation();onToggle(t,e.currentTarget.getBoundingClientRect());});
    del.addEventListener("click",e=>{e.stopPropagation();onDelete(t);});
    ul.appendChild(li);
  });
  const pend=tasks.filter(t=>!t.done),rem=pend.reduce((s,t)=>s+Math.max(0,t.est-t.act),0);
  const fin=new Date(Date.now()+rem*mins.pomo*60000+Math.max(0,rem-1)*mins.short*60000);
  const s1=el("span",{textContent:"Pomos: "});s1.appendChild(el("b",{textContent:tasks.reduce((s,t)=>s+(+t.act||0),0)+"/"+tasks.reduce((s,t)=>s+(+t.est||0),0)}));
  const s2=el("span",{textContent:"Termina às "});s2.append(el("b",{textContent:fin.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})})," ("+(rem*mins.pomo/60).toFixed(1).replace(".",",")+"h)");
  $("#summary").replaceChildren(s1,s2);
  $("#summary").hidden=!tasks.length;
}
