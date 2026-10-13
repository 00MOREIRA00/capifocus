// Estatísticas de pomodoros por dia (#18), sem DOM.
// Formato salvo: {days:{"AAAA-MM-DD": quantidade}}. Só focos completos contam.
const KEY=/^\d{4}-\d{2}-\d{2}$/;
const DAY=86400000;

export function dayKey(d){
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

// Mantém só dias válidos com contagem inteira positiva, dos últimos 400 dias.
export function sanitizeStats(raw,today=new Date()){
  const days={},oldest=dayKey(new Date(today.getTime()-400*DAY));
  const src=raw&&typeof raw==="object"&&raw.days&&typeof raw.days==="object"?raw.days:{};
  for(const k of Object.keys(src)){const n=Math.floor(+src[k]);if(KEY.test(k)&&n>0&&k>=oldest)days[k]=n;}
  return{days};
}

export function addPomodoro(stats,date){
  const days={...(stats&&stats.days||{})},k=dayKey(date);
  days[k]=(days[k]||0)+1;return{days};
}

function shift(today,n){const d=new Date(today.getFullYear(),today.getMonth(),today.getDate());d.setDate(d.getDate()+n);return d;}

// Últimos n dias, do mais antigo até hoje.
export function lastDays(stats,today,n=7){
  const out=[];
  for(let i=n-1;i>=0;i--){const d=shift(today,-i),key=dayKey(d);out.push({key,date:d,count:(stats.days&&stats.days[key])||0});}
  return out;
}

// Dias seguidos com pelo menos um pomodoro, terminando hoje
// (ou ontem, se hoje ainda não teve nenhum: a sequência continua viva até o fim do dia).
export function streak(stats,today){
  const has=d=>((stats.days||{})[dayKey(d)]||0)>0;
  let i=has(today)?0:-1,n=0;
  while(has(shift(today,i))){n++;i--;}
  return n;
}
