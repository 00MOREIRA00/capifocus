// Temporadas do Capifocus (Halloween e, no futuro, outras datas).
// Script comum, carregado antes do tema: marca o <html> com a classe da temporada antes da primeira pintura
// e expõe CapiSeason para o tema e para o app. Datas e textos ficam todos aqui.
(function () {
  // [mês, dia] de início e de fim, inclusive. Para o ano que vem, basta mudar aqui.
  const SEASONS = {
    halloween: { nome: 'Halloween', from: [10, 24], to: [11, 1] }
  };

  const md = date => (date.getMonth() + 1) * 100 + date.getDate();
  function inWindow(id, date) {
    const s = SEASONS[id], v = md(date), a = s.from[0] * 100 + s.from[1], b = s.to[0] * 100 + s.to[1];
    return a <= b ? v >= a && v <= b : v >= a || v <= b;   // aceita temporada que vira o ano
  }
  // preferências: {halloween: false} desliga; egg guarda o dia em que o easter egg já apareceu
  function readPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem('capi-seasonal') || 'null');
      return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
    } catch (_) { return {}; }
  }
  // prévia fora da data: ?temporada=halloween no endereço (só para testar, não fica salvo)
  function preview() {
    try { const id = new URLSearchParams(location.search).get('temporada'); return id && SEASONS[id] ? id : null; } catch (_) { return null; }
  }
  // temporada pela data, sem olhar a preferência (decide se a opção aparece nos ajustes)
  function inSeason(date = new Date()) {
    const forced = preview(); if (forced) return forced;
    for (const id in SEASONS) if (inWindow(id, date)) return id;
    return null;
  }
  // temporada valendo agora: dentro da data e não desligada pela pessoa
  function active(date = new Date(), prefs = readPrefs()) {
    const id = inSeason(date);
    return id && prefs[id] !== false ? id : null;
  }

  const CONTENT = {
    halloween: {
      theme: 'abobora',
      msg: { pomo: 'Hora de enfeitiçar o foco!', short: 'Pausa pra um docinho!', long: 'Pausa longa. Descansa, fantasminha.' },
      doing: { pomo: 'Enfeitiçada no foco', short: 'Beliscando um docinho', long: 'Assombrando a pausa longa' },
      idle: 'Esperando a meia-noite',
      radio: 'Valsando na Transilvânia',
      notify: { pomo: 'A meia-noite chegou. Bora focar?', short: 'O feitiço acabou! Hora da pausa.', long: 'O feitiço acabou! Hora da pausa longa.' },
      cheers: ['Feitiço concluído!', 'Mais uma pro caldeirão!', 'Travessura feita!', 'Capivara assombrada aprova!'],
      grumbles: ['Me cutuca de novo e eu viro abóbora!', 'Tô num feitiço de concentração!', 'Vou te assombrar, hein!', 'Sai, que eu tô de fantasia!'],
      plus: 'Paga o plano Plus que eu tiro a maldição.',
      candy: ['🍬', '🍭', '🍫', '🎃', '🦇'],
      // easter egg: neste dia, ao completar `count` pomodoros
      egg: { month: 10, day: 31, count: 3, text: 'Doces ou travessuras?' },
      // capivara de vampiro (assets/mascot/halloween/, 640 px; originais em halloween/originais/).
      // Pose que não estiver aqui usa a imagem normal.
      poses: {
        default: 'assets/mascot/halloween/capy-default.png',
        focus: 'assets/mascot/halloween/capy-focus.png',
        break: 'assets/mascot/halloween/capy-break.png',
        long: 'assets/mascot/halloween/capy-break.png',
        completed: 'assets/mascot/halloween/capy-completed.png',
        radio: 'assets/mascot/halloween/capy-radio.png',
        rabugenta: 'assets/mascot/halloween/capy-rabugenta.png'
      },
      // rostinho de vampiro na aba do navegador e no logo do cabeçalho
      favicon: { 32: 'assets/icons/halloween/favicon-32.png', 192: 'assets/icons/halloween/favicon-192.png' }
    }
  };

  window.CapiSeason = Object.freeze({ SEASONS, inSeason, active, readPrefs, content: id => CONTENT[id] || null });

  try { const id = active(); if (id) document.documentElement.classList.add('season-' + id); } catch (_) {}
})();
