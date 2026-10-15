// Utilidades de página compartilhadas pelos módulos: seletor, armazenamento,
// criação de elementos sem interpretar HTML e aviso rápido (toast).
export const $=s=>document.querySelector(s);

export const store={
  get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
};

// Monta elementos com propriedades/atributos; dados do localStorage nunca viram marcação.
export function el(tag,props,attrs){const n=document.createElement(tag);if(props)Object.assign(n,props);if(attrs)for(const k in attrs)n.setAttribute(k,attrs[k]);return n;}

export function checkIcon(){
  const NS="http://www.w3.org/2000/svg",svg=document.createElementNS(NS,"svg"),path=document.createElementNS(NS,"path");
  [["width","14"],["height","14"],["viewBox","0 0 24 24"]].forEach(([k,v])=>svg.setAttribute(k,v));
  [["d","M5 12.5l4.5 4.5L19 7.5"],["stroke","currentColor"],["stroke-width","3.2"],["fill","none"],["stroke-linecap","round"],["stroke-linejoin","round"]].forEach(([k,v])=>path.setAttribute(k,v));
  svg.appendChild(path);return svg;
}

let toastT;
export function toast(t,action,duration=3500){
  const n=$("#toast");n.replaceChildren();n.textContent=t;
  if(action){
    const button=el("button",{type:"button",className:"toast-action",textContent:action.label});
    button.addEventListener("click",()=>{clearTimeout(toastT);n.replaceChildren();n.classList.remove("show");action.run();},{once:true});
    n.appendChild(button);
  }
  n.classList.add("show");clearTimeout(toastT);
  toastT=setTimeout(()=>{n.classList.remove("show");n.replaceChildren();},duration);
}
