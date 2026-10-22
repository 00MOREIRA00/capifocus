// Lógica do timer sem DOM: regras do ciclo Pomodoro, formatação e restauração.
// Tudo aqui é função pura, testada em tests/timer-logic.test.cjs.
export const MODES=["pomo","short","long"];
export const TITLE_MODE={pomo:"Foco",short:"Pausa curta",long:"Pausa longa"};

export const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");

// Pausa longa a cada N focos completos: de 2 a 10, padrão 4.
export function clampLongEvery(v){return Math.min(10,Math.max(2,parseInt(v)||4));}

// Duração de cada modo em minutos: de 1 a 120.
export function clampMinutes(v,d){return Math.min(120,Math.max(1,parseInt(v)||d));}

// Próxima etapa ao fim da atual.
//  - pausa (curta ou longa) -> foco
//  - foco completo -> conta pomodoro; pausa longa quando o contador fecha o ciclo
//  - foco pulado -> pausa curta, sem contar pomodoro nem avançar o ciclo
export function nextStage({mode,completed,count,longEvery}){
  if(mode!=="pomo")return{mode:"pomo",count,credit:false};
  if(!completed)return{mode:"short",count,credit:false};
  return{mode:count%longEvery===0?"long":"short",count:count+1,credit:true};
}

// Segundos restantes até endAt (ms).
export function remaining(endAt,now){return Math.max(0,Math.round((endAt-now)/1000));}

// Tempo restante a cada tique, à prova de relógio do sistema que volta (ajuste automático de hora,
// sincronização, volta da suspensão). O restante nunca sobe nem passa da duração da etapa:
// se o relógio voltou, mantém o tempo atual e recalcula o fim a partir de agora.
export function syncLeft({endAt,now,total,left}){
  const rem=remaining(endAt,now);
  if(rem>left||rem>total){const l=Math.min(left,total);return{left:l,endAt:now+l*1000};}
  return{left:rem,endAt};
}

// Título da aba: tempo e modo enquanto há uma etapa em andamento.
export function titleFor({running,left,total,mode}){
  return (running||left<total)?(running?"":"⏸ ")+fmt(left)+" · "+TITLE_MODE[mode]+" | Capifocus":"Capifocus";
}

// Estado do timer salvo no navegador -> estado a usar ao abrir o app.
// Retorna null quando o salvo é inválido. "expired" indica que a etapa
// terminou com o app fechado (o app registra sem tocar alarme).
export function restoreState(saved,mins,now){
  if(!saved||typeof saved!=="object"||!MODES.includes(saved.mode))return null;
  const mode=saved.mode,total=+saved.total,left=+saved.left;
  if(!(total>0)||!(left>=0)||left>total)return null;
  if(!saved.running&&left===total){const t=mins[mode]*60;return{mode,total:t,left:t,running:false,endAt:0,expired:false};}
  if(saved.running&&+saved.endAt>0){
    const rem=remaining(+saved.endAt,now);
    // relógio voltou desde que salvou: retoma do tempo salvo, com um novo fim
    if(rem>left)return{mode,total,left,running:true,endAt:now+left*1000,expired:false};
    if(rem>0)return{mode,total,left:rem,running:true,endAt:+saved.endAt,expired:false};
    return{mode,total,left:0,running:false,endAt:+saved.endAt,expired:true};
  }
  return{mode,total,left,running:false,endAt:0,expired:false};
}

// Regras entre as durações (#28): a pausa curta não passa do Pomodoro e é menor que a pausa longa.
// Devolve a lista de problemas (vazia quando está tudo certo), com o campo a destacar.
export function validateDurations({pomo,short,long}){
  const errors=[];
  if(short>pomo)errors.push({field:"short",message:"A pausa curta não pode ser maior que o Pomodoro."});
  if(long<=short)errors.push({field:"long",message:"A pausa longa precisa ser maior que a pausa curta."});
  return errors;
}
