function lessoncalBoot(){
  "use strict";
  // тестовая дата из админ-панели (только если включён админ-режим)
  var FAKE_TODAY = (function(){ try{ var v = localStorage.getItem('lessoncal_fake_today'); return (localStorage.getItem('lessoncal_admin')==='1' && /^\d{4}-\d{2}-\d{2}$/.test(v||'')) ? v : ''; }catch(e){ return ''; } })();

  // ---------- языки интерфейса ----------
  var LANG_KEY = 'lessoncal_lang';
  var LANGS = ['ru','uk','en'];
  function getLangPref(){
    try{
      var v = localStorage.getItem(LANG_KEY);
      if(v==='auto' || LANGS.indexOf(v)!==-1) return v;
      return 'auto'; // по умолчанию — язык системы
    }catch(e){ return 'auto'; }
  }
  function detectSystemLang(){
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'en'];
    for(var i=0;i<list.length;i++){
      var c = String(list[i]||'').toLowerCase().slice(0,2);
      if(c==='uk') return 'uk';
      if(c==='ru' || c==='be') return 'ru';
      if(c==='en') return 'en';
    }
    return 'en';
  }
  var LANG_PREF = getLangPref();
  var LANG = LANG_PREF==='auto' ? detectSystemLang() : LANG_PREF;
  var LOCALE = {ru:'ru-RU', uk:'uk-UA', en:'en-GB'}[LANG];
  // словари переводов лежат в папке languages/ (en.js, uk.js) и подгружаются до запуска приложения
  var I18N_EXT = (typeof window!=='undefined' && window.LESSONCAL_I18N) || {};
  var I18N = {en: I18N_EXT.en || {}, uk: I18N_EXT.uk || {}};
  // перевод: ключ — русская фраза
  function T(s){
    if(LANG==='ru') return s;
    var d = I18N[LANG];
    return (d && Object.prototype.hasOwnProperty.call(d, s)) ? d[s] : s;
  }
  try{ document.documentElement.lang = LANG; document.title = T('Календарь занятий'); }catch(e){}


  var COLORS = {
    amber:'#e8b84b', rose:'#e08a92', sky:'#7ca8d9', sage:'#7fc29a',
    lilac:'#c793d9', clay:'#e0925c', aqua:'#6fc8c0', olive:'#b7c77a',
    coral:'#f2836b', mint:'#8fd9b6', indigo:'#8f93d9', gold:'#e0c15c',
    plum:'#b06aa8', steel:'#7d97ad', berry:'#d15a7a', forest:'#6b9e5e'
  };
  var COLOR_KEYS = Object.keys(COLORS);
  var CURRENCIES = {UAH:'₴', USD:'$', EUR:'€', GBP:'£', PLN:'zł', RUB:'₽'};
  var CURRENCY_KEYS = Object.keys(CURRENCIES);
  var DEFAULT_CURRENCY = 'UAH';
  var DOW_LABELS = [T('Пн'),T('Вт'),T('Ср'),T('Чт'),T('Пт'),T('Сб'),T('Вс')];
  var DOW_VALUES = [1,2,3,4,5,6,0];
  var STORAGE_KEY = 'lessoncal_boards_v1';
  var THEME_KEY = 'lessoncal_theme';
  var MAX_MAIN_BALANCES = Infinity; // ограничения на число основных счетов больше нет

  // выбранная тема: 'dark' | 'light' | 'auto' (как в системе)
  var systemDark = (typeof window.matchMedia==='function') ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function getTheme(){
    try{
      var v = localStorage.getItem(THEME_KEY);
      return (v==='light' || v==='auto') ? v : 'dark';
    }catch(e){ return 'dark'; }
  }
  function effectiveTheme(pref){
    if(pref==='auto') return (systemDark && !systemDark.matches) ? 'light' : 'dark';
    return pref==='light' ? 'light' : 'dark';
  }
  function applyTheme(){
    var eff = effectiveTheme(getTheme());
    if(eff==='light') document.documentElement.setAttribute('data-theme','light');
    else document.documentElement.removeAttribute('data-theme');
    syncThemeColor();
  }
  function setTheme(t){
    var theme = (t==='light' || t==='auto') ? t : 'dark';
    try{ localStorage.setItem(THEME_KEY, theme); }catch(e){}
    state.theme = theme;
    applyTheme();
    render();
  }
  if(systemDark){
    var onSystemTheme = function(){ if(getTheme()==='auto') applyTheme(); };
    if(systemDark.addEventListener) systemDark.addEventListener('change', onSystemTheme);
    else if(systemDark.addListener) systemDark.addListener(onSystemTheme);
  }

  function syncThemeColor(){
    var m = document.querySelector('meta[name="theme-color"]');
    if(m) m.setAttribute('content', effectiveTheme(getTheme())==='light' ? '#f2f2f7' : '#252525');
  }
  // анимации: 'full' | 'lite' (упрощённые, для слабых телефонов) | 'off'
  var ANIM_KEY = 'lessoncal_anim';
  function animMode(){
    try{
      var v = localStorage.getItem(ANIM_KEY);
      if(v==='full' || v==='lite' || v==='off') return v;
    }catch(e){}
    // слабое устройство (мало памяти) — по умолчанию упрощённые
    return (navigator.deviceMemory && navigator.deviceMemory <= 2) ? 'lite' : 'full';
  }
  function applyAnimMode(){
    var m = animMode();
    document.documentElement.classList.toggle('anim-lite', m==='lite');
    document.documentElement.classList.toggle('anim-off', m==='off');
  }
  var SUMMARY_KEY = 'lessoncal_summary_on_start';
  function getSummaryOnStart(){ try{ return localStorage.getItem(SUMMARY_KEY)==='1'; }catch(e){ return false; } }

  var state = {
    boards: [],
    activeBoardId: null,
    viewDate: startOfMonth(todayD()),
    selectedDate: null,
    modal: null,
    menuOpen: false,
    storageOk: true,
    newBoardType: 'lessons',
    financeView: 'income',
    search: '',
    confirmDeleteId: null,
    renameBoardId: null,
    theme: getTheme(),
    editing: null,
    transactionTarget: null,
    boardTypePickerOpen: false,
    scheduleDay: todayD().getDay(),
    scheduleTimeTarget: null,
    detailTarget: null,
    renewTarget: null,
    incomeTarget: null,
    pendingBackup: null,
    onb: null,
    privacy: (function(){ try{ return localStorage.getItem('lessoncal_privacy')==='1' || localStorage.getItem('lessoncal_privacy_start')==='1'; }catch(e){ return false; } })(),
    subTarget: null,
    balanceTarget: null,
    calView: (function(){ try{ return localStorage.getItem('lessoncal_calview')==='week' ? 'week' : 'month'; }catch(e){ return 'month'; } })(),
    weekStart: null,
    confirmCard: null
  };

  // ---------- date helpers ----------
  function pad(n){ return String(n).padStart(2,'0'); }
  function fmt(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function parseD(s){ var p=s.split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
  function todayD(){
    if(FAKE_TODAY){ var f = FAKE_TODAY.split('-'); return new Date(+f[0], +f[1]-1, +f[2]); }
    var n=new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function addDays(d,n){ var r=new Date(d); r.setDate(r.getDate()+n); return r; }
  function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
  var MONTH_NAMES_GEN = [T('января'),T('февраля'),T('марта'),T('апреля'),T('мая'),T('июня'),T('июля'),T('августа'),T('сентября'),T('октября'),T('ноября'),T('декабря')];
  function fmtHuman(ds){
    var d = parseD(ds);
    return d.getDate()+' '+MONTH_NAMES_GEN[d.getMonth()]+' '+d.getFullYear();
  }
  function fmtHumanNoYear(ds){
    var d = parseD(ds);
    return d.getDate()+' '+MONTH_NAMES_GEN[d.getMonth()];
  }
  function timeRangeStr(s){
    if(!s.timeStart) return '';
    return s.timeStart + (s.timeEnd ? '–'+s.timeEnd : '');
  }
  // ручной ввод времени: "1430", "14:30", "9", "9.5" -> "14:30", "09:00", "09:05"; пусто -> ''; ошибка -> null
  function normalizeTime(raw){
    var s = String(raw==null ? '' : raw).trim();
    if(!s) return '';
    var h, m, mt = s.match(/^(\d{1,2})\s*[:.,;\-\s]\s*(\d{1,2})$/);
    if(mt){ h = parseInt(mt[1],10); m = parseInt(mt[2],10); }
    else if(/^\d{1,4}$/.test(s)){
      if(s.length<=2){ h = parseInt(s,10); m = 0; }
      else if(s.length===3){ h = parseInt(s.charAt(0),10); m = parseInt(s.slice(1),10); }
      else { h = parseInt(s.slice(0,2),10); m = parseInt(s.slice(2),10); }
    } else return null;
    if(!(h>=0 && h<=23 && m>=0 && m<=59)) return null;
    return pad(h)+':'+pad(m);
  }
  // два поля «чч : мм» + скрытое поле с итоговым значением ЧЧ:ММ (его и читает форма)
  function timeInputHtml(name, value){
    var p = String(value||'').split(':');
    var h = p[0] || '', m = p[1] || '';
    return '<div class="time-pair" data-time="'+name+'">'+
      T('<input type="text" class="tp-h" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="чч" aria-label="Часы" value="')+escapeHtml(h)+'">'+
      '<span class="tp-sep">:</span>'+
      T('<input type="text" class="tp-m" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="мм" aria-label="Минуты" value="')+escapeHtml(m)+'">'+
      '<input type="hidden" name="'+name+'" value="'+escapeHtml(value||'')+'">'+
    '</div>';
  }
  var TIME_HINT = T('<div class="field-hint">Начало — конец. Напишите часы, и курсор сам перейдёт к минутам.</div>');
  var MONTH_NAMES = [T('Январь'),T('Февраль'),T('Март'),T('Апрель'),T('Май'),T('Июнь'),T('Июль'),T('Август'),T('Сентябрь'),T('Октябрь'),T('Ноябрь'),T('Декабрь')];
  var MONTH_SHORT = [T('янв'),T('фев'),T('мар'),T('апр'),T('май'),T('июн'),T('июл'),T('авг'),T('сен'),T('окт'),T('ноя'),T('дек')];
  var DOW_FULL = {1:T('понедельник'),2:T('вторник'),3:T('среда'),4:T('четверг'),5:T('пятница'),6:T('суббота'),0:T('воскресенье')};
  function isValidDs(s){ return typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }
  // ключ недели — дата её понедельника
  function weekKey(d){ var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate()-((x.getDay()+6)%7)); return fmt(x); }
  // дата нужного дня недели на неделе ref (по умолчанию — текущей)
  function dateOfWeekday(dow, ref){ return addDays(parseD(weekKey(ref || todayD())), DOW_VALUES.indexOf(dow)); }
  function plural(n, one, few, many){
    if(LANG==='en') return Math.abs(n)===1 ? one : many;
    var a = Math.abs(n)%100, b = a%10;
    if(a>10 && a<20) return many;
    if(b>1 && b<5) return few;
    if(b===1) return one;
    return many;
  }

  function uid(){ return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
  var BOARD_TYPES = ['lessons','events','finance','schedule','planner','subs','habits'];
  function isSchedType(t){ return t==='schedule' || t==='planner'; }
  var BOARD_TYPE_LABELS = {lessons:T('Занятия'), events:T('События'), finance:T('Финансы'), schedule:T('Расписание'), planner:T('Планер задач'), subs:T('Подписки'), habits:T('Привычки')};
  function normBoardType(t){ return BOARD_TYPES.indexOf(t)!==-1 ? t : 'lessons'; }
  function newBoard(name, type){
    var t = normBoardType(type);
    return {id: uid(), name: name, type: t, subjects: [], events: [], income: [], expenses: [], balances: [], rates: {}, wheelCurrency: '', scheduleItems: [], subs: [], habits: []};
  }
  function activeBoard(){
    var b = state.boards.find(function(x){ return x.id===state.activeBoardId; });
    return b || state.boards[0];
  }
  function normalizeBoard(b){
    b.type = normBoardType(b.type);
    if(!Array.isArray(b.subs)) b.subs = [];
    b.subs = b.subs.filter(function(x){ return x && typeof x==='object'; });
    b.subs.forEach(function(x){
      if(!x.id) x.id = uid();
      if(typeof x.name!=='string') x.name = '';
      if(!x.color || COLOR_KEYS.indexOf(x.color)===-1) x.color = COLOR_KEYS[0];
      x.amount = Math.max(0, Number(x.amount) || 0);
      if(CURRENCY_KEYS.indexOf(x.currency)===-1) x.currency = DEFAULT_CURRENCY;
      if(['month','year','week'].indexOf(x.period)===-1) x.period = 'month';
      if(!isValidDs(x.startDate)) x.startDate = fmt(todayD());
      x.active = x.active!==false;
      if(!x.paid || typeof x.paid!=='object' || Array.isArray(x.paid)) x.paid = {};
      if(!Array.isArray(x.skipped)) x.skipped = [];
      if(!Array.isArray(x.history)) x.history = [];
      if(!isValidDs(x.createdAt)) x.createdAt = fmt(todayD());
      if(x.financeLink && typeof x.financeLink!=='object') x.financeLink = null;
    });
    if(!Array.isArray(b.habits)) b.habits = [];
    b.habits = b.habits.filter(function(x){ return x && typeof x==='object'; });
    b.habits.forEach(function(h){
      if(!h.id) h.id = uid();
      if(typeof h.name!=='string') h.name = '';
      if(!h.color || COLOR_KEYS.indexOf(h.color)===-1) h.color = COLOR_KEYS[0];
      h.kind = h.kind==='count' ? 'count' : 'check';
      h.target = Math.max(1, parseInt(h.target,10) || 1);
      if(typeof h.unit!=='string') h.unit = '';
      if(!Array.isArray(h.days) || !h.days.length) h.days = DOW_VALUES.slice();
      h.days = h.days.map(function(d){ return parseInt(d,10); }).filter(function(d){ return DOW_VALUES.indexOf(d)!==-1; });
      if(!h.days.length) h.days = DOW_VALUES.slice();
      if(!h.log || typeof h.log!=='object' || Array.isArray(h.log)) h.log = {};
      if(!isValidDs(h.createdAt)) h.createdAt = fmt(todayD());
    });
    if(!Array.isArray(b.subjects)) b.subjects = [];
    if(!Array.isArray(b.events)) b.events = [];
    if(!Array.isArray(b.income)) b.income = [];
    if(!Array.isArray(b.expenses)) b.expenses = [];
    if(!Array.isArray(b.balances)) b.balances = [];
    if(!Array.isArray(b.scheduleItems)) b.scheduleItems = [];
    if(!b.rates || typeof b.rates!=='object') b.rates = {};
    if(typeof b.wheelCurrency!=='string' || CURRENCY_KEYS.indexOf(b.wheelCurrency)===-1) b.wheelCurrency = '';
    b.scheduleItems.forEach(function(x){
      if(!Array.isArray(x.times)){
        var legacyDays;
        if(Array.isArray(x.days)) legacyDays = x.days;
        else if(typeof x.day!=='undefined') legacyDays = [x.day];
        else legacyDays = [];
        legacyDays = legacyDays.map(function(d){ return parseInt(d,10); }).filter(function(d){ return DOW_VALUES.indexOf(d)!==-1; });
        var legacyStart = typeof x.timeStart==='string' ? x.timeStart : '';
        var legacyEnd = typeof x.timeEnd==='string' ? x.timeEnd : '';
        x.times = legacyDays.map(function(d){ return {id: uid(), day: d, timeStart: legacyStart, timeEnd: legacyEnd}; });
      }
      delete x.day; delete x.days; delete x.timeStart; delete x.timeEnd;
      if(!Array.isArray(x.times)) x.times = [];
      x.times.forEach(function(t){
        var dv = parseInt(t.day,10);
        t.day = (DOW_VALUES.indexOf(dv)!==-1) ? dv : DOW_VALUES[0];
        if(typeof t.timeStart!=='string') t.timeStart = '';
        if(typeof t.timeEnd!=='string') t.timeEnd = '';
        if(!t.id) t.id = uid();
        if(!isValidDs(t.date)) t.date = '';
        if(t.date) t.day = parseD(t.date).getDay();
        // «выполнено» хранится по неделям, чтобы каждая новая неделя начиналась с чистого листа
        if(!Array.isArray(t.doneWeeks)) t.doneWeeks = [];
        if(t.done===true && !t.doneWeeks.length) t.doneWeeks = [weekKey(t.date ? parseD(t.date) : todayD())];
        delete t.done;
      });
      if(typeof x.name!=='string') x.name = '';
      if(!x.color || COLOR_KEYS.indexOf(x.color)===-1) x.color = COLOR_KEYS[0];
      if(typeof x.notes!=='string') x.notes = '';
    });
    b.subjects = b.subjects.filter(function(s){ return s && typeof s==='object'; });
    b.subjects.forEach(function(s){
      if(!s.id) s.id = uid();
      if(typeof s.name!=='string') s.name = '';
      if(!s.color || COLOR_KEYS.indexOf(s.color)===-1) s.color = COLOR_KEYS[0];
      if(!Array.isArray(s.days)) s.days = [];
      s.days = s.days.map(function(d){ return parseInt(d,10); }).filter(function(d){ return DOW_VALUES.indexOf(d)!==-1; });
      if(typeof s.startDate!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.startDate)) s.startDate = fmt(todayD());
      if(!Array.isArray(s.cancelled)) s.cancelled = [];
      if(!s.rescheduled || typeof s.rescheduled!=='object') s.rescheduled = {};
      s.planType = (s.planType==='static') ? 'static' : 'dynamic';
      if(typeof s.total!=='number') s.total = s.total ? Number(s.total)||0 : 0;
      if(typeof s.paidUntil!=='string') s.paidUntil = '';
      if(typeof s.timeStart!=='string') s.timeStart = '';
      if(typeof s.timeEnd!=='string') s.timeEnd = '';
      if(!s.cancelled) s.cancelled = [];
      if(!s.rescheduled) s.rescheduled = {};
      if(!Array.isArray(s.payments)) s.payments = [];
      s.payments.forEach(function(p){
        if(!p.id) p.id = uid();
        p.amount = Number(p.amount) || 0;
        if(CURRENCY_KEYS.indexOf(p.currency)===-1) p.currency = DEFAULT_CURRENCY;
        if(!isValidDs(p.date)) p.date = fmt(todayD());
        p.lessons = Number(p.lessons) || 0;
        if(typeof p.until!=='string') p.until = '';
        if(typeof p.prevUntil!=='string') p.prevUntil = '';
      });
    });
    b.events = b.events.filter(function(e){ return e && typeof e==='object' && typeof e.date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date); });
    b.events.forEach(function(e){
      if(!e.id) e.id = uid();
      if(typeof e.name!=='string') e.name = '';
      if(!e.color || COLOR_KEYS.indexOf(e.color)===-1) e.color = COLOR_KEYS[0];
      e.yearly = !!e.yearly;
    });
    b.income.forEach(function(x){
      if(typeof x.amount!=='number') x.amount = Number(x.amount)||0;
      x.scheduleType = (x.scheduleType==='monthly') ? 'monthly' : 'once';
      if(typeof x.date!=='string') x.date = '';
      x.currency = (CURRENCY_KEYS.indexOf(x.currency)!==-1) ? x.currency : DEFAULT_CURRENCY;
      var dom = parseInt(x.dayOfMonth,10);
      x.dayOfMonth = (dom>=1 && dom<=28) ? dom : 1;
      if(!Array.isArray(x.history)) x.history = [];
      if(!x.confirmed || typeof x.confirmed!=='object' || Array.isArray(x.confirmed)) x.confirmed = {};
      if(!x.postponed || typeof x.postponed!=='object' || Array.isArray(x.postponed)) x.postponed = {};
      if(!Array.isArray(x.skipped)) x.skipped = [];
      if(!isValidDs(x.createdAt)) x.createdAt = fmt(todayD());
    });
    b.expenses.forEach(function(x){
      if(typeof x.amount!=='number') x.amount = Number(x.amount)||0;
      x.currency = (CURRENCY_KEYS.indexOf(x.currency)!==-1) ? x.currency : DEFAULT_CURRENCY;
      if(!Array.isArray(x.history)) x.history = [];
      if(!Array.isArray(x.subs)) x.subs = [];
      x.budget = Math.max(0, Number(x.budget)||0);
      if(!Array.isArray(x.aliases)) x.aliases = [];
      x.aliases = x.aliases.filter(function(a){ return typeof a==='string' && a; });
      if(x.recurring && typeof x.recurring==='object'){
        var rc = x.recurring;
        rc.scheduleType = 'monthly';
        rc.amount = Math.max(0, Number(rc.amount) || 0);
        var rdom = parseInt(rc.dayOfMonth, 10);
        rc.dayOfMonth = (rdom>=1 && rdom<=31) ? rdom : 1;
        if(typeof rc.balanceId!=='string') rc.balanceId = '';
        if(!rc.confirmed || typeof rc.confirmed!=='object' || Array.isArray(rc.confirmed)) rc.confirmed = {};
        if(!rc.postponed || typeof rc.postponed!=='object' || Array.isArray(rc.postponed)) rc.postponed = {};
        if(!Array.isArray(rc.skipped)) rc.skipped = [];
        if(!isValidDs(rc.createdAt)) rc.createdAt = fmt(todayD());
      } else x.recurring = null;
      x.subs.forEach(function(sb){
        if(!sb.id) sb.id = uid();
        if(typeof sb.name!=='string') sb.name = '';
        if(typeof sb.amount!=='number') sb.amount = Number(sb.amount)||0;
      });
    });
    var mainCount = 0;
    b.balances.forEach(function(x){
      if(typeof x.amount!=='number') x.amount = Number(x.amount)||0;
      x.currency = (CURRENCY_KEYS.indexOf(x.currency)!==-1) ? x.currency : DEFAULT_CURRENCY;
      if(typeof x.label!=='string') x.label = '';
      if(!x.id) x.id = uid();
      if(!Array.isArray(x.history)) x.history = [];
      if(x.kind!=='main' && x.kind!=='secondary') x.kind = 'main';
      if(x.kind==='main'){
        if(mainCount>=MAX_MAIN_BALANCES) x.kind = 'secondary'; else mainCount++;
      }
    });
    return b;
  }

  function getRate(ab, from, to){
    if(from===to) return 1;
    var direct = ab.rates[from+'_'+to];
    if(typeof direct==='number' && direct>0) return direct;
    var inverse = ab.rates[to+'_'+from];
    if(typeof inverse==='number' && inverse>0) return 1/inverse;
    return null;
  }

  var ratesLoading = false;
  function refreshRatesFromApi(display){
    if(ratesLoading) return;
    if(typeof fetch!=='function'){ showToast(T('Автообновление курсов недоступно в этом браузере')); return; }
    if(typeof navigator!=='undefined' && navigator.onLine===false){ showToast(T('Нет интернета — курсы валют можно обновить только онлайн')); return; }
    ratesLoading = true;
    showToast(T('Обновляем курсы…'));
    fetch('https://open.er-api.com/v6/latest/'+encodeURIComponent(display))
      .then(function(r){ return r.json(); })
      .then(function(data){
        ratesLoading = false;
        if(!data || data.result!=='success' || !data.rates){
          showToast(T('Не удалось получить курсы'));
          return;
        }
        var ab = activeBoard();
        var updated = 0;
        CURRENCY_KEYS.forEach(function(c){
          if(c!==display && typeof data.rates[c]==='number' && data.rates[c]>0){
            ab.rates[c+'_'+display] = 1/data.rates[c];
            updated++;
          }
        });
        showToast(updated ? T('Курсы обновлены') : T('Курсы не изменились'));
        saveData();
      })
      .catch(function(){
        ratesLoading = false;
        showToast(T('Не удалось получить курсы — проверьте подключение к интернету'));
      });
  }

  // ---------- scheduling logic (lessons) ----------
  function nowHM(){ var n=new Date(); return pad(n.getHours())+':'+pad(n.getMinutes()); }
  function occurrencePast(ds, subj){
    var todayStr = fmt(todayD());
    if(ds < todayStr) return true;
    if(ds > todayStr) return false;
    var timeRef = subj.timeEnd || subj.timeStart;
    if(!timeRef) return true;
    return nowHM() >= timeRef;
  }
  function occurrencesInRange(subj, rangeStart, rangeEnd){
    var start = parseD(subj.startDate);
    var from = start > rangeStart ? start : rangeStart;
    var cancelled = new Set(subj.cancelled||[]);
    var reschedFrom = new Set(Object.keys(subj.rescheduled||{}));
    var set = new Set();
    if(from <= rangeEnd){
      var guard = 0;
      for(var d=new Date(from); d<=rangeEnd && guard<4000; d=addDays(d,1), guard++){
        var ds = fmt(d);
        if(subj.days.indexOf(d.getDay())!==-1 && !reschedFrom.has(ds) && !cancelled.has(ds)){
          set.add(ds);
        }
      }
    }
    Object.keys(subj.rescheduled||{}).forEach(function(fromKey){
      var to_ = subj.rescheduled[fromKey];
      var td = parseD(to_);
      if(td>=rangeStart && td<=rangeEnd && !cancelled.has(to_)) set.add(to_);
    });
    return Array.from(set).sort();
  }
  function usedCount(subj){
    var t = todayD();
    var todayStr = fmt(t);
    var occ = occurrencesInRange(subj, parseD(subj.startDate), t);
    return occ.filter(function(ds){
      if(ds!==todayStr) return true;
      return occurrencePast(ds, subj);
    }).length;
  }
  function remaining(subj){ return subj.total - usedCount(subj); }
  function forecast(subj){
    var rem = remaining(subj);
    if(rem<=0) return {done:true};
    var t = todayD();
    var future = occurrencesInRange(subj, addDays(t,1), addDays(t, 365*3));
    if(future.length < rem) return {unknown:true, upcoming:future};
    return {date: future[rem-1], upcoming: future.slice(0,8)};
  }
  function daysUntil(ds){
    return Math.round((parseD(ds) - todayD()) / 86400000);
  }
  function dayInfo(subj, ds){
    var d = parseD(ds);
    var isPattern = subj.days.indexOf(d.getDay())!==-1 && ds >= subj.startDate;
    var cancelled = (subj.cancelled||[]).indexOf(ds)!==-1;
    var reschedMap = subj.rescheduled||{};
    var isReschedFrom = Object.prototype.hasOwnProperty.call(reschedMap, ds);
    var movedToKey = null;
    Object.keys(reschedMap).forEach(function(k){ if(reschedMap[k]===ds) movedToKey = k; });
    var past = occurrencePast(ds, subj);
    if(movedToKey !== null && !cancelled){
      return {kind: past ? 'moved-done' : 'moved-upcoming', movedFrom: movedToKey};
    }
    if(isPattern && cancelled){ return {kind:'cancelled'}; }
    if(isPattern && isReschedFrom){ return {kind:'moved-away', movedTo: reschedMap[ds]}; }
    if(isPattern){ return {kind: past ? 'done' : 'upcoming'}; }
    return null;
  }

  // ---------- events logic ----------
  function eventOccursOn(ev, ds){
    if(ev.yearly){
      var d = parseD(ds), ed = parseD(ev.date);
      return d.getMonth()===ed.getMonth() && d.getDate()===ed.getDate();
    }
    return ev.date === ds;
  }
  function nextOccurrence(ev){
    var t = todayD();
    if(!ev.yearly){
      return ev.date >= fmt(t) ? ev.date : null;
    }
    var ed = parseD(ev.date);
    var candidate = new Date(t.getFullYear(), ed.getMonth(), ed.getDate());
    if(candidate < t) candidate = new Date(t.getFullYear()+1, ed.getMonth(), ed.getDate());
    return fmt(candidate);
  }

  // ---------- finance logic ----------
  // «исходные» даты выплат (без учёта переносов) в диапазоне
  function incomeOrigDates(inc, from, to){
    var out = [];
    if(inc.scheduleType==='monthly'){
      var d = new Date(from.getFullYear(), from.getMonth(), 1);
      for(var guard=0; guard<80; guard++){
        var c = new Date(d.getFullYear(), d.getMonth(), Math.min(inc.dayOfMonth, daysInMonthOf(d.getFullYear(), d.getMonth())));
        if(c > to) break;
        if(c >= from) out.push(fmt(c));
        d = new Date(d.getFullYear(), d.getMonth()+1, 1);
      }
    } else if(isValidDs(inc.date)){
      var od = parseD(inc.date);
      if(od>=from && od<=to) out.push(inc.date);
    }
    return out;
  }
  // выплаты, фактическая дата которых (с учётом переноса) попадает в диапазон
  function incomeOccs(inc, from, to){
    var res = [];
    incomeOrigDates(inc, addDays(from,-120), addDays(to,120)).forEach(function(orig){
      var eff = (inc.postponed||{})[orig] || orig;
      var ed = parseD(eff);
      if(ed<from || ed>to) return;
      var status = (inc.confirmed||{})[orig] ? 'confirmed' : ((inc.skipped||[]).indexOf(orig)!==-1 ? 'skipped' : 'pending');
      res.push({orig: orig, date: eff, status: status, moved: eff!==orig});
    });
    return res.sort(function(a,b){ return a.date<b.date ? -1 : (a.date>b.date ? 1 : 0); });
  }
  function incomeOccsOn(inc, ds){ var d = parseD(ds); return incomeOccs(inc, d, d); }
  // выплаты, которые уже должны были прийти, но ещё не подтверждены
  function pendingIncomeOccs(inc){
    var t = todayD();
    return incomeOccs(inc, addDays(t,-90), t).filter(function(o){ return o.status==='pending' && o.orig>=inc.createdAt; });
  }

  function nextIncomeDate(inc){
    var t = todayD();
    var f = incomeOccs(inc, t, addDays(t,400)).filter(function(o){ return o.status==='pending'; })[0];
    return f ? f.date : null;
  }
  function monthKeyOf(ds){ return String(ds||'').slice(0,7); }
  function spentInMonth(exp, mk){
    return (exp.history||[]).reduce(function(t,h){ return t + (monthKeyOf(h.date)===mk ? (Number(h.amount)||0) : 0); }, 0);
  }

  // режим приватности: вместо сумм — «••••»
  var PRIV_KEY = 'lessoncal_privacy', PRIV_START_KEY = 'lessoncal_privacy_start';
  function privOn(){ return typeof state!=='undefined' && state && state.privacy; }
  var PRIV_MASK = '••••';
  function fmtMoney(n, currency){
    if(currency && privOn()) return PRIV_MASK + ' ' + (CURRENCIES[currency] || currency);
    var num;
    try{ num = Number(n).toLocaleString(LOCALE); }
    catch(e){ num = String(n); }
    if(!currency) return num;
    var sym = CURRENCIES[currency] || currency;
    return num + ' ' + sym;
  }
  // курс для показа: 3 знака после запятой, без округления вверх (2.45645 => 2.456); в хранилище остаётся точное значение
  function fmtRate(n){
    var v = Math.floor(Number(n)*1000 + 1e-6) / 1000;
    return v.toFixed(3);
  }
  // суммы в результате «Посчитать все деньги»: до 2 знаков, без округления вверх (23.5678 => 23.56)
  function fmtMoney2(n, currency){
    if(currency && privOn()) return PRIV_MASK + ' ' + (CURRENCIES[currency] || currency);
    var x = Number(n) || 0;
    var v = Math.trunc(x*100 + (x>=0 ? 1e-6 : -1e-6)) / 100;
    var num;
    try{ num = v.toLocaleString(LOCALE, {maximumFractionDigits: 2}); }
    catch(e){ num = String(v); }
    if(!currency) return num;
    return num + ' ' + (CURRENCIES[currency] || currency);
  }
  function currenciesUsed(list){
    var seen = {};
    var out = [];
    list.forEach(function(x){ if(!seen[x.currency]){ seen[x.currency]=true; out.push(x.currency); } });
    return out;
  }

  // ---------- storage (real browser localStorage — persists on any real host, incl. GitHub Pages) ----------
  function loadData(){
    var raw = null;
    try{ raw = localStorage.getItem(STORAGE_KEY); }
    catch(e){ state.storageOk = false; }
    if(raw){
      try{
        var data = JSON.parse(raw);
        state.boards = data.boards || [];
        state.activeBoardId = data.activeBoardId;
      }catch(e){ state.boards = []; }
    }
    state.boards.forEach(normalizeBoard);
    if(!state.boards || state.boards.length===0){
      var b = newBoard(T('Мой календарь'), 'lessons');
      state.boards = [b]; state.activeBoardId = b.id;
    }
    if(!state.boards.find(function(b){ return b.id===state.activeBoardId; })){
      state.activeBoardId = state.boards[0].id;
    }
    if(!raw && !isOnboarded()){
      state.onb = {i: 0, types: [], acc: {label: T('Карта'), amount: '', currency: DEFAULT_CURRENCY}, back: false};
      state.modal = 'onboarding';
    } else {
      if(!isOnboarded()) markOnboarded(); // у тех, кто уже пользуется, приветствие не показываем
      if(getSummaryOnStart()) state.modal = 'summary';
    }
    render();
  }
  var saveVersion = 0;
  var undoState = null;
  function snapshotBoards(){ return JSON.stringify({boards: state.boards, activeBoardId: state.activeBoardId}); }
  // выполнить удаление и 5 секунд предлагать «Отменить»
  function withUndo(label, fn){
    var snap = snapshotBoards();
    fn();
    undoState = {snap: snap, version: saveVersion};
    showToast(label, {action: T('Отменить'), onAction: doUndo, duration: 5000});
  }
  function doUndo(){
    if(!undoState || undoState.version!==saveVersion) return;
    var d = JSON.parse(undoState.snap);
    undoState = null;
    state.boards = d.boards;
    state.boards.forEach(normalizeBoard);
    state.activeBoardId = d.activeBoardId;
    if(!state.boards.find(function(b){ return b.id===state.activeBoardId; })) state.activeBoardId = state.boards[0].id;
    showToast(T('Восстановлено'));
    saveData();
  }
  function saveData(){
    saveVersion++;
    if(undoState && saveVersion>undoState.version){ undoState = null; dropToastAction(); }
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify({boards: state.boards, activeBoardId: state.activeBoardId}));
    }catch(e){ state.storageOk = false; }
    render();
  }

  // ---------- sharing as a file: no size limits, works for boards of any size ----------
  var BOARD_FILE_MARKER = 'lessoncal-board';
  function boardFilePayload(board){
    return {
      app: BOARD_FILE_MARKER, version: 1,
      name: board.name, type: board.type,
      subjects: board.subjects, events: board.events,
      income: board.income, expenses: board.expenses,
      balances: board.balances, rates: board.rates,
      wheelCurrency: board.wheelCurrency, scheduleItems: board.scheduleItems,
      subs: board.subs, habits: board.habits
    };
  }
  function downloadBoardFile(board){
    var safeName = (board.name || 'doska').replace(/[^a-zA-Zа-яА-ЯёЁ0-9_-]+/g, '_').replace(/^_+|_+$/g,'').slice(0,40) || 'doska';
    downloadJson(boardFilePayload(board), safeName + '.json');
  }
  function applyBackup(mode){
    var list = state.pendingBackup;
    state.pendingBackup = null;
    if(!list || !list.length){ render(); return; }
    state.modal = null; state.menuOpen = false;
    withUndo(mode==='replace' ? T('Доски заменены копией') : T('Доски из копии добавлены'), function(){
      if(mode==='replace') state.boards = list;
      else list.forEach(function(b){ state.boards.push(b); });
      state.activeBoardId = list[0].id;
      pendingAnim = 'enter';
      saveData();
    });
  }
  var BACKUP_FILE_MARKER = 'lessoncal-backup';
  function downloadJson(data, fileName){
    var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
  }
  function downloadBackup(){
    downloadJson({
      app: BACKUP_FILE_MARKER, version: 1, created: new Date().toISOString(),
      boards: state.boards.map(boardFilePayload)
    }, 'kalendar_backup_'+fmt(todayD())+'.json');
    showToast(T('Копия всех досок сохранена'));
  }
  function boardFromFileJson(json){
    return boardFromObj(JSON.parse(json));
  }
  function boardFromObj(obj){
    if(!obj || obj.app!==BOARD_FILE_MARKER || typeof obj.name!=='string') throw new Error('bad file');
    var nb = newBoard(obj.name, obj.type);
    nb.subjects = Array.isArray(obj.subjects) ? obj.subjects : [];
    nb.events = Array.isArray(obj.events) ? obj.events : [];
    nb.income = Array.isArray(obj.income) ? obj.income : [];
    nb.expenses = Array.isArray(obj.expenses) ? obj.expenses : [];
    nb.balances = Array.isArray(obj.balances) ? obj.balances : [];
    nb.rates = (obj.rates && typeof obj.rates==='object') ? obj.rates : {};
    nb.wheelCurrency = typeof obj.wheelCurrency==='string' ? obj.wheelCurrency : '';
    nb.scheduleItems = Array.isArray(obj.scheduleItems) ? obj.scheduleItems : [];
    nb.subs = Array.isArray(obj.subs) ? obj.subs : [];
    nb.habits = Array.isArray(obj.habits) ? obj.habits : [];
    normalizeBoard(nb);
    return nb;
  }
  function handleBoardFile(file){
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      try{
        var parsed = JSON.parse(String(reader.result));
        if(parsed && parsed.app===BACKUP_FILE_MARKER && Array.isArray(parsed.boards)){
          var list = [];
          parsed.boards.forEach(function(o){ try{ list.push(boardFromObj(o)); }catch(e){} });
          if(!list.length) throw new Error('empty');
          state.pendingBackup = list;
          render();
          return;
        }
        var nb = boardFromObj(parsed);
        state.boards.push(nb);
        state.activeBoardId = nb.id;
        state.modal = null;
        state.menuOpen = false;
        showToast(T('Доска добавлена'));
        saveData();
      }catch(e){
        showToast(T('Не удалось прочитать файл — это не файл доски или копии'));
      }
    };
    reader.onerror = function(){ showToast(T('Не удалось прочитать файл')); };
    reader.readAsText(file);
  }

  // ---------- board mutations ----------
  function createBoard(name, type){
    var b = newBoard(name && name.trim() ? name.trim() : T('Новая доска'), type);
    state.boards.push(b);
    pendingAnim = 'enter';
    state.search = '';
    state.activeBoardId = b.id;
    state.menuOpen = false;
    state.financeView = 'income';
    state.editing = null;
    state.transactionTarget = null;
    saveData();
  }
  function switchBoard(id){
    pendingAnim = 'enter';
    state.search = '';
    state.activeBoardId = id;
    state.menuOpen = false;
    state.financeView = 'income';
    state.editing = null;
    state.transactionTarget = null;
    saveData();
  }
  function renameBoard(id, name){
    var b = state.boards.find(function(x){ return x.id===id; });
    if(!b) return;
    b.name = name;
    showToast(T('Название изменено'));
    saveData();
  }
  function cloneBoard(id){
    var src = state.boards.find(function(x){ return x.id===id; });
    if(!src) return;
    var copy = JSON.parse(JSON.stringify(src));
    copy.id = uid();
    copy.name = src.name + T(' (копия)');
    state.boards.splice(state.boards.indexOf(src)+1, 0, copy);
    showToast(T('Доска клонирована'));
    saveData();
  }
  function deleteBoard(id){
    if(state.boards.length<=1){ showToast(T('Нельзя удалить последнюю доску')); return; }
    state.boards = state.boards.filter(function(b){ return b.id!==id; });
    if(state.activeBoardId===id){ state.activeBoardId = state.boards[0].id; }
    saveData();
  }
  // ---------- subject mutations (operate on the active board) ----------
  function addSubject(data){
    var b = activeBoard();
    b.subjects.push({
      id: uid(), name: data.name, color: data.color, days: data.days,
      startDate: data.startDate,
      planType: data.planType,
      total: data.total || 0,
      paidUntil: data.paidUntil || '',
      timeStart: data.timeStart || '',
      timeEnd: data.timeEnd || '',
      cancelled: [], rescheduled: {}
    });
    saveData();
  }
  function deleteSubject(id){
    var b = activeBoard();
    b.subjects = b.subjects.filter(function(s){ return s.id!==id; });
    saveData();
  }
  function updateSubject(id, data){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===id; });
    if(!s) return;
    s.name = data.name; s.color = data.color; s.days = data.days; s.startDate = data.startDate;
    s.planType = data.planType;
    s.timeStart = data.timeStart || ''; s.timeEnd = data.timeEnd || '';
    if(data.planType==='static'){ s.paidUntil = data.paidUntil || ''; }
    else { s.total = data.total || 0; }
    saveData();
  }
  function updateTotal(id, total){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===id; });
    if(s){ s.total = Math.max(0, total); saveData(); }
  }
  function updatePaidUntil(id, dateStr){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===id; });
    if(s){ s.paidUntil = dateStr; saveData(); }
  }
  function cancelOccurrence(subjId, ds){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===subjId; });
    if(!s) return;
    var info = dayInfo(s, ds);
    if(!info) return;
    if(info.kind==='moved-done' || info.kind==='moved-upcoming'){
      var origin = info.movedFrom;
      delete s.rescheduled[origin];
      s.cancelled = (s.cancelled||[]).concat([origin]);
    } else {
      s.cancelled = (s.cancelled||[]).concat([ds]);
    }
    saveData();
  }
  function restoreOccurrence(subjId, ds){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===subjId; });
    if(!s) return;
    s.cancelled = (s.cancelled||[]).filter(function(x){ return x!==ds; });
    saveData();
  }
  function rescheduleOccurrence(subjId, fromDs, toDs){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===subjId; });
    if(!s || !toDs) return;
    s.rescheduled = s.rescheduled || {};
    s.rescheduled[fromDs] = toDs;
    saveData();
  }

  // ---------- продление курса и история оплат ----------
  function renewSubject(id, data){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===id; });
    if(!s) return;
    var p = {id: uid(), date: data.date || fmt(todayD()), amount: data.amount || 0, currency: data.currency || DEFAULT_CURRENCY, lessons: 0, until: '', prevUntil: '', finance: null};
    var finNote = '';
    if(p.amount>0 && data.fin && data.fin.boardId){
      var fb = state.boards.find(function(x){ return x.id===data.fin.boardId && x.type==='finance'; });
      if(fb){
        var exp = fb.expenses.find(function(x){ return x.id===data.fin.expenseId && x.currency===p.currency; });
        if(!exp){
          exp = {id: uid(), name: s.name, color: s.color, amount: 0, currency: p.currency, budget: 0, subs: [], history: []};
          fb.expenses.push(exp);
        }
        addTransactionOn(fb, 'expense', exp.id, p.amount, data.fin.balanceId || null, p.date, null, T('оплата курса'));
        p.finance = {boardId: fb.id, expenseId: exp.id, histId: lastHistoryId};
        s.financeLink = {boardId: fb.id, expenseId: exp.id, balanceId: data.fin.balanceId || ''};
        finNote = T(' · расход записан в «')+fb.name+'»';
      }
    }
    if(s.planType==='static'){
      p.until = data.until; p.prevUntil = s.paidUntil || '';
      s.paidUntil = data.until;
    } else {
      p.lessons = data.lessons;
      s.total = (s.total || 0) + data.lessons;
    }
    s.payments.push(p);
    showToast(T('Курс «')+s.name+T('» продлён')+finNote);
    saveData();
  }
  function deletePayment(subjId, payId){
    var b = activeBoard();
    var s = b.subjects.find(function(x){ return x.id===subjId; });
    if(!s) return;
    var p = s.payments.find(function(x){ return x.id===payId; });
    if(!p) return;
    if(p.finance){
      var fb = state.boards.find(function(x){ return x.id===p.finance.boardId; });
      if(fb) deleteTransactionOn(fb, 'expense', p.finance.expenseId, p.finance.histId);
    }
    if(s.planType==='static'){ if(p.until && s.paidUntil===p.until) s.paidUntil = p.prevUntil || ''; }
    else s.total = Math.max(0, (s.total||0) - (p.lessons||0));
    s.payments = s.payments.filter(function(x){ return x.id!==payId; });
    saveData();
  }
  function paidTotals(s){
    var by = {};
    (s.payments||[]).forEach(function(p){ if(p.amount>0) by[p.currency] = r2((by[p.currency]||0) + p.amount); });
    return Object.keys(by).map(function(c){ return fmtMoney(by[c], c); });
  }
  // курсы, которые пора продлить
  function renewalAlerts(b){
    var out = [];
    b.subjects.forEach(function(s){
      if(s.planType==='static'){
        if(!s.paidUntil) return;
        var dl = daysUntil(s.paidUntil);
        if(dl<0) out.push({s: s, text: T('абонемент закончился ')+fmtHumanNoYear(s.paidUntil)});
        else if(dl===0) out.push({s: s, text: T('абонемент заканчивается сегодня')});
        else if(dl<=3) out.push({s: s, text: T('абонемент закончится через ')+dl+' '+plural(dl,T('день'),T('дня'),T('дней'))});
      } else {
        if(!s.days.length) return;
        var rem = remaining(s);
        if(rem<0) out.push({s: s, text: T('уроки закончились, сверх оплаты: ')+(-rem)});
        else if(rem===0) out.push({s: s, text: T('оплаченные уроки закончились')});
        else if(rem<=2) out.push({s: s, text: (rem===1 ? T('остался ') : T('осталось '))+rem+' '+plural(rem,T('урок'),T('урока'),T('уроков'))});
      }
    });
    return out;
  }
  function renderRenewalRow(a, boardId){
    var color = COLORS[a.s.color] || COLORS.amber;
    return '<div class="notice-row">'+
      '<div class="notice-text"><span class="dot" style="background:'+color+'"></span><div><b>'+escapeHtml(a.s.name)+T('</b><div class="notice-sub">Пора оплатить: ')+a.text+'</div></div></div>'+
      '<div class="notice-actions"><button class="btn small primary" data-act="renew-subject" data-id="'+a.s.id+'"'+(boardId?' data-board="'+boardId+'"':'')+T('>Продлить</button></div>')+
    '</div>';
  }
  function renderRenewalNotice(ab){
    var list = renewalAlerts(ab);
    if(!list.length) return '';
    return T('<div class="notice warn"><div class="notice-title">Напоминание об оплате</div>')+list.map(function(a){ return renderRenewalRow(a); }).join('')+'</div>';
  }
  // блок «Записать в расходы»: какая доска финансов, какая категория, с какого счёта
  function renderRenewFinanceFields(s){
    return renderFinanceFields(s.financeLink, s.name,
      T('<div class="fin-box"><div class="fin-title">Записать в расходы</div><div class="field-hint" style="margin:0;">Создайте доску «Финансы» — тогда оплаты курсов будут сразу попадать в расходы.</div></div>'));
  }
  function renderFinanceFields(linkIn, defaultName, noBoardHtml){
    var fins = state.boards.filter(function(b){ return b.type==='finance'; });
    if(!fins.length) return noBoardHtml;
    var link = linkIn || {};
    var selBoard = fins.some(function(b){ return b.id===link.boardId; }) ? link.boardId : fins[0].id;
    var data = fins.map(function(b){
      return {
        id: b.id,
        expenses: b.expenses.map(function(e){ return {id: e.id, name: e.name, currency: e.currency}; }),
        balances: b.balances.map(function(x){
          var rates = {};
          CURRENCY_KEYS.forEach(function(c){ var r = getRate(b, c, x.currency); if(r!==null) rates[c] = r; });
          return {id: x.id, label: balLabel(x), currency: x.currency, rates: rates};
        })
      };
    });
    return '<div class="fin-box" data-fin="'+escapeHtml(JSON.stringify({boards: data, link: link, subjName: defaultName}))+'">'+
      T('<div class="fin-title">Записать в расходы</div>')+
      T('<div class="field"><label>Доска</label><select name="finBoard">')+
        T('<option value="">Не записывать</option>')+
        fins.map(function(b){ return '<option value="'+b.id+'"'+(b.id===selBoard?' selected':'')+'>'+escapeHtml(b.name)+'</option>'; }).join('')+
      '</select></div>'+
      T('<div class="field" data-fin-dep><label>Категория расхода</label><select name="finExpense"></select></div>')+
      T('<div class="field" data-fin-dep><label>Списать со счёта</label><select name="finBalance"></select></div>')+
      T('<div class="field-hint" data-fin-dep style="margin-top:-6px;">Расход запишется, только если указана сумма оплаты. Категории показаны в выбранной валюте.</div>')+
    '</div>';
  }

  function renderRenewModal(){
    var ab = activeBoard();
    var s = ab.subjects.find(function(x){ return x.id===state.renewTarget; });
    if(!s) return '';
    var isStatic = s.planType==='static';
    var last = s.payments.length ? s.payments[s.payments.length-1] : null;
    var todayStr = fmt(todayD());
    var planField;
    if(isStatic){
      var base = (s.paidUntil && s.paidUntil>=todayStr) ? parseD(s.paidUntil) : todayD();
      var defUntil = fmt(new Date(base.getFullYear(), base.getMonth()+1, base.getDate()));
      planField = T('<div class="field"><label>Оплачено до</label><input type="date" name="until" value="')+defUntil+'" required>'+
        T('<div class="field-hint">Сейчас: ')+(s.paidUntil ? T('до ')+fmtHuman(s.paidUntil) : T('дата не указана'))+'.</div></div>';
    } else {
      var rem = remaining(s);
      planField = T('<div class="field"><label>Сколько уроков добавить</label><input type="number" name="lessons" min="1" step="1" value="')+((last && last.lessons) || 8)+'" required>'+
        T('<div class="field-hint">Сейчас осталось ')+rem+T(' из ')+s.total+'.</div></div>';
    }
    var hist = s.payments.slice().reverse().map(function(p){
      var what = isStatic ? (p.until ? T('до ')+fmtHuman(p.until) : T('продление')) : ('+'+p.lessons+' '+plural(p.lessons,T('урок'),T('урока'),T('уроков')));
      return '<div class="day-item compact">'+
        '<div class="day-item-head"><span class="nm">'+what+'</span><span class="mono" style="font-size:13px;">'+(p.amount>0 ? fmtMoney(p.amount, p.currency) : T('<span class="dim">без суммы</span>'))+'</span></div>'+
        '<div class="row-between"><span class="status">'+fmtHuman(p.date)+'</span>'+
        '<button class="btn small danger" data-act="delete-payment" data-subj="'+s.id+'" data-id="'+p.id+T('">Удалить</button></div>')+
      '</div>';
    }).join('');
    var totals = paidTotals(s);
    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        T('<h3 class="display">Продлить «')+escapeHtml(s.name)+'»</h3>'+
        '<div class="sub">'+(isStatic ? T('Укажите новую дату окончания абонемента') : T('Добавьте оплаченные уроки'))+T(' и, если хотите, сумму — она попадёт в историю оплат.</div>')+
        '<form id="renew-form">'+
          planField+
          '<div class="field-row">'+
            T('<div class="field" style="flex:2;"><label>Сумма <span class="dim">(необязательно)</span></label><input type="number" name="amount" min="0" step="0.01" placeholder="0"></div>')+
            T('<div class="field" style="flex:1;"><label>Валюта</label><select name="currency">')+currencyOptionsHtml(last ? last.currency : DEFAULT_CURRENCY)+'</select></div>'+
          '</div>'+
          T('<div class="field" style="margin-top:16px;"><label>Дата оплаты</label><input type="date" name="date" value="')+todayStr+'" required></div>'+
          renderRenewFinanceFields(s)+
          '<div class="modal-actions">'+
            T('<button type="button" class="btn" data-act="close-modal">Отмена</button>')+
            T('<button type="submit" class="btn primary">Продлить</button>')+
          '</div>'+
        '</form>'+
        T('<div class="section-title">История оплат')+(totals.length ? T(' <span class="dim">· всего ')+totals.join(' + ')+'</span>' : '')+'</div>'+
        (hist || T('<div class="empty" style="padding:12px 6px;">Оплат пока нет.</div>'))+
      '</div>'+
    '</div>';
  }

  // ---------- сводка «Сегодня» по всем доскам ----------
  function sumRow(color, time, name, meta, extraCls){
    return '<div class="sum-row'+(extraCls?' '+extraCls:'')+'">'+
      '<span class="dot" style="background:'+color+'"></span>'+
      '<span class="sum-time mono">'+(time||'')+'</span>'+
      '<span class="sum-name">'+name+'</span>'+
      (meta ? '<span class="sum-meta">'+meta+'</span>' : '')+
    '</div>';
  }
  function summaryForBoard(b, ds){
    var out = '';
    var todayStr = ds;
    if(b.type==='lessons'){
      var lessons = [];
      b.subjects.forEach(function(s){
        var info = dayInfo(s, ds);
        if(!info || info.kind==='cancelled' || info.kind==='moved-away') return;
        lessons.push({s: s, past: info.kind==='done' || info.kind==='moved-done'});
      });
      lessons.sort(function(a,b2){ return (a.s.timeStart||'').localeCompare(b2.s.timeStart||''); });
      out += lessons.map(function(l){
        return sumRow(COLORS[l.s.color]||COLORS.amber, timeRangeStr(l.s) || T('весь день'), escapeHtml(l.s.name), l.s.timeStart ? (l.past ? T('прошло') : T('впереди')) : '', (l.past && l.s.timeStart) ? 'is-past' : '');
      }).join('');
      out += renewalAlerts(b).map(function(a){ return renderRenewalRow(a, b.id); }).join('');
    } else if(b.type==='events'){
      b.events.forEach(function(ev){
        var nx = nextOccurrence(ev);
        if(!nx) return;
        var dl = daysUntil(nx);
        if(dl<0 || dl>7) return;
        out += sumRow(COLORS[ev.color]||COLORS.amber, dl===0 ? T('сегодня') : fmtHumanNoYear(nx), escapeHtml(ev.name), dl===0 ? '' : T('через ')+dl+' '+plural(dl,T('день'),T('дня'),T('дней')), dl===0 ? 'is-today' : '');
      });
    } else if(b.type==='finance'){
      out += incomePromptRows(b).map(function(r){ return renderIncomePromptRow(r, b.id); }).join('');
      out += expensePromptRows(b).map(function(r){ return renderExpensePromptRow(r, b.id); }).join('');
      expenseSoonRows(b).forEach(function(r){
        out += sumRow(COLORS[r.exp.color]||COLORS.amber, fmtHumanNoYear(r.o.date), escapeHtml(r.exp.name)+' · '+fmtMoney(r.exp.recurring.amount, r.exp.currency), inDaysText(daysUntil(r.o.date)));
      });
      b.income.forEach(function(inc){
        incomeOccs(inc, addDays(todayD(),1), addDays(todayD(),3)).forEach(function(o){
          if(o.status!=='pending') return;
          var dl = daysUntil(o.date);
          out += sumRow(COLORS[inc.color]||COLORS.amber, fmtHumanNoYear(o.date), escapeHtml(inc.name)+' · '+fmtMoney(inc.amount, inc.currency), T('через ')+dl+' '+plural(dl,T('день'),T('дня'),T('дней')));
        });
      });
      var mk = monthKeyOf(todayStr);
      b.expenses.forEach(function(exp){
        if(!(exp.budget>0)) return;
        var spent = spentInMonth(exp, mk);
        if(spent < exp.budget*0.8) return;
        out += sumRow(COLORS[exp.color]||COLORS.amber, T('бюджет'), escapeHtml(exp.name), spent>exp.budget ? T('превышен') : Math.round(spent/exp.budget*100)+'%', 'is-warn');
      });
    } else if(b.type==='subs'){
      b.subs.forEach(function(x){ subPending(x).forEach(function(o){ out += subPromptRow(x, o, b.id); }); });
      subSoonRows(b).forEach(function(r){
        out += sumRow(COLORS[r.sub.color]||COLORS.amber, fmtHumanNoYear(r.date), escapeHtml(r.sub.name)+' · '+fmtMoney(r.sub.amount, r.sub.currency), inDaysText(daysUntil(r.date)));
      });
    } else if(b.type==='habits'){
      b.habits.forEach(function(h){
        if(!habitPlanned(h, ds)) return;
        var done = habitDone(h, ds);
        out += '<div class="sum-row sum-habit'+(done?' is-past':'')+'"><span class="dot" style="background:'+(COLORS[h.color]||COLORS.amber)+'"></span>'+
          '<span class="sum-name'+(done?' task-done':'')+'">'+escapeHtml(h.name)+'</span>'+habitControlHtml(h, ds, b.id)+'</div>';
      });
    } else if(isSchedType(b.type)){
      var rows = [];
      b.scheduleItems.forEach(function(it){ it.times.forEach(function(t){ if(timeOnDate(t, ds)) rows.push({it: it, t: t}); }); });
      rows.sort(function(a,b2){ return (a.t.timeStart||'').localeCompare(b2.t.timeStart||''); });
      out += rows.map(function(r){
        var color = COLORS[r.it.color]||COLORS.amber;
        if(b.type==='planner'){
          var dn = isDoneOn(r.t, ds);
          return '<label class="sum-row sum-task'+(dn?' is-past':'')+'">'+
            '<input type="checkbox" class="task-check" data-act="toggle-done" data-item="'+r.it.id+'" data-time="'+r.t.id+'" data-date="'+ds+'" data-board="'+b.id+'"'+(dn?' checked':'')+'>'+
            '<span class="sum-time mono">'+(timeRangeStr(r.t)||'')+'</span>'+
            '<span class="sum-name'+(dn?' task-done':'')+'">'+escapeHtml(r.it.name)+'</span>'+
          '</label>';
        }
        return sumRow(color, timeRangeStr(r.t) || '', escapeHtml(r.it.name), '');
      }).join('');
    }
    return out;
  }
  function renderSummaryModal(){
    var t = todayD(), ds = fmt(t);
    var sections = state.boards.map(function(b){
      var body = summaryForBoard(b, ds);
      if(!body) return '';
      return '<div class="sum-section">'+
        '<div class="sum-head"><div><div class="sum-board">'+escapeHtml(b.name)+'</div><div class="sum-type">'+BOARD_TYPE_LABELS[b.type]+'</div></div>'+
        (b.id!==state.activeBoardId ? '<button class="btn small" data-act="summary-open-board" data-id="'+b.id+T('">Открыть</button>') : '')+'</div>'+
        body+
      '</div>';
    }).join('');
    var dow = DOW_FULL[t.getDay()];
    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<div class="sum-date">'+dow.charAt(0).toUpperCase()+dow.slice(1)+'</div>'+
        '<h3 class="display sum-title">'+fmtHuman(ds)+'</h3>'+
        T('<div class="sub">Всё важное на сегодня со всех досок</div>')+
        (sections || T('<div class="empty" style="padding:26px 6px;"><div class="display">Свободный день</div>На сегодня ничего не запланировано.</div>'))+
      '</div>'+
    '</div>';
  }
  function renderBackupDialog(){
    var list = state.pendingBackup;
    if(!list) return '';
    return ''+
    '<div class="overlay">'+
      '<div class="modal alert" data-stop="1">'+
        T('<h3 class="display">Восстановить копию?</h3>')+
        T('<div class="sub">В файле ')+list.length+' '+plural(list.length,T('доска'),T('доски'),T('досок'))+T('. Можно добавить их к текущим или заменить все текущие доски.</div>')+
        '<div class="alert-stack">'+
          T('<button type="button" class="btn primary" data-act="backup-add">Добавить к текущим</button>')+
          T('<button type="button" class="btn danger" data-act="backup-replace">Заменить все</button>')+
          T('<button type="button" class="btn" data-act="cancel-dialog">Отмена</button>')+
        '</div>'+
      '</div>'+
    '</div>';
  }

  // =====================================================================
  // ---------- ПОДПИСКИ ----------
  // =====================================================================
  function daysInMonthOf(y, m){ return new Date(y, m+1, 0).getDate(); }
  // k-я дата списания от первой (с учётом коротких месяцев: 31-е -> 30-е/28-е)
  function subNthDate(sub, k){
    var st = parseD(sub.startDate);
    if(sub.period==='week') return addDays(st, 7*k);
    var m = st.getMonth() + (sub.period==='year' ? 12*k : k);
    var yy = st.getFullYear() + Math.floor(m/12), mm = ((m%12)+12)%12;
    return new Date(yy, mm, Math.min(st.getDate(), daysInMonthOf(yy, mm)));
  }
  function subDates(sub, from, to){
    var out = [], st = parseD(sub.startDate), k0 = 0;
    if(from > st){
      if(sub.period==='week') k0 = Math.max(0, Math.floor((from - st)/86400000/7) - 1);
      else {
        var md = (from.getFullYear()-st.getFullYear())*12 + (from.getMonth()-st.getMonth());
        k0 = Math.max(0, Math.floor(sub.period==='year' ? md/12 : md) - 1);
      }
    }
    for(var k=k0, g=0; g<600; k++, g++){
      var d = subNthDate(sub, k);
      if(d > to) break;
      if(d >= from) out.push(fmt(d));
    }
    return out;
  }
  function subOccs(sub, from, to){
    return subDates(sub, from, to).map(function(ds){
      return {date: ds, status: sub.paid[ds] ? 'paid' : (sub.skipped.indexOf(ds)!==-1 ? 'skipped' : 'pending')};
    });
  }
  // списания, которые уже наступили, но не отмечены
  function subPending(sub){
    if(!sub.active) return [];
    var t = todayD();
    return subOccs(sub, addDays(t,-60), t).filter(function(o){ return o.status==='pending' && o.date>=sub.createdAt; });
  }
  function subNext(sub){
    var t = todayD();
    var f = subOccs(sub, addDays(t,1), addDays(t, 800)).filter(function(o){ return o.status==='pending'; })[0];
    return f ? f.date : null;
  }
  function subMonthly(sub){ return sub.period==='year' ? sub.amount/12 : (sub.period==='week' ? sub.amount*52/12 : sub.amount); }
  function subPeriodLabel(p){ return p==='year' ? T('в год') : (p==='week' ? T('в неделю') : T('в месяц')); }
  function subSpent(sub){ return r2(sub.history.reduce(function(t,h){ return t + (Number(h.amount)||0); }, 0)); }
  function inDaysText(dl){
    if(dl===0) return T('сегодня');
    if(dl===1) return T('завтра');
    return T('через')+' '+dl+' '+plural(dl, T('день'), T('дня'), T('дней'));
  }
  function totalsText(map){
    var keys = Object.keys(map);
    if(!keys.length) return '0';
    return keys.map(function(c){ return fmtMoney2(map[c], c); }).join(' + ');
  }

  function addSub(data){
    var b = activeBoard();
    b.subs.push({id: uid(), name: data.name, color: data.color, amount: data.amount, currency: data.currency, period: data.period,
      startDate: data.startDate, active: true, paid: {}, skipped: [], history: [], createdAt: fmt(todayD()), financeLink: null});
    saveData();
  }
  function updateSub(id, data){
    var x = activeBoard().subs.find(function(v){ return v.id===id; });
    if(!x) return;
    x.name = data.name; x.color = data.color; x.amount = data.amount; x.currency = data.currency;
    x.period = data.period; x.startDate = data.startDate;
    saveData();
  }
  function findSub(id){ return activeBoard().subs.find(function(v){ return v.id===id; }); }
  function paySub(id, ds, amount, date, fin){
    var x = findSub(id);
    if(!x) return;
    var ref = recordExpense(fin, amount, x.currency, date, x.name, x.color, T('подписка'));
    var hid = uid();
    x.history.push({id: hid, orig: ds, date: date, amount: amount, finance: ref});
    x.paid[ds] = hid;
    x.skipped = x.skipped.filter(function(v){ return v!==ds; });
    if(ref) x.financeLink = {boardId: ref.boardId, expenseId: ref.expenseId, balanceId: ref.balanceId};
    showToast(ref ? T('Оплата отмечена · расход записан в «')+ref.boardName+'»' : T('Оплата отмечена'));
    saveData();
  }
  function deleteSubPayment(id, hid){
    var x = findSub(id);
    if(!x) return;
    var h = x.history.find(function(v){ return v.id===hid; });
    if(!h) return;
    undoExpense(h.finance);
    if(x.paid[h.orig]===hid) delete x.paid[h.orig];
    x.history = x.history.filter(function(v){ return v.id!==hid; });
    saveData();
  }
  function skipSub(id, ds){
    var x = findSub(id);
    if(!x) return;
    if(x.skipped.indexOf(ds)===-1) x.skipped.push(ds);
    saveData();
  }
  function unskipSub(id, ds){
    var x = findSub(id);
    if(!x) return;
    x.skipped = x.skipped.filter(function(v){ return v!==ds; });
    saveData();
  }
  function toggleSubActive(id){
    var x = findSub(id);
    if(!x) return;
    x.active = !x.active;
    // после паузы не спрашиваем про пропущенные списания
    if(x.active) x.createdAt = fmt(todayD());
    showToast(x.active ? T('Подписка возобновлена') : T('Подписка на паузе'));
    saveData();
  }

  function subPromptRow(sub, o, boardId){
    var dl = daysUntil(o.date);
    var color = COLORS[sub.color] || COLORS.amber;
    var bAttr = boardId ? ' data-board="'+boardId+'"' : '';
    var when = dl===0 ? T('Сегодня списание') : T('Списание было')+' '+fmtHumanNoYear(o.date);
    return '<div class="notice-row">'+
      '<div class="notice-text"><span class="dot" style="background:'+color+'"></span><div><b>'+escapeHtml(sub.name)+'</b> · '+fmtMoney(sub.amount, sub.currency)+
        '<div class="notice-sub">'+when+' — '+T('оплачено?')+'</div></div></div>'+
      '<div class="notice-actions">'+
        '<button class="btn small" data-act="sub-skip" data-id="'+sub.id+'" data-date="'+o.date+'"'+bAttr+'>'+T('Пропустить')+'</button>'+
        '<button class="btn small primary" data-act="sub-pay" data-id="'+sub.id+'" data-date="'+o.date+'"'+bAttr+'>'+T('Оплачено')+'</button>'+
      '</div>'+
    '</div>';
  }
  function subSoonRows(b){
    var t = todayD(), out = [];
    b.subs.forEach(function(x){
      if(!x.active) return;
      subOccs(x, addDays(t,1), addDays(t,3)).forEach(function(o){
        if(o.status==='pending') out.push({sub: x, date: o.date});
      });
    });
    return out.sort(function(a,c){ return a.date<c.date?-1:1; });
  }
  function renderSubsNotice(ab){
    var rows = [];
    ab.subs.forEach(function(x){ subPending(x).forEach(function(o){ rows.push(subPromptRow(x, o)); }); });
    var soon = subSoonRows(ab).map(function(r){
      var color = COLORS[r.sub.color] || COLORS.amber;
      return '<div class="notice-row"><div class="notice-text"><span class="dot" style="background:'+color+'"></span><div><b>'+escapeHtml(r.sub.name)+'</b> · '+fmtMoney(r.sub.amount, r.sub.currency)+
        '<div class="notice-sub">'+T('Спишется')+' '+inDaysText(daysUntil(r.date))+', '+fmtHumanNoYear(r.date)+'</div></div></div></div>';
    });
    if(!rows.length && !soon.length) return '';
    return '<div class="notice'+(rows.length?'':' warn')+'"><div class="notice-title">'+(rows.length ? T('Подтвердите списание') : T('Скоро списание'))+'</div>'+rows.join('')+soon.join('')+'</div>';
  }

  function renderSubsSidebar(ab){
    var html = '<div class="sidebar">'+renderSubsNotice(ab)+'<h2>'+T('Подписки')+'</h2>'+renderSearchBox()+'<div class="cards">';
    if(!ab.subs.length){
      html += '<div class="empty" style="padding:20px 6px;"><div class="display">'+T('Пока пусто')+'</div>'+T('Добавьте Netflix, Spotify, iCloud — приложение напомнит о списании и запишет его в расходы.')+'</div>';
    }
    var sorted = ab.subs.slice().sort(function(a,c){
      if(a.active!==c.active) return a.active ? -1 : 1;
      var na = subNext(a) || '9999', nc = subNext(c) || '9999';
      if(subPending(a).length) na = '0000';
      if(subPending(c).length) nc = '0000';
      return na<nc ? -1 : (na>nc ? 1 : 0);
    });
    sorted.forEach(function(x){
      var color = COLORS[x.color] || COLORS.amber;
      var line;
      if(!x.active) line = '<span class="dim">'+T('На паузе — списания не отслеживаются')+'</span>';
      else if(subPending(x).length) line = '<span class="warn">'+T('Ждёт подтверждения оплаты')+'</span>';
      else {
        var nx = subNext(x);
        line = nx ? T('Следующее списание')+': <b>'+fmtHumanNoYear(nx)+'</b> · '+inDaysText(daysUntil(nx)) : '';
      }
      var spent = subSpent(x);
      html += ''+
        '<div class="punch-card'+(x.active?'':' is-paused')+'">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt" title="'+escapeHtml(x.name)+'">'+escapeHtml(x.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="sub-toggle" data-id="'+x.id+'" title="'+(x.active?T('Поставить на паузу'):T('Возобновить'))+'" style="width:26px;height:26px;font-size:11px;">'+(x.active?'❚❚':'▶')+'</button>'+
              '<button class="icon-btn" data-act="edit-sub" data-id="'+x.id+'" title="'+T('Изменить')+'" style="width:26px;height:26px;font-size:12px;">✎</button>'+
              '<button class="icon-btn" data-act="delete-sub" data-id="'+x.id+'" title="'+T('Удалить')+'" style="width:26px;height:26px;font-size:13px;">✕</button>'+
            '</div>'+
          '</div>'+
          '<div class="pc-body">'+
            '<div class="pc-stats"><b>'+fmtMoney(x.amount, x.currency)+'</b> '+subPeriodLabel(x.period)+
              (x.period!=='month' ? ' <span class="dim">≈ '+fmtMoney2(subMonthly(x), x.currency)+' '+T('в месяц')+'</span>' : '')+
              (line ? '<br>'+line : '')+'</div>'+
            (spent>0 ? '<div class="pc-paid">'+T('Оплачено всего')+': <b>'+fmtMoney2(spent, x.currency)+'</b></div>' : '')+
          '</div>'+
        '</div>';
    });
    html += '</div>';
    html += '<button class="add-card" data-act="open-add">+ '+T('Добавить подписку')+'</button>';
    html += '</div>';
    return html;
  }

  function renderSubsPanel(ab){
    var month = {}, year = {}, active = 0;
    ab.subs.forEach(function(x){
      if(!x.active) return;
      active++;
      month[x.currency] = (month[x.currency]||0) + subMonthly(x);
      year[x.currency] = (year[x.currency]||0) + subMonthly(x)*12;
    });
    var t = todayD(), up = [];
    ab.subs.forEach(function(x){
      if(!x.active) return;
      subOccs(x, t, addDays(t, 45)).forEach(function(o){ if(o.status==='pending') up.push({sub: x, date: o.date}); });
    });
    up.sort(function(a,c){ return a.date<c.date ? -1 : (a.date>c.date ? 1 : 0); });
    up = up.slice(0, 6);
    var list = up.length ? up.map(function(r){
      var color = COLORS[r.sub.color] || COLORS.amber;
      return '<div class="up-row"><span class="dot" style="background:'+color+'"></span>'+
        '<span class="up-date">'+fmtHumanNoYear(r.date)+'</span>'+
        '<span class="up-name">'+escapeHtml(r.sub.name)+'</span>'+
        '<span class="up-sum">'+fmtMoney(r.sub.amount, r.sub.currency)+'</span>'+
        '<span class="up-in">'+inDaysText(daysUntil(r.date))+'</span></div>';
    }).join('') : '<div class="empty" style="padding:14px 6px;">'+T('В ближайшие недели списаний нет.')+'</div>';
    return '<div class="finance-wheel-wrap stats">'+
      '<div class="stats-head"><div class="stats-title">'+T('Расходы на подписки')+'</div><div class="stats-legend"><span>'+T('Активных')+': '+active+'</span></div></div>'+
      '<div class="stats-summary two">'+
        '<div><span>'+T('В месяц')+'</span><b>'+totalsText(month)+'</b></div>'+
        '<div><span>'+T('В год')+'</span><b>'+totalsText(year)+'</b></div>'+
      '</div>'+
      '<div class="section-title" style="margin-top:4px;">'+T('Ближайшие списания')+'</div>'+
      list+
    '</div>';
  }

  function subMarkersFor(ab, ds, todayStr){
    var out = '';
    var d = parseD(ds);
    ab.subs.forEach(function(x){
      subOccs(x, d, d).forEach(function(o){
        if(!x.active && o.status!=='paid') return;
        var cls = 'marker';
        if(o.status==='skipped') cls += ' cancelled';
        else if(o.status==='pending'){ cls += ' outline'; if(ds<=todayStr && ds>=x.createdAt) cls += ' due'; }
        out += '<span class="'+cls+'" title="'+escapeHtml(x.name+' · '+fmtMoney(x.amount, x.currency))+'" style="--mc:'+(COLORS[x.color]||COLORS.amber)+'"></span>';
      });
    });
    return out;
  }

  function renderSubsDayModal(){
    var ds = state.selectedDate, ab = activeBoard(), d = parseD(ds), todayStr = fmt(todayD());
    var items = '';
    ab.subs.forEach(function(x){
      subOccs(x, d, d).forEach(function(o){
        if(!x.active && o.status!=='paid') return;
        var color = COLORS[x.color] || COLORS.amber;
        var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(x.name)+'</span><span class="mono" style="font-size:12px;color:var(--ink-dim);">'+fmtMoney(x.amount, x.currency)+'</span></div>';
        var st = '', acts = '';
        if(o.status==='paid'){
          var h = x.history.find(function(v){ return v.id===x.paid[ds]; });
          st = '<div class="status ok">'+T('Оплачено')+(h ? ' · '+fmtMoney(h.amount, x.currency) : '')+'</div>';
          if(h) acts = '<button class="btn small danger" data-act="delete-sub-payment" data-id="'+x.id+'" data-hist="'+h.id+'">'+T('Отменить оплату')+'</button>';
        } else if(o.status==='skipped'){
          st = '<div class="status warn">'+T('Пропущено')+'</div>';
          acts = '<button class="btn small" data-act="sub-unskip" data-id="'+x.id+'" data-date="'+ds+'">'+T('Вернуть')+'</button>';
        } else {
          st = '<div class="status'+(ds<=todayStr?' warn':'')+'">'+(ds<=todayStr ? T('Ждёт подтверждения') : T('Запланировано'))+'</div>';
          acts = '<button class="btn small primary" data-act="sub-pay" data-id="'+x.id+'" data-date="'+ds+'">'+T('Оплачено')+'</button>'+
            '<button class="btn small" data-act="sub-skip" data-id="'+x.id+'" data-date="'+ds+'">'+T('Пропустить')+'</button>';
        }
        items += '<div class="day-item">'+head+st+(acts ? '<div class="row-actions">'+acts+'</div>' : '')+'</div>';
      });
    });
    if(!items) items = '<div class="empty" style="padding:20px 6px;">'+T('В этот день списаний нет.')+'</div>';
    return '<div class="overlay"><div class="modal" data-stop="1">'+
      '<button class="close-x" data-act="close-modal">✕</button>'+
      '<h3 class="display">'+fmtHuman(ds)+'</h3><div class="sub">'+T('Списания в этот день')+'</div>'+items+
    '</div></div>';
  }

  function renderAddSubModal(){
    var ab = activeBoard();
    var editing = (state.editing && state.editing.kind==='sub') ? ab.subs.find(function(x){ return x.id===state.editing.id; }) : null;
    var per = editing ? editing.period : 'month';
    var hist = '';
    if(editing){
      hist = '<div class="section-title">'+T('История оплат')+'</div>'+
        (editing.history.length ? editing.history.slice().reverse().map(function(h){
          return '<div class="day-item compact"><div class="day-item-head"><span class="nm">'+T('за')+' '+fmtHuman(h.orig)+'</span><span class="mono" style="font-size:13px;">'+fmtMoney(h.amount, editing.currency)+'</span></div>'+
            '<div class="row-between"><span class="status">'+T('оплачено')+' '+fmtHuman(h.date)+(h.finance ? ' · '+T('в расходах') : '')+'</span>'+
            '<button class="btn small danger" data-act="delete-sub-payment" data-id="'+editing.id+'" data-hist="'+h.id+'">'+T('Удалить')+'</button></div></div>';
        }).join('') : '<div class="empty" style="padding:12px 6px;">'+T('Оплат пока нет.')+'</div>');
    }
    return '<div class="overlay"><div class="modal" data-stop="1">'+
      '<button class="close-x" data-act="close-modal">✕</button>'+
      '<h3 class="display">'+(editing ? T('Изменить подписку') : T('Новая подписка'))+'</h3>'+
      '<div class="sub">'+T('Укажите сумму и дату списания — приложение посчитает расходы и напомнит заранее')+'</div>'+
      '<form id="add-sub-form">'+
        (editing ? '<input type="hidden" name="editId" value="'+editing.id+'">' : '')+
        '<div class="field"><label>'+T('Название')+'</label><input type="text" name="name" placeholder="'+T('Например, Netflix')+'" value="'+(editing?escapeHtml(editing.name):'')+'" required></div>'+
        '<div class="field-row">'+
          '<div class="field" style="flex:2;"><label>'+T('Сумма')+'</label><input type="number" name="amount" min="0" step="0.01" placeholder="0" value="'+(editing?editing.amount:'')+'" required></div>'+
          '<div class="field" style="flex:1;"><label>'+T('Валюта')+'</label><select name="currency">'+currencyOptionsHtml(editing?editing.currency:DEFAULT_CURRENCY)+'</select></div>'+
        '</div>'+
        '<div class="field" style="margin-top:16px;"><label>'+T('Как часто')+'</label><div class="toggle-row">'+
          '<button type="button" class="toggle-btn'+(per==='month'?' active':'')+'" data-period="month">'+T('Каждый месяц')+'</button>'+
          '<button type="button" class="toggle-btn'+(per==='year'?' active':'')+'" data-period="year">'+T('Каждый год')+'</button>'+
          '<button type="button" class="toggle-btn'+(per==='week'?' active':'')+'" data-period="week">'+T('Каждую неделю')+'</button>'+
        '</div><input type="hidden" name="period" value="'+per+'"></div>'+
        '<div class="field"><label>'+T('Дата списания')+'</label><input type="date" name="startDate" value="'+(editing?editing.startDate:fmt(todayD()))+'" required>'+
          '<div class="field-hint">'+T('Любая дата списания (прошлая или ближайшая) — от неё приложение посчитает все следующие.')+'</div></div>'+
        '<div class="field"><label>'+T('Цвет')+'</label><div class="color-picker">'+
          COLOR_KEYS.map(function(k){
            var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
            return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
          }).join('')+
        '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
        '<div class="modal-actions">'+
          '<button type="button" class="btn" data-act="close-modal">'+T('Отмена')+'</button>'+
          '<button type="submit" class="btn primary">'+(editing ? T('Сохранить') : T('Добавить'))+'</button>'+
        '</div>'+
      '</form>'+hist+
    '</div></div>';
  }

  function renderSubPayModal(){
    var tg = state.subTarget;
    if(!tg) return '';
    var x = findSub(tg.id);
    if(!x) return '';
    var todayStr = fmt(todayD());
    return '<div class="overlay"><div class="modal narrow" data-stop="1">'+
      '<button class="close-x" data-act="close-modal">✕</button>'+
      '<h3 class="display">'+T('Оплата')+' «'+escapeHtml(x.name)+'»</h3>'+
      '<div class="sub">'+T('Списание за')+' '+fmtHuman(tg.date)+'. '+T('Проверьте сумму — если цена изменилась, впишите новую.')+'</div>'+
      '<form id="sub-pay-form">'+
        '<input type="hidden" name="currency" value="'+x.currency+'">'+
        '<div class="field"><label>'+T('Сумма')+' ('+(CURRENCIES[x.currency]||x.currency)+')</label><input type="number" name="amount" min="0.01" step="0.01" value="'+x.amount+'" required></div>'+
        '<div class="field"><label>'+T('Дата оплаты')+'</label><input type="date" name="date" value="'+(tg.date<=todayStr ? todayStr : tg.date)+'" required></div>'+
        '<label class="switch-label" style="margin-bottom:14px !important;"><span>'+T('Запомнить новую цену для следующих списаний')+'</span><input type="checkbox" class="switch" name="updatePrice"></label>'+
        renderFinanceFields(x.financeLink, x.name, '<div class="fin-box"><div class="fin-title">'+T('Записать в расходы')+'</div><div class="field-hint" style="margin:0;">'+T('Создайте доску «Финансы» — тогда оплаты подписок будут сразу попадать в расходы.')+'</div></div>')+
        '<div class="modal-actions">'+
          '<button type="button" class="btn" data-act="close-modal">'+T('Отмена')+'</button>'+
          '<button type="submit" class="btn primary">'+T('Оплачено')+'</button>'+
        '</div>'+
      '</form>'+
    '</div></div>';
  }

  // =====================================================================
  // ---------- ПРИВЫЧКИ ----------
  // =====================================================================
  function habitStart(h){
    var st = h.createdAt;
    Object.keys(h.log).forEach(function(k){ if(k<st) st = k; });
    return st;
  }
  function habitGoal(h){ return h.kind==='count' ? h.target : 1; }
  function habitVal(h, ds){ return Number(h.log[ds]) || 0; }
  function habitDone(h, ds){ return habitVal(h, ds) >= habitGoal(h); }
  function habitPlanned(h, ds){ return h.days.indexOf(parseD(ds).getDay())!==-1; }
  function habitStreak(h){
    var t = todayD(), d = t, n = 0, from = parseD(habitStart(h));
    if(!habitDone(h, fmt(t))) d = addDays(t, -1); // сегодня ещё можно успеть
    for(var g=0; g<1500 && d>=from; g++, d=addDays(d,-1)){
      var ds = fmt(d);
      if(!habitPlanned(h, ds)) continue;
      if(habitDone(h, ds)) n++; else break;
    }
    return n;
  }
  function habitBest(h){
    var t = todayD(), d = parseD(habitStart(h)), best = 0, cur = 0;
    if((t-d)/86400000 > 1500) d = addDays(t, -1500);
    for(; d<=t; d=addDays(d,1)){
      var ds = fmt(d);
      if(!habitPlanned(h, ds)) continue;
      if(habitDone(h, ds)){ cur++; if(cur>best) best = cur; }
      else if(ds!==fmt(t)) cur = 0;
    }
    return best;
  }
  // доля выполненных запланированных дней за последние n дней (сегодня — только если уже сделано)
  function habitRate(h, n){
    var t = todayD(), start = parseD(habitStart(h)), planned = 0, done = 0;
    for(var i=0; i<n; i++){
      var d = addDays(t, -i);
      if(d < start) break;
      var ds = fmt(d);
      if(!habitPlanned(h, ds)) continue;
      if(i===0 && !habitDone(h, ds)) continue;
      planned++;
      if(habitDone(h, ds)) done++;
    }
    return planned ? done/planned : 0;
  }
  function setHabitVal(h, ds, v){
    v = Math.max(0, Math.min(999, Math.round(v)));
    if(v) h.log[ds] = v; else delete h.log[ds];
  }
  function habitAct(boardId, id, ds, op){
    var b = boardId ? findBoard(boardId) : activeBoard();
    var h = b.habits.find(function(x){ return x.id===id; });
    if(!h || !isValidDs(ds) || ds>fmt(todayD())) return;
    var v = habitVal(h, ds), goal = habitGoal(h);
    if(op==='toggle') setHabitVal(h, ds, v>=goal ? 0 : goal);
    else if(op==='inc') setHabitVal(h, ds, v+1);
    else if(op==='dec') setHabitVal(h, ds, v-1);
    if(op!=='dec' && habitDone(h, ds) && v<goal && ds===fmt(todayD())){
      var st = habitStreak(h);
      if(st>=2) showToast('🔥 '+st+' '+plural(st, T('день'), T('дня'), T('дней'))+' '+T('подряд'));
    }
    saveData();
  }
  function addHabit(data){
    var b = activeBoard();
    b.habits.push({id: uid(), name: data.name, color: data.color, kind: data.kind, target: data.target, unit: data.unit, days: data.days, log: {}, createdAt: fmt(todayD())});
    saveData();
  }
  function updateHabit(id, data){
    var h = activeBoard().habits.find(function(x){ return x.id===id; });
    if(!h) return;
    h.name = data.name; h.color = data.color; h.kind = data.kind; h.target = data.target; h.unit = data.unit; h.days = data.days;
    saveData();
  }

  function ringSvg(frac, color, size, stroke){
    var r = (size - stroke)/2, c = 2*Math.PI*r, f = Math.max(0, Math.min(1, frac));
    return '<svg class="ring" width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" aria-hidden="true">'+
      '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-opacity="0.22" stroke-width="'+stroke+'"/>'+
      '<circle class="ring-val" cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="'+stroke+'" stroke-linecap="round" '+
        'stroke-dasharray="'+c.toFixed(2)+'" stroke-dashoffset="'+(c*(1-f)).toFixed(2)+'" style="--ring-c:'+c.toFixed(2)+'" transform="rotate(-90 '+size/2+' '+size/2+')"/>'+
    '</svg>';
  }
  function habitControlHtml(h, ds, boardId){
    var bAttr = boardId ? ' data-board="'+boardId+'"' : '';
    var color = COLORS[h.color] || COLORS.amber;
    var v = habitVal(h, ds), done = habitDone(h, ds);
    if(h.kind==='count'){
      return '<div class="hb-counter'+(done?' done':'')+'" style="--hc:'+color+'">'+
        '<button type="button" class="icon-btn" data-act="habit-dec" data-id="'+h.id+'" data-date="'+ds+'"'+bAttr+' aria-label="−"'+(v?'':' disabled')+'>−</button>'+
        '<span class="hb-val">'+v+' / '+h.target+(h.unit ? ' <small>'+escapeHtml(h.unit)+'</small>' : '')+'</span>'+
        '<button type="button" class="icon-btn" data-act="habit-inc" data-id="'+h.id+'" data-date="'+ds+'"'+bAttr+' aria-label="+">+</button>'+
      '</div>';
    }
    return '<button type="button" class="hb-check'+(done?' done':'')+'" style="--hc:'+color+'" data-act="habit-toggle" data-id="'+h.id+'" data-date="'+ds+'"'+bAttr+'>'+
      '<span class="hb-tick"></span>'+(done ? T('Сделано') : T('Отметить'))+'</button>';
  }
  function habitWeekHtml(h){
    var t = todayD(), todayStr = fmt(t), mon = parseD(weekKey(t)), color = COLORS[h.color] || COLORS.amber;
    var cells = '';
    for(var i=0; i<7; i++){
      var d = addDays(mon, i), ds = fmt(d);
      var planned = habitPlanned(h, ds), v = habitVal(h, ds), done = habitDone(h, ds);
      var cls = 'hb-day';
      if(ds===todayStr) cls += ' today';
      if(done) cls += ' done';
      else if(v>0) cls += ' part';
      else if(!planned) cls += ' off';
      else if(ds<todayStr) cls += ' miss';
      var future = ds>todayStr;
      cells += '<button type="button" class="'+cls+'"'+(future ? ' disabled' : ' data-act="habit-toggle" data-id="'+h.id+'" data-date="'+ds+'"')+
        ' title="'+fmtHumanNoYear(ds)+'"><span class="hb-dl">'+DOW_LABELS[i]+'</span><i style="--hc:'+color+'"></i></button>';
    }
    return '<div class="hb-week">'+cells+'</div>';
  }
  function renderHabitsSidebar(ab){
    var todayStr = fmt(todayD());
    var html = '<div class="sidebar"><h2>'+T('Привычки')+'</h2>'+renderSearchBox()+'<div class="cards">';
    if(!ab.habits.length){
      html += '<div class="empty" style="padding:20px 6px;"><div class="display">'+T('Пока пусто')+'</div>'+T('Добавьте привычку — например, «Вода, 8 стаканов» или «Спорт» по будням.')+'</div>';
    }
    ab.habits.forEach(function(h){
      var color = COLORS[h.color] || COLORS.amber;
      var st = habitStreak(h), best = habitBest(h);
      var planned = habitPlanned(h, todayStr);
      html += ''+
        '<div class="punch-card habit-card">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt" title="'+escapeHtml(h.name)+'">'+escapeHtml(h.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="edit-habit" data-id="'+h.id+'" title="'+T('Изменить')+'" style="width:26px;height:26px;font-size:12px;">✎</button>'+
              '<button class="icon-btn" data-act="delete-habit" data-id="'+h.id+'" title="'+T('Удалить')+'" style="width:26px;height:26px;font-size:13px;">✕</button>'+
            '</div>'+
          '</div>'+
          '<div class="pc-body">'+
            '<div class="hb-streak">'+(st>0 ? '🔥 <b>'+st+'</b> '+plural(st, T('день'), T('дня'), T('дней'))+' '+T('подряд') : '<span class="dim">'+T('Серия ещё не началась')+'</span>')+
              (best>0 ? '<span class="dim"> · '+T('рекорд')+' '+best+'</span>' : '')+'</div>'+
            habitWeekHtml(h)+
            '<div class="hb-today">'+(planned ? habitControlHtml(h, todayStr) : '<span class="dim">'+T('Сегодня выходной от этой привычки')+'</span>')+'</div>'+
          '</div>'+
        '</div>';
    });
    html += '</div>';
    html += '<button class="add-card" data-act="open-add">+ '+T('Добавить привычку')+'</button>';
    html += '</div>';
    return html;
  }
  function renderHabitsPanel(ab){
    var todayStr = fmt(todayD());
    var todays = ab.habits.filter(function(h){ return habitPlanned(h, todayStr); });
    var doneN = todays.filter(function(h){ return habitDone(h, todayStr); }).length;
    var rings = todays.map(function(h){
      var color = COLORS[h.color] || COLORS.amber;
      var frac = habitVal(h, todayStr)/habitGoal(h);
      return '<div class="hb-ring">'+ringSvg(frac, color, 64, 8)+
        '<div class="hb-ring-name" title="'+escapeHtml(h.name)+'">'+escapeHtml(h.name)+'</div>'+
        '<div class="hb-ring-val">'+(h.kind==='count' ? habitVal(h, todayStr)+'/'+h.target : (habitDone(h, todayStr) ? '✓' : '—'))+'</div></div>';
    }).join('');
    var rates = ab.habits.map(function(h){
      var color = COLORS[h.color] || COLORS.amber;
      var r = habitRate(h, 30);
      return '<div class="hb-rate"><span class="hb-rate-name">'+escapeHtml(h.name)+'</span>'+
        '<div class="budget-bar"><i style="width:'+(r*100).toFixed(1)+'%;background:'+color+'"></i></div>'+
        '<span class="hb-rate-pct">'+Math.round(r*100)+'%</span></div>';
    }).join('');
    var allFrac = todays.length ? doneN/todays.length : 0;
    return '<div class="finance-wheel-wrap stats">'+
      '<div class="stats-head"><div class="stats-title">'+T('Сегодня')+'</div>'+
        '<div class="stats-legend"><span>'+T('Выполнено')+': '+doneN+' '+T('из')+' '+todays.length+'</span></div></div>'+
      (todays.length ? '<div class="hb-today-wrap"><div class="hb-big">'+ringSvg(allFrac, 'var(--sage)', 96, 11)+'<div class="hb-big-pct">'+Math.round(allFrac*100)+'%</div></div>'+
        '<div class="hb-rings">'+rings+'</div></div>'
        : '<div class="empty" style="padding:14px 6px;">'+T('На сегодня привычек нет.')+'</div>')+
      (ab.habits.length ? '<div class="section-title">'+T('За последние 30 дней')+'</div>'+rates : '')+
    '</div>';
  }
  function habitMarkersFor(ab, ds, todayStr){
    var out = '';
    ab.habits.forEach(function(h){
      var v = habitVal(h, ds), planned = habitPlanned(h, ds);
      if(ds>todayStr || (!planned && !v) || ds<habitStart(h)) return;
      var cls = 'marker';
      if(habitDone(h, ds)) cls += '';
      else if(v>0) cls += ' outline';
      else cls += ' outline faint';
      out += '<span class="'+cls+'" title="'+escapeHtml(h.name+(h.kind==='count' ? ' · '+v+'/'+h.target : ''))+'" style="--mc:'+(COLORS[h.color]||COLORS.amber)+'"></span>';
    });
    return out;
  }
  function renderHabitsDayModal(){
    var ds = state.selectedDate, ab = activeBoard(), todayStr = fmt(todayD());
    var items = '';
    ab.habits.forEach(function(h){
      var planned = habitPlanned(h, ds), v = habitVal(h, ds);
      if(!planned && !v) return;
      var color = COLORS[h.color] || COLORS.amber;
      items += '<div class="day-item"><div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(h.name)+'</span></div>'+
        (ds>todayStr ? '<div class="status">'+T('Отметить можно будет в этот день')+'</div>' : '<div class="row-actions">'+habitControlHtml(h, ds)+'</div>')+
      '</div>';
    });
    if(!items) items = '<div class="empty" style="padding:20px 6px;">'+T('В этот день привычек нет.')+'</div>';
    return '<div class="overlay"><div class="modal" data-stop="1">'+
      '<button class="close-x" data-act="close-modal">✕</button>'+
      '<h3 class="display">'+fmtHuman(ds)+'</h3><div class="sub">'+T('Привычки в этот день')+'</div>'+items+
    '</div></div>';
  }
  function renderAddHabitModal(){
    var ab = activeBoard();
    var editing = (state.editing && state.editing.kind==='habit') ? ab.habits.find(function(x){ return x.id===state.editing.id; }) : null;
    var kind = editing ? editing.kind : 'check';
    var days = editing ? editing.days : DOW_VALUES.slice();
    return '<div class="overlay"><div class="modal" data-stop="1">'+
      '<button class="close-x" data-act="close-modal">✕</button>'+
      '<h3 class="display">'+(editing ? T('Изменить привычку') : T('Новая привычка'))+'</h3>'+
      '<div class="sub">'+T('Отмечайте каждый день — приложение посчитает серию и процент выполнения')+'</div>'+
      '<form id="add-habit-form">'+
        (editing ? '<input type="hidden" name="editId" value="'+editing.id+'">' : '')+
        '<div class="field"><label>'+T('Название')+'</label><input type="text" name="name" placeholder="'+T('Например, вода или зарядка')+'" value="'+(editing?escapeHtml(editing.name):'')+'" required></div>'+
        '<div class="field"><label>'+T('Как отмечать')+'</label><div class="toggle-row">'+
          '<button type="button" class="toggle-btn'+(kind==='check'?' active':'')+'" data-kind="check">'+T('Галочкой')+'</button>'+
          '<button type="button" class="toggle-btn'+(kind==='count'?' active':'')+'" data-kind="count">'+T('Счётчиком')+'</button>'+
        '</div><input type="hidden" name="kind" value="'+kind+'"></div>'+
        '<div class="field-row" data-kind-field="count" style="margin-bottom:16px;'+(kind==='count'?'':'display:none;')+'">'+
          '<div class="field" style="flex:1;"><label>'+T('Цель в день')+'</label><input type="number" name="target" min="1" step="1" value="'+(editing?editing.target:8)+'"></div>'+
          '<div class="field" style="flex:1;"><label>'+T('Единица')+'</label><input type="text" name="unit" placeholder="'+T('стаканов')+'" value="'+(editing?escapeHtml(editing.unit):'')+'"></div>'+
        '</div>'+
        '<div class="field"><label>'+T('В какие дни')+'</label><div class="day-toggles">'+
          DOW_VALUES.map(function(v, idx){
            return '<button type="button" class="day-toggle'+(days.indexOf(v)!==-1?' active':'')+'" data-day="'+v+'">'+DOW_LABELS[idx]+'</button>';
          }).join('')+
        '</div><div class="field-hint">'+T('В другие дни привычка не ждёт отметки и не обнуляет серию.')+'</div></div>'+
        '<div class="field"><label>'+T('Цвет')+'</label><div class="color-picker">'+
          COLOR_KEYS.map(function(k){
            var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
            return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
          }).join('')+
        '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
        '<div class="modal-actions">'+
          '<button type="button" class="btn" data-act="close-modal">'+T('Отмена')+'</button>'+
          '<button type="submit" class="btn primary">'+(editing ? T('Сохранить') : T('Добавить'))+'</button>'+
        '</div>'+
      '</form>'+
    '</div></div>';
  }

  // =====================================================================
  // ---------- БЫСТРЫЙ ВВОД (чат на телефоне) ----------
  // Не ИИ: разбор строки по простым правилам — сумма, дата, валюта, счёт, категория.
  // =====================================================================
  var quick = {fab: null, sheet: null, log: null, input: null, suggest: null, open: false, greeted: false, pendingMsg: null};

  var Q_WORDS = {
    today: ['сегодня','сьогодні','today'],
    yesterday: ['вчера','вчора','yesterday'],
    before: ['позавчера','позавчора'],
    income: ['доход','дохід','income','получил','получила','отримав','отримала','зарплата+']
  };
  var Q_CUR = {'₴':'UAH','грн':'UAH','гривен':'UAH','гривень':'UAH','uah':'UAH','$':'USD','usd':'USD','долл':'USD','доларів':'USD','долларов':'USD','€':'EUR','eur':'EUR','евро':'EUR','євро':'EUR','zł':'PLN','pln':'PLN','злотых':'PLN','злотих':'PLN'};
  function qCurrency(tok){
    if(Q_CUR[tok] && CURRENCY_KEYS.indexOf(Q_CUR[tok])!==-1) return Q_CUR[tok];
    var up = tok.toUpperCase();
    return CURRENCY_KEYS.indexOf(up)!==-1 ? up : null;
  }
  function qNorm(w){ return String(w||'').toLowerCase().replace(/ё/g,'е').replace(/[«»"'.,!?()]/g,'').trim(); }
  // похожие слова: «наличные» ≈ «наличными», «карта» ≈ «картой», «кофе» ≈ «кофейня»
  function qSimilar(a, b){
    a = qNorm(a); b = qNorm(b);
    if(!a || !b) return 0;
    if(a===b) return 3;
    var n = 0, m = Math.min(a.length, b.length);
    while(n<m && a[n]===b[n]) n++;
    if(m<4) return 0;
    return n >= Math.max(4, m-2) ? 2 : 0;
  }
  function qWords(str){ return qNorm(str).split(/\s+/).filter(Boolean); }
  // насколько слова пользователя похожи на название/синонимы
  function qScore(words, names){
    var best = 0;
    names.forEach(function(name){
      var nw = qWords(name);
      if(!nw.length) return;
      var hit = 0;
      nw.forEach(function(x){ var m = 0; words.forEach(function(w){ m = Math.max(m, qSimilar(w, x)); }); hit += m; });
      var sc = hit / nw.length;
      if(sc > best) best = sc;
    });
    return best;
  }

  // «не менять баланс»: сокращения на всех языках работают всегда
  var Q_NOBAL = ['нмб','dcb','нзб'];
  var Q_NOBAL_PHRASE = /не\s+менять\s+баланс|не\s+змінювати\s+баланс|don'?t\s+change\s+balance|без\s+баланса|без\s+балансу|no\s+balance/gi;
  function qParse(text){
    var raw = String(text||'').trim();
    var res = {raw: raw, amount: null, sign: 0, currency: null, date: null, dateWord: '', words: [], rawWords: [], noBalance: false};
    var toks = raw.replace(Q_NOBAL_PHRASE, ' нмб ').replace(/([0-9])(₴|\$|€|грн|uah|usd|eur|pln|zł)/gi, '$1 $2').replace(/(₴|\$|€)([0-9])/g, '$1 $2').split(/\s+/).filter(Boolean);
    var t = todayD();
    toks.forEach(function(orig){
      var tok = orig.toLowerCase();
      var m = tok.match(/^([+\-−]?)(\d+(?:[.,]\d{1,2})?)$/);
      if(m && res.amount===null){
        res.amount = parseFloat(m[2].replace(',', '.'));
        if(m[1]==='+') res.sign = 1;
        return;
      }
      var dm = tok.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/);
      if(dm){
        var dd = +dm[1], mm = +dm[2]-1, yy = dm[3] ? +dm[3] : t.getFullYear();
        if(yy<100) yy += 2000;
        var d = new Date(yy, mm, dd);
        if(d.getMonth()===mm && d.getDate()===dd){
          if(!dm[3] && d > t) d = new Date(yy-1, mm, dd);
          res.date = fmt(d); res.dateWord = fmtHumanNoYear(res.date);
          return;
        }
      }
      var nt = qNorm(tok);
      if(Q_WORDS.today.indexOf(nt)!==-1){ res.date = fmt(t); res.dateWord = T('сегодня'); return; }
      if(Q_WORDS.yesterday.indexOf(nt)!==-1){ res.date = fmt(addDays(t,-1)); res.dateWord = T('вчера'); return; }
      if(Q_WORDS.before.indexOf(nt)!==-1){ res.date = fmt(addDays(t,-2)); res.dateWord = T('позавчера'); return; }
      if(tok==='+'){ res.sign = 1; return; }
      var cur = qCurrency(tok);
      if(cur && !res.currency){ res.currency = cur; return; }
      if(Q_WORDS.income.indexOf(nt)!==-1){ res.sign = 1; return; }
      if(Q_NOBAL.indexOf(nt)!==-1){ res.noBalance = true; return; }
      if(nt) { res.words.push(nt); res.rawWords.push(orig.replace(/[«»"']/g,'')); }
    });
    if(!res.date){ res.date = fmt(t); res.dateWord = ''; }
    return res;
  }

  function finBoards(){
    var list = state.boards.filter(function(b){ return b.type==='finance'; });
    var ab = activeBoard();
    list.sort(function(a,b){ return (a.id===ab.id ? -1 : 0) - (b.id===ab.id ? -1 : 0); });
    return list;
  }
  // найти и «вынуть» из слов название счёта
  function qTakeAccount(p, board, currency, mainOnly){
    var best = null, bestSc = 0, bestIdx = -1;
    var usable = function(bal){ return !currency || getRate(board, currency, bal.currency)!==null; };
    // второстепенный счёт узнаём, но для трат не используем
    var pick = function(bal){
      if(mainOnly && bal.kind!=='main'){ p.accountSecondary = bal.label; return null; }
      return bal;
    };
    board.balances.forEach(function(bal){
      if(!bal.label || !usable(bal)) return;
      var lw = qWords(bal.label);
      p.words.forEach(function(w, i){
        lw.forEach(function(x){ var sc = qSimilar(w, x); if(sc>bestSc){ bestSc = sc; best = bal; bestIdx = i; } });
      });
    });
    if(best && bestSc>=2){ p.words.splice(bestIdx, 1); p.rawWords.splice(bestIdx, 1); return pick(best); }
    // синонимы: «cash» найдёт счёт «Наличные», «картка» — «Карта» и т.д.
    for(var i=0; i<p.words.length; i++){
      var grp = qAccGroup(p.words[i]);
      if(!grp) continue;
      var matches = board.balances.filter(function(x){
        return x.label && usable(x) && qWords(x.label).some(function(lw){ return qAccGroup(lw)===grp; });
      });
      var bal = (mainOnly ? matches.find(function(x){ return x.kind==='main'; }) : null) || matches[0];
      var raw = p.rawWords[i];
      p.words.splice(i, 1); p.rawWords.splice(i, 1);
      if(bal) return pick(bal);
      p.accountMiss = raw; // слово про счёт есть, но такого счёта нет
      return null;
    }
    return null;
  }
  var Q_ACC_GROUPS = {
    cash: ['наличные','наличными','наличка','наличкой','нал','кеш','кэш','кешем','готівка','готівкою','готівки','cash'],
    card: ['карта','картой','карты','карточка','карточкой','картка','карткою','картки','card','visa','mastercard']
  };
  function qAccGroup(w){
    var n = qNorm(w);
    for(var g in Q_ACC_GROUPS){
      if(Q_ACC_GROUPS[g].some(function(x){ return x===n || (n.length>=4 && qSimilar(n, x)>=2); })) return g;
    }
    return null;
  }
  // счёт по умолчанию: для регулярного платежа — его счёт, иначе основной в этой валюте
  function qDefaultAccount(board, item, currency, kind){
    var spending = kind!=='income';
    if(item.recurring && item.recurring.balanceId){
      var b1 = board.balances.find(function(x){ return x.id===item.recurring.balanceId; });
      if(b1 && (!spending || b1.kind==='main')) return b1;
    }
    return board.balances.find(function(x){ return x.currency===currency && x.kind==='main'; }) ||
           (spending ? null : board.balances.find(function(x){ return x.currency===currency; })) || null;
  }
  // лучшая категория расходов (или подкатегория) / доход для слов пользователя
  function qFindItem(words, kind, currency){
    var best = null;
    finBoards().forEach(function(b, bi){
      var list = kind==='income' ? b.income : b.expenses;
      list.forEach(function(it){
        if(currency && it.currency!==currency) return;
        var names = [it.name].concat(it.aliases||[]);
        var sc = qScore(words, names), sub = null;
        if(kind==='expense'){
          (it.subs||[]).forEach(function(sb){
            var ss = qScore(words, [sb.name]);
            if(ss>=2 && ss>=sc){ sc = ss + 0.1; sub = sb; }
          });
        }
        if(sc>=2){
          var rank = sc - bi*0.01;
          if(!best || rank>best.rank) best = {board: b, item: it, sub: sub, rank: rank};
        }
      });
    });
    return best;
  }
  function qFindHabit(words){
    var best = null;
    state.boards.forEach(function(b){
      if(b.type!=='habits') return;
      b.habits.forEach(function(h){
        var sc = qScore(words, [h.name]);
        if(sc>=2 && (!best || sc>best.sc)) best = {board: b, habit: h, sc: sc};
      });
    });
    return best;
  }
  function qCap(s){ s = String(s||'').trim(); return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }
  function qUnusedColor(list){
    var used = list.map(function(x){ return x.color; });
    return COLOR_KEYS.find(function(k){ return used.indexOf(k)===-1; }) || COLOR_KEYS[list.length % COLOR_KEYS.length];
  }

  // записать операцию и вернуть ответ
  function qRecord(target, p, kind, opts){
    opts = opts || {};
    var b = target.board, it = target.item;
    var acc = p.noBalance ? null : (opts.account || qDefaultAccount(b, it, it.currency, kind));
    var found = addTransactionOn(b, kind, it.id, p.amount, acc ? acc.id : null, p.date, target.sub ? target.sub.id : null);
    var ref = {boardId: b.id, kind: kind, itemId: it.id, histId: lastHistoryId};
    if(opts.learn && p.words.length){
      // запоминаем слова, чтобы в следующий раз найти категорию сразу
      var w = p.words.join(' ');
      if(qScore(p.words, [it.name].concat(it.aliases||[])) < 2 && it.aliases.indexOf(w)===-1) it.aliases.push(w);
    }
    saveData();
    var sign = kind==='income' ? '+' : '−';
    var where = escapeHtml(it.name) + (target.sub ? ' › '+escapeHtml(target.sub.name) : '');
    var lines = [
      '<b>'+where+'</b> · <span class="'+(kind==='income'?'q-pos':'q-neg')+'">'+sign+fmtMoney2(p.amount, it.currency)+'</span>',
      T('Доска')+' «'+escapeHtml(b.name)+'» · '+(kind==='income' ? T('доходы') : T('расходы'))+(p.dateWord ? ' · '+escapeHtml(p.dateWord) : '')
    ];
    var bal = found && acc ? b.balances.find(function(x){ return x.id===acc.id; }) : null;
    if(p.accountSecondary && !p.noBalance) lines.push('⚠️ «'+escapeHtml(p.accountSecondary)+'» — '+T('второстепенный счёт. Траты из быстрого ввода списываются только с основных')+(bal ? '' : '.'));
    if(p.accountMiss && !p.noBalance) lines.push('⚠️ '+T('Счёт')+' «'+escapeHtml(p.accountMiss)+'» '+T('не найден — использован основной'));
    if(bal){
      var hh = (it.history||[]).find(function(x){ return x.id===ref.histId; });
      var conv = (bal.currency!==it.currency && hh && typeof hh.balAmount==='number') ? ' ('+fmtMoney2(hh.balAmount, bal.currency)+' '+T('по курсу')+')' : '';
      lines.push((kind==='income' ? T('Зачислено на') : T('Списано с'))+' «'+escapeHtml(bal.label || T('счёт'))+'»'+conv+' · '+T('осталось')+' '+fmtMoney2(bal.amount, bal.currency));
    }
    else if(p.noBalance) lines.push('<span class="dim">'+T('Баланс не менялся')+' («'+T('нмб')+'»)</span>');
    else lines.push('<span class="dim">'+(kind==='income' ? T('Баланс не менялся — счёта в этой валюте нет') : T('Баланс не менялся — нет основного счёта в этой валюте'))+'</span>');
    if(kind==='expense' && it.budget>0){
      var spent = spentInMonth(it, monthKeyOf(fmt(todayD())));
      var pct = Math.round(spent/it.budget*100);
      lines.push((pct>100 ? '⚠️ ' : '')+T('Бюджет месяца')+': '+pct+'% · '+fmtMoney2(spent, it.currency)+' '+T('из')+' '+fmtMoney2(it.budget, it.currency));
    }
    return {html: '✅ '+T('Готово')+'<div class="q-lines">'+lines.map(function(l){ return '<div>'+l+'</div>'; }).join('')+'</div>',
      actions: [{label: T('Отменить'), fn: function(){
        var fb = state.boards.find(function(x){ return x.id===ref.boardId; });
        if(fb) deleteTransactionOn(fb, ref.kind, ref.itemId, ref.histId);
        saveData();
        qBot('↩️ '+T('Отменено'));
      }}]};
  }

  function qHandle(text){
    if(adminTryCode(text)) return;
    var p = qParse(text);
    var trimmed = String(text||'').trim();
    var low = qNorm(text);
    if(/^\?+$/.test(trimmed) || ['помощь','помогите','справка','help','допомога','довідка','команды','команди'].indexOf(low)!==-1){ qHelp(); return; }
    if(!low) return;

    // привычки: «вода», «вода 2», «спорт»
    if(!p.sign && !p.currency && p.words.length){
      var hb = qFindHabit(p.words);
      var exp0 = p.amount!==null ? qFindItem(p.words, 'expense', null) : null;
      if(hb && (p.amount===null || (hb.habit.kind==='count' && (!exp0 || exp0.rank<hb.sc)))){
        qHabit(hb, p); return;
      }
    }
    if(p.amount===null || !(p.amount>0)){
      qBot(T('Не вижу сумму 🤔 Напишите, например:')+' <b>'+T('кофе 85')+'</b>. '+T('Справка')+' — «?»');
      return;
    }
    var fins = finBoards();
    if(!fins.length){ qBot(T('Сначала создайте доску «Финансы» — туда будут записываться траты и доходы.')); return; }
    var kind = p.sign>0 ? 'income' : 'expense';
    if(kind==='income'){
      var hit = qFindAccountAny(p);
      if(hit){
        var incT = hit.words.length ? qFindItem(hit.words, 'income', p.currency) : null;
        if(incT && incT.board===hit.board){
          p.words = hit.words; p.rawWords = hit.rawWords;
          var ri = qRecord(incT, p, 'income', {account: hit.bal});
          qBot(ri.html, ri.actions);
        } else qTopUp(hit, p);
        return;
      }
    }
    if(!p.words.length){
      var firstBal = fins[0].balances[0];
      qBot(kind==='income'
        ? T('Куда зачислить? Добавьте счёт:')+' <b>+'+p.amount+' '+escapeHtml(firstBal ? qNorm(firstBal.label) || T('карта') : T('карта'))+'</b>'
        : T('А на что? Добавьте название:')+' <b>'+T('кофе')+' '+p.amount+'</b>');
      return;
    }
    var target = qFindItem(p.words, kind, p.currency);
    if(target){
      var acc = qTakeAccount(p, target.board, target.item.currency, kind==='expense');
      var r = qRecord(target, p, kind, {account: acc});
      qBot(r.html, r.actions);
      return;
    }
    qAskCategory(p, kind);
  }

  // найти счёт по словам на любой доске финансов
  function qFindAccountAny(p){
    var res = null;
    finBoards().some(function(b){
      var c = {words: p.words.slice(), rawWords: p.rawWords.slice()};
      var bal = qTakeAccount(c, b, null);
      if(bal){ res = {board: b, bal: bal, words: c.words, rawWords: c.rawWords}; return true; }
      return false;
    });
    return res;
  }
  function qTopUp(hit, p){
    var b = hit.board, bal = hit.bal, amount = p.amount;
    if(p.currency && p.currency!==bal.currency){
      var rate = getRate(b, p.currency, bal.currency);
      if(rate===null){ qBot(T('Счёт')+' «'+escapeHtml(bal.label)+'» '+T('в другой валюте, а курса нет. Добавьте курс в «Курсы валют».')); return; }
      amount = r2(amount*rate);
    }
    var note = hit.rawWords.join(' ');
    var hid = topUpBalance(b, bal.id, amount, p.date, note);
    qBot('✅ '+T('Готово')+'<div class="q-lines">'+
      '<div><b>'+T('Пополнение')+' «'+escapeHtml(bal.label || T('счёт'))+'»</b> · <span class="q-pos">+'+fmtMoney2(amount, bal.currency)+'</span></div>'+
      (note ? '<div>'+escapeHtml(note)+'</div>' : '')+
      '<div>'+T('Баланс')+': '+fmtMoney2(bal.amount, bal.currency)+(p.dateWord ? ' · '+escapeHtml(p.dateWord) : '')+'</div>'+
      '<div class="dim">'+T('Это не доход — в статистику не попадёт')+'</div></div>',
      [{label: T('Отменить'), fn: function(){ deleteBalanceEntry(b, bal.id, hid); qBot('↩️ '+T('Отменено')); }}]);
  }

  function qAskCategory(p, kind){
    var fb = finBoards()[0];
    var cur = p.currency || (fb.balances[0] ? fb.balances[0].currency : DEFAULT_CURRENCY);
    var acc = p.noBalance ? null : qTakeAccount(p, fb, cur, kind==='expense');
    if(!p.words.length){ qBot(T('А на что? Добавьте название:')+' <b>'+T('кофе')+' '+p.amount+'</b>'); return; }
    var list = (kind==='income' ? fb.income : fb.expenses).filter(function(x){ return x.currency===cur; });
    var name = qCap(p.rawWords.join(' '));
    var acts = list.slice(0, 8).map(function(it){
      return {label: it.name, fn: function(){
        var r = qRecord({board: fb, item: it, sub: null}, p, kind, {learn: true, account: acc});
        qBot(r.html + '<div class="q-note">'+T('Запомнил: «')+escapeHtml(p.words.join(' '))+T('» → ')+escapeHtml(it.name)+'</div>', r.actions);
      }};
    });
    acts.push({label: '+ '+T('Новая')+' «'+name+'»', primary: true, fn: function(){
      var listAll = kind==='income' ? fb.income : fb.expenses;
      var it;
      if(kind==='income'){
        var todayStr = fmt(todayD());
        it = {id: uid(), name: name, color: qUnusedColor(listAll), amount: 0, currency: cur, scheduleType: 'once', date: todayStr, dayOfMonth: 1,
          history: [], confirmed: {}, postponed: {}, skipped: [], createdAt: todayStr};
      } else {
        it = {id: uid(), name: name, color: qUnusedColor(listAll), amount: 0, currency: cur, budget: 0, subs: [], history: [], aliases: [], recurring: null};
      }
      listAll.push(it);
      var r = qRecord({board: fb, item: it, sub: null}, p, kind, {account: acc});
      qBot('🆕 '+T('Создана категория')+' «'+escapeHtml(name)+'»<br>'+r.html, r.actions);
    }});
    qBot((kind==='income' ? T('Не нашёл такой доход:') : T('Не нашёл категорию для'))+' «'+escapeHtml(p.rawWords.join(' '))+'» · '+fmtMoney2(p.amount, cur)+'. '+T('Куда записать?'), acts, true);
  }

  function qHabit(hb, p){
    var h = hb.habit, ds = p.date > fmt(todayD()) ? fmt(todayD()) : p.date;
    var before = habitVal(h, ds), goal = habitGoal(h);
    if(h.kind==='count') setHabitVal(h, ds, before + (p.amount!==null ? Math.round(p.amount) : 1));
    else setHabitVal(h, ds, before>=goal ? before : goal);
    saveData();
    var v = habitVal(h, ds), st = habitStreak(h);
    var line = h.kind==='count'
      ? '<b>'+escapeHtml(h.name)+'</b> · '+v+' / '+h.target+(h.unit ? ' '+escapeHtml(h.unit) : '')+(v>=h.target ? ' 🎉' : '')
      : '<b>'+escapeHtml(h.name)+'</b> · '+(before>=goal ? T('уже было отмечено') : T('отмечено'));
    qBot('✅ '+T('Готово')+'<div class="q-lines"><div>'+line+'</div>'+
      '<div>'+T('Привычки')+' «'+escapeHtml(hb.board.name)+'»'+(p.dateWord ? ' · '+escapeHtml(p.dateWord) : '')+'</div>'+
      (st>0 ? '<div>🔥 '+st+' '+plural(st, T('день'), T('дня'), T('дней'))+' '+T('подряд')+'</div>' : '')+'</div>',
      [{label: T('Отменить'), fn: function(){ setHabitVal(h, ds, before); saveData(); qBot('↩️ '+T('Отменено')); }}]);
  }

  function qGreet(){
    quick.greeted = true;
    qBot('<div class="q-badge"><span class="q-badge-ico">⚙︎</span><div><b>'+T('Это не ИИ')+'</b><br>'+
      T('Простой помощник по шаблону: понимает только короткие записи вида «название сумма». Вопросы и обычный текст он не поймёт.')+'</div></div>'+
      T('Напишите трату одной строкой — например,')+' <b>'+T('кофе 85')+'</b>. '+T('Подсказки появятся прямо над полем ввода, справка — «?»'));
  }
  function qClear(){
    if(!quick.log) return;
    quick.log.innerHTML = '';
    qGreet();
    quick.input.focus();
  }
  function qHelp(){
    qBot('<b>'+T('Как писать')+'</b><div class="q-lines">'+
      '<div><b>'+T('кофе 85')+'</b> — '+T('трата сегодня')+'</div>'+
      '<div><b>'+T('такси 200 вчера')+'</b> — '+T('трата за вчера (или дата: 28.09)')+'</div>'+
      '<div><b>'+T('хлеб 30 карта')+'</b> — '+T('с конкретного счёта, подкатегории тоже находятся')+'</div>'+

      '<div><b>'+T('кофе 85 нмб')+'</b> — '+T('записать трату, не меняя баланс')+' («'+T('нмб')+'» = '+T('не менять баланс')+')</div>'+
      '<div><b>'+T('+500 карта')+'</b> — '+T('пополнить счёт')+'</div>'+
      '<div><b>'+T('вода')+'</b> / <b>'+T('вода 2')+'</b> — '+T('отметить привычку')+'</div>'+
      '</div><div class="q-note">'+T('Если категорию не найду — предложу выбрать, и запомню слово на будущее.')+'</div>');
  }

  // ---------- подсказки над полем ввода ----------
  function qHideSuggest(){ if(quick.suggest){ quick.suggest.hidden = true; quick.suggest.innerHTML = ''; } }
  function qApplySuggestion(text, mode){
    var v = quick.input.value;
    if(mode==='replace'){
      // заменить недописанное слово
      v = v.replace(/\S*$/, '') + text + ' ';
    } else if(mode==='append'){
      v = v.replace(/\s*$/, '') + (v.trim() ? ' ' : '') + text + ' ';
    } else v = text;
    quick.input.value = v;
    quick.input.focus();
    try{ quick.input.setSelectionRange(v.length, v.length); }catch(e){}
    qUpdateSuggest();
  }
  // все имена, которые чат умеет узнавать
  function qVocabulary(){
    var out = [];
    finBoards().forEach(function(b){
      b.expenses.forEach(function(e){
        out.push({name: e.name, kind: 'exp', sub: T('расход')});
        (e.subs||[]).forEach(function(sb){ out.push({name: sb.name, kind: 'exp', sub: e.name+' › '+T('подкатегория')}); });
        (e.aliases||[]).forEach(function(a){ out.push({name: a, kind: 'exp', sub: '→ '+e.name}); });
      });
    });
    state.boards.forEach(function(b){
      if(b.type!=='habits') return;
      b.habits.forEach(function(h){ out.push({name: h.name, kind: 'habit', sub: T('привычка')}); });
    });
    return out;
  }
  function qRow(label, sub, insert, mode, cls){
    return '<button type="button" class="qs-sg-row'+(cls?' '+cls:'')+'" data-insert="'+escapeHtml(insert)+'" data-mode="'+mode+'">'+
      '<span class="qs-sg-label">'+label+'</span>'+(sub ? '<span class="qs-sg-sub">'+sub+'</span>' : '')+'</button>';
  }
  function qUpdateSuggest(){
    if(!quick.suggest) return;
    var text = quick.input.value;
    var html = '';
    if(!text.trim()){
      // пустое поле — показываем шаблоны
      html = '<div class="qs-sg-title">'+T('Что можно написать')+'</div>'+
        qRow('<b>'+T('название')+'</b> <b>'+T('сумма')+'</b>', T('трата сегодня')+' · '+T('кофе 85'), T('кофе 85'), 'set')+
        qRow('<b>'+T('название')+'</b> <b>'+T('сумма')+'</b> '+T('вчера'), T('или дата, например 28.09'), T('такси 200 вчера'), 'set')+
        qRow('<b>'+T('название')+'</b> <b>'+T('сумма')+'</b> <b>'+T('счёт')+'</b>', T('списать с конкретного счёта'), T('хлеб 30 карта'), 'set')+
        qRow('<b>'+T('название')+'</b> <b>'+T('сумма')+'</b> '+T('нмб'), T('не менять баланс'), T('кофе 85 нмб'), 'set')+
        qRow('<b>+'+T('сумма')+'</b> <b>'+T('счёт')+'</b>', T('пополнить счёт'), T('+500 карта'), 'set')+
        qRow('<b>'+T('привычка')+'</b>', T('отметить, для счётчика можно добавить число'), T('вода'), 'set');
      quick.suggest.innerHTML = html;
      quick.suggest.hidden = false;
      return;
    }
    var p = qParse(text);
    var endsSpace = /\s$/.test(text);
    var lastTok = endsSpace ? '' : (text.split(/\s+/).pop() || '');
    var lastIsNum = /^[+\-−]?\d/.test(lastTok);
    var partial = (!lastIsNum && lastTok) ? qNorm(lastTok) : '';

    // 1) превью: что произойдёт после отправки
    var preview = '';
    var topHit = (p.sign>0 && p.amount>0) ? qFindAccountAny(p) : null;
    if(topHit && !(topHit.words.length && qFindItem(topHit.words, 'income', p.currency))){
      preview = '<span class="qs-sg-ok">↵</span> '+T('Пополнить')+' <b>«'+escapeHtml(topHit.bal.label)+'»</b> · +'+fmtMoney2(p.amount, p.currency || topHit.bal.currency);
    } else if(p.amount>0 && p.words.length){
      var kind = p.sign>0 ? 'income' : 'expense';
      var pc = JSON.parse(JSON.stringify({w: p.words, r: p.rawWords}));
      var tp = {words: pc.w, rawWords: pc.r};
      var target = qFindItem(tp.words, kind, p.currency);
      if(target){
        var acc = qTakeAccount(tp, target.board, target.item.currency, kind==='expense') || qDefaultAccount(target.board, target.item, target.item.currency, kind);
        preview = '<span class="qs-sg-ok">↵</span> <b>'+escapeHtml(target.item.name)+(target.sub ? ' › '+escapeHtml(target.sub.name) : '')+'</b> · '+
          (kind==='income' ? '+' : '−')+fmtMoney2(p.amount, target.item.currency)+
          (p.noBalance ? ' · <i>'+T('баланс не меняется')+'</i>' : (acc ? ' · '+T('счёт')+' «'+escapeHtml(acc.label || T('счёт'))+'»' : ''))+(p.dateWord ? ' · '+escapeHtml(p.dateWord) : '')+
          (tp.accountMiss ? '<br><span class="qs-sg-warn">!</span> '+T('Счёт')+' «'+escapeHtml(tp.accountMiss)+'» '+T('не найден — использован основной') : '')+
          (tp.accountSecondary && !p.noBalance ? '<br><span class="qs-sg-warn">!</span> «'+escapeHtml(tp.accountSecondary)+'» — '+T('второстепенный, для трат используется основной') : '');
      } else {
        var hb = !p.sign ? qFindHabit(p.words) : null;
        if(hb && hb.habit.kind==='count') preview = '<span class="qs-sg-ok">↵</span> '+T('Привычка')+' <b>'+escapeHtml(hb.habit.name)+'</b> · +'+Math.round(p.amount);
        else {
          var fb0 = finBoards()[0];
          if(fb0) qTakeAccount(tp, fb0, p.currency || (fb0.balances[0] ? fb0.balances[0].currency : DEFAULT_CURRENCY));
          preview = '<span class="qs-sg-warn">?</span> '+T('Категория')+' «'+escapeHtml((tp.rawWords.length ? tp.rawWords : p.rawWords).join(' '))+'» '+T('не найдена — после отправки предложу выбрать');
        }
      }
    } else if(p.words.length && p.amount===null){
      var hb2 = qFindHabit(p.words);
      if(hb2) preview = '<span class="qs-sg-ok">↵</span> '+T('Отметить привычку')+' <b>'+escapeHtml(hb2.habit.name)+'</b>';
      else if(!partial) preview = '<span class="qs-sg-warn">…</span> '+T('Добавьте сумму, например')+' «'+escapeHtml(p.rawWords.join(' '))+' 120»';
    } else if(p.amount>0 && !p.words.length){
      preview = p.sign>0
        ? '<span class="qs-sg-warn">…</span> '+T('Теперь выберите счёт — например,')+' «+'+p.amount+' '+T('карта')+'»'
        : '<span class="qs-sg-warn">…</span> '+T('Теперь напишите, на что — например,')+' «'+T('кофе')+' '+p.amount+'»';
    }
    if(preview) html += '<div class="qs-sg-preview">'+preview+'</div>';

    // 2) варианты для недописанного слова
    var rows = [], seen = {};
    function add(label, sub, insert, mode){
      var k = qNorm(insert);
      if(seen[k] || rows.length>=4) return;
      seen[k] = 1;
      rows.push(qRow(label, sub, insert, mode));
    }
    if(partial){
      var voc = qVocabulary();
      voc.filter(function(v){ var n = qNorm(v.name); return n.indexOf(partial)===0 && n!==partial; })
         .concat(voc.filter(function(v){ var n = qNorm(v.name); return n!==partial && partial.length>=3 && (n.indexOf(partial)>0 || qSimilar(partial, n.split(' ')[0])>=2); }))
         .forEach(function(v){ add(escapeHtml(v.name), escapeHtml(v.sub), qNorm(v.name), 'replace'); });
      if(p.amount!==null){
        finBoards().forEach(function(b){ b.balances.forEach(function(x){
          if(x.label && qNorm(x.label).indexOf(partial)===0 && qNorm(x.label)!==partial && (p.sign>0 || x.kind==='main')) add(escapeHtml(x.label), T('счёт'), qNorm(x.label), 'replace');
        }); });
        [T('вчера'), T('позавчера')].forEach(function(dw){ if(qNorm(dw).indexOf(partial)===0) add(escapeHtml(dw), T('дата'), dw, 'replace'); });
        if(qNorm(T('нмб')).indexOf(partial)===0 && qNorm(T('нмб'))!==partial) add(escapeHtml(T('нмб')), T('не менять баланс'), T('нмб'), 'replace');
      }
    } else if(p.sign>0 && p.amount>0 && !topHit && endsSpace){
      // «+500 » — предложить счета для пополнения
      finBoards().forEach(function(b){ b.balances.forEach(function(x){
        if(x.label) add(escapeHtml(x.label), T('пополнить')+' · '+fmtMoney2(x.amount, x.currency), qNorm(x.label), 'append');
      }); });
    } else if(p.amount>0 && p.words.length && endsSpace){
      // после суммы: предложить дату, «нмб» и счёт
      if(!p.noBalance && p.sign<=0) add(escapeHtml(T('нмб')), T('не менять баланс'), T('нмб'), 'append');
      if(!/вчера|вчора|yesterday|позавч|\d+[.\/]\d+/.test(qNorm(text))) add(escapeHtml(T('вчера')), T('дата'), T('вчера'), 'append');
      var shown = 0;
      var tw = qWords(text);
      var hasAcc = finBoards().some(function(b){ return b.balances.some(function(x){ return x.label && qWords(x.label).some(function(lw){ return tw.some(function(w){ return qSimilar(w, lw)>=2; }); }); }); });
      if(!hasAcc) finBoards().slice(0,1).forEach(function(b){ b.balances.forEach(function(x){
        if(x.label && shown<3 && (p.sign>0 || x.kind==='main')){ shown++; add(escapeHtml(x.label), T('счёт'), qNorm(x.label), 'append'); }
      }); });
    }
    if(rows.length) html += rows.join('');
    if(!html){ qHideSuggest(); return; }
    quick.suggest.innerHTML = html;
    quick.suggest.hidden = false;
  }

  // ---------- интерфейс чата ----------
  function qBot(html, actions, isChoice){ qMsg('bot', html, actions, isChoice); }
  function qMsg(from, html, actions, isChoice){
    if(!quick.log) return;
    var m = document.createElement('div');
    m.className = 'q-msg ' + from;
    var bubble = document.createElement('div');
    bubble.className = 'q-bubble';
    if(from==='me') bubble.textContent = html; else bubble.innerHTML = html;
    m.appendChild(bubble);
    if(actions && actions.length){
      var row = document.createElement('div');
      row.className = 'q-actions' + (isChoice ? ' choice' : '');
      actions.forEach(function(a){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'q-chip' + (a.primary ? ' primary' : '');
        b.textContent = a.label;
        b.addEventListener('click', function(){
          // кнопки срабатывают один раз
          row.querySelectorAll('button').forEach(function(x){ x.disabled = true; });
          b.classList.add('picked');
          a.fn();
        });
        row.appendChild(b);
      });
      m.appendChild(row);
    }
    quick.log.appendChild(m);
    while(quick.log.children.length > 60) quick.log.removeChild(quick.log.firstChild);
    requestAnimationFrame(function(){ quick.log.scrollTop = quick.log.scrollHeight; });
  }
  function qSend(){
    var v = quick.input.value.trim();
    if(!v) return;
    quick.input.value = '';
    qHideSuggest();
    qMsg('me', v);
    try{ qHandle(v); }catch(e){ qBot(T('Не получилось разобрать 😕 Попробуйте иначе или напишите «?»')); }
  }
  function qExamples(){
    return [T('кофе 85'), T('такси 200 вчера'), T('хлеб 30 карта'), '?'];
  }
  function ensureQuick(){
    if(quick.fab) return;
    var fab = document.createElement('button');
    fab.id = 'quick-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', T('Быстрый ввод'));
    fab.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3 0-1.3-.6V16A2.5 2.5 0 0 1 4 13.5z" fill="currentColor" opacity=".22"/><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3 0-1.3-.6V16A2.5 2.5 0 0 1 4 13.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 6.5v6M9 9.5h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    fab.addEventListener('click', function(){ openQuick(false); });
    document.body.appendChild(fab);

    var sheet = document.createElement('div');
    sheet.id = 'quick-sheet';
    sheet.innerHTML =
      '<div class="qs-backdrop"></div>'+
      '<div class="qs-panel" role="dialog" aria-label="'+T('Быстрый ввод')+'">'+
        '<div class="qs-grip"></div>'+
        '<div class="qs-head"><div><div class="qs-title">'+T('Быстрый ввод')+'</div><div class="qs-subtitle">'+T('Траты, доходы и привычки одной строкой')+'</div></div>'+
          '<div class="qs-head-btns">'+
            '<button type="button" class="close-x qs-clear" aria-label="'+T('Очистить историю')+'" title="'+T('Очистить историю')+'"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'+
            '<button type="button" class="close-x qs-close" aria-label="'+T('Закрыть')+'">✕</button>'+
          '</div></div>'+
        '<div class="qs-log"></div>'+
        '<div class="qs-examples">'+qExamples().map(function(x){ return '<button type="button" class="q-chip ex">'+escapeHtml(x)+'</button>'; }).join('')+'</div>'+
        '<div class="qs-suggest" hidden></div>'+
        '<form class="qs-form" autocomplete="off">'+
          '<input type="text" class="qs-input" enterkeyhint="send" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="'+T('Например: кофе 85')+'">'+
          '<button type="submit" class="qs-send" aria-label="'+T('Отправить')+'"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'+
        '</form>'+
      '</div>';
    document.body.appendChild(sheet);
    quick.fab = fab; quick.sheet = sheet;
    quick.log = sheet.querySelector('.qs-log');
    quick.input = sheet.querySelector('.qs-input');
    sheet.querySelector('.qs-backdrop').addEventListener('click', closeQuick);
    sheet.querySelector('.qs-close').addEventListener('click', closeQuick);
    sheet.querySelector('.qs-clear').addEventListener('click', qClear);
    var qPanel = sheet.querySelector('.qs-panel');
    attachSheetDrag(qPanel, function(){ sheet.classList.add('dragged'); closeQuick(); },
      {gripOnly: true, gripHeight: 76, setFade: function(f, dur){
        var bd = sheet.querySelector('.qs-backdrop');
        if(bd) bd.style.transition = dur ? 'background-color '+dur+'ms ease' : 'none';
        sheet.style.setProperty('--bd', f.toFixed(3));
      }});
    quick.suggest = sheet.querySelector('.qs-suggest');
    quick.input.addEventListener('input', qUpdateSuggest);
    quick.input.addEventListener('focus', qUpdateSuggest);
    quick.input.addEventListener('blur', function(){ setTimeout(function(){ if(document.activeElement!==quick.input) qHideSuggest(); }, 120); });
    // нажатие на подсказку не должно убирать клавиатуру
    quick.suggest.addEventListener('pointerdown', function(ev){ ev.preventDefault(); });
    quick.suggest.addEventListener('click', function(ev){
      var it = ev.target.closest('[data-insert]');
      if(!it) return;
      qApplySuggestion(it.getAttribute('data-insert'), it.getAttribute('data-mode'));
    });
    sheet.querySelector('.qs-form').addEventListener('submit', function(ev){ ev.preventDefault(); qSend(); quick.input.focus(); });
    sheet.querySelectorAll('.q-chip.ex').forEach(function(b){
      b.addEventListener('click', function(){
        if(b.textContent==='?'){ qMsg('me', '?'); qHelp(); return; }
        quick.input.value = b.textContent + ' ';
        quick.input.focus();
      });
    });
    // клавиатура на телефоне: панель поднимается над ней
    if(window.visualViewport){
      var fit = function(){
        if(!quick.open) return;
        var vv = window.visualViewport;
        var panel = sheet.querySelector('.qs-panel');
        var bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        panel.style.bottom = bottom + 'px';
        panel.style.maxHeight = Math.max(260, vv.height - 24) + 'px';
        quick.log.scrollTop = quick.log.scrollHeight;
      };
      window.visualViewport.addEventListener('resize', fit);
      window.visualViewport.addEventListener('scroll', fit);
    }
  }
  function openQuick(force){
    ensureQuick();
    if(quick.open) return;
    quick.open = true;
    quick.sheet.classList.toggle('force', !!force);
    quick.sheet.classList.remove('closing', 'dragged');
    var qp0 = quick.sheet.querySelector('.qs-panel');
    qp0.style.transform = ''; qp0.style.transition = '';
    qp0.classList.remove('sheet-dragging', 'sheet-dismiss');
    quick.sheet.style.removeProperty('--bd');
    quick.sheet.classList.add('open');
    document.documentElement.classList.add('quick-open');
    if(!quick.greeted) qGreet();
    setTimeout(function(){ quick.input.focus(); }, 320);
  }
  function closeQuick(){
    if(!quick.open) return;
    quick.open = false;
    quick.input.blur();
    quick.sheet.classList.add('closing');
    document.documentElement.classList.remove('quick-open');
    setTimeout(function(){
      if(!quick.open){
        quick.sheet.classList.remove('open','closing','dragged','force');
        quick.sheet.style.removeProperty('--bd');
        var qbd = quick.sheet.querySelector('.qs-backdrop'); if(qbd) qbd.style.transition = '';
        var qp = quick.sheet.querySelector('.qs-panel');
        qp.style.bottom = ''; qp.style.transform = ''; qp.style.transition = '';
        qp.classList.remove('sheet-dragging', 'sheet-dismiss');
      }
    }, 300);
  }

  // =====================================================================
  // ---------- ЕЖЕДНЕВНЫЙ ОГОНЁК (серия входов, как в Duolingo) ----------
  // =====================================================================
  var STREAK_KEY = 'lessoncal_streak';
  function loadStreak(){
    var d;
    try{ d = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}') || {}; }catch(e){ d = {}; }
    if(!Array.isArray(d.days)) d.days = [];
    d.days = d.days.filter(isValidDs).sort();
    d.best = Math.max(0, parseInt(d.best, 10) || 0);
    return d;
  }
  function saveStreak(d){ try{ localStorage.setItem(STREAK_KEY, JSON.stringify(d)); }catch(e){} }
  function streakHas(d, ds){ return d.days.indexOf(ds)!==-1; }
  // текущая серия: подряд до сегодня (или до вчера, если сегодня ещё не отмечено)
  function streakCount(d){
    var t = todayD();
    var cur = streakHas(d, fmt(t)) ? t : addDays(t, -1);
    var n = 0;
    while(streakHas(d, fmt(cur))){ n++; cur = addDays(cur, -1); }
    return n;
  }
  function streakLitToday(d){ return streakHas(d, fmt(todayD())); }
  function streakDaysWord(n){ return plural(n, T('день подряд'), T('дня подряд'), T('дней подряд')); }

  function flameSvg(cls){
    var id = 'fg' + Math.random().toString(36).slice(2, 7);
    var outer = 'M50 4C57 21 77 33 80 61C83 92 66 114 50 116C33 115 17 101 19 74C20 58 29 49 34 37C37 50 43 55 46 57C44 39 44 22 50 4Z';
    var inner = 'M50 54C56 66 66 73 66 89C66 104 58 112 50 112C41 112 34 104 35 91C36 81 42 77 44 69C46 75 48 77 50 79C49 71 48 63 50 54Z';
    return '<svg class="flame '+(cls||'')+'" viewBox="0 0 100 120" aria-hidden="true">'+
      '<defs>'+
        '<linearGradient id="'+id+'o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb340"/><stop offset=".55" stop-color="#ff7a1a"/><stop offset="1" stop-color="#ff3b30"/></linearGradient>'+
        '<linearGradient id="'+id+'i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7c2"/><stop offset="1" stop-color="#ffd60a"/></linearGradient>'+
      '</defs>'+
      '<g class="fl-off"><path d="'+outer+'"/><path class="fl-in" d="'+inner+'"/></g>'+
      '<g class="fl-on"><path d="'+outer+'" fill="url(#'+id+'o)"/><path d="'+inner+'" fill="url(#'+id+'i)"/></g>'+
    '</svg>';
  }
  function streakWeekHtml(d, big){
    var t = todayD(), todayStr = fmt(t), mon = parseD(weekKey(t));
    var out = '';
    for(var i=0;i<7;i++){
      var ds = fmt(addDays(mon, i));
      var cls = streakHas(d, ds) ? 'on' : (ds===todayStr ? 'today' : (ds<todayStr ? 'miss' : 'future'));
      out += '<span class="sw-day '+cls+'"'+(ds===todayStr?' data-today="1"':'')+'>'+
        (big ? '<span class="sw-lbl">'+DOW_LABELS[i]+'</span>' : '')+
        '<i>'+(big ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')+'</i></span>';
    }
    return '<div class="sw-row'+(big?' big':'')+'">'+out+'</div>';
  }
  // плашка внизу каждой доски
  function renderStreakBar(){
    var d = loadStreak(), n = streakCount(d), lit = streakLitToday(d);
    var text = lit
      ? '<b>'+n+'</b> '+streakDaysWord(n)
      : (n>0 ? T('Не потеряйте серию!')+' <b>'+n+'</b> '+streakDaysWord(n) : T('Зажгите огонёк на сегодня'));
    return '<button type="button" class="streak-bar'+(lit?' lit':' pending')+'" data-act="open-streak">'+
      '<span class="sb-flame">'+flameSvg(lit?'is-lit':'')+'</span>'+
      '<span class="sb-text"><span class="sb-main">'+text+'</span>'+
        '<span class="sb-sub">'+(lit ? T('Сегодня огонёк уже горит') : T('Нажмите и смахните вверх'))+'</span></span>'+
      streakWeekHtml(d, false)+
      '<span class="sb-chev">›</span>'+
    '</button>';
  }
  function renderStreakModal(){
    var d = loadStreak(), n = streakCount(d), lit = streakLitToday(d);
    var free = streakFree();
    var sparks = '';
    for(var i=0;i<14;i++){
      var a = Math.round(i*360/14 + (i%2 ? 9 : -6));
      sparks += '<i style="--a:'+a+'deg;--d:'+(70 + (i*37)%46)+'px;--s:'+(0.6 + (i%4)*0.18).toFixed(2)+';--dl:'+((i%5)*0.03).toFixed(2)+'s"></i>';
    }
    return '<div class="overlay"><div class="modal streak-modal" data-stop="1">'+
      '<button class="close-x" data-act="close-modal">✕</button>'+
      '<div class="st-stage'+(lit?' lit':'')+'" id="st-stage" style="--p:'+(lit?1:0)+'">'+
        '<div class="st-glow"></div>'+
        '<div class="st-sparks">'+sparks+'</div>'+
        flameSvg('st-flame')+
      '</div>'+
      '<div class="st-count" id="st-count"><span class="st-num cur">'+n+'</span></div>'+
      '<div class="st-label" id="st-label">'+streakDaysWord(n)+'</div>'+
      streakWeekHtml(d, true)+
      ((lit && !free)
        ? '<div class="st-done">'+T('Сегодня огонёк уже горит. Возвращайтесь завтра, чтобы продолжить серию!')+'</div>'
        : '<div class="st-swipe" id="st-swipe" data-nodrag="1">'+
            '<div class="st-track"><div class="st-trail"></div>'+
              '<button type="button" class="st-knob" id="st-knob" aria-label="'+T('Зажечь огонёк')+'">'+
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
              '</button></div>'+
            '<div class="st-hint">'+T('Смахните вверх, чтобы зажечь огонёк')+'</div>'+
          '</div>'+
          '<div class="st-done hidden" id="st-done">'+T('Отлично! Возвращайтесь завтра, чтобы продолжить серию.')+'</div>')+
      '<div class="st-stats">'+
        '<div><span>'+T('Рекорд')+'</span><b id="st-best">'+Math.max(d.best, n)+'</b></div>'+
        '<div><span>'+T('Всего дней')+'</span><b id="st-total">'+d.days.length+'</b></div>'+
      '</div>'+
    '</div></div>';
  }
  function igniteStreak(){
    var d = loadStreak();
    var free = streakFree();
    if(streakLitToday(d) && !free) return;
    var before = streakCount(d);
    if(!streakLitToday(d)) d.days.push(fmt(todayD()));
    else {
      // свободный режим: удлиняем серию на день назад
      var first = addDays(todayD(), -(before-1));
      while(streakHas(d, fmt(first))) first = addDays(first, -1);
      d.days.push(fmt(first));
      d.days.sort();
    }
    var after = streakCount(d);
    d.best = Math.max(d.best, after);
    saveStreak(d);
    var stage = document.getElementById('st-stage');
    if(stage){
      stage.style.setProperty('--p', '1');
      stage.classList.add('lit', 'igniting');
    }
    if(navigator.vibrate){ try{ navigator.vibrate([18, 40, 28]); }catch(e){} }
    // счётчик «прокручивается» на новое число
    var cnt = document.getElementById('st-count');
    if(cnt){
      cnt.innerHTML = '<span class="st-num old">'+before+'</span><span class="st-num new">'+after+'</span>';
      cnt.classList.add('roll');
    }
    var lbl = document.getElementById('st-label');
    if(lbl) lbl.textContent = (before===0 && d.days.length>1 ? T('Новая серия!')+' ' : '') + streakDaysWord(after);
    var day = document.querySelector('.streak-modal .sw-day[data-today]');
    if(day){ day.classList.remove('today'); day.classList.add('on', 'pop'); }
    var sw = document.getElementById('st-swipe');
    if(sw) sw.classList.add('gone');
    var done = document.getElementById('st-done');
    if(done) done.classList.remove('hidden');
    var best = document.getElementById('st-best'); if(best) best.textContent = d.best;
    var tot = document.getElementById('st-total'); if(tot) tot.textContent = d.days.length;
    if(free) setTimeout(function(){ if(state.modal==='streak') render(); }, 1800);
  }
  // жест «смахнуть вверх» на ручке
  function wireStreakSwipe(){
    var knob = document.getElementById('st-knob');
    var stage = document.getElementById('st-stage');
    if(!knob || !stage) return;
    var track = knob.parentElement, trail = track.querySelector('.st-trail');
    var startY = 0, dy = 0, active = false, maxUp = 1;
    var setP = function(p){
      stage.style.setProperty('--p', p.toFixed(3));
      knob.style.transform = 'translateY('+(-p*maxUp)+'px)';
      trail.style.height = (p*maxUp + 26)+'px';
    };
    knob.addEventListener('pointerdown', function(e){
      active = true; startY = e.clientY; dy = 0;
      maxUp = track.clientHeight - knob.offsetHeight - 8;
      knob.setPointerCapture && knob.setPointerCapture(e.pointerId);
      knob.style.transition = 'none'; trail.style.transition = 'none'; stage.style.transition = 'none';
      track.classList.add('active');
      e.preventDefault();
    });
    knob.addEventListener('pointermove', function(e){
      if(!active) return;
      dy = Math.max(0, startY - e.clientY);
      setP(Math.min(1, dy / maxUp));
    });
    var end = function(){
      if(!active) return;
      active = false;
      track.classList.remove('active');
      var p = Math.min(1, dy / maxUp);
      if(p >= 0.72){
        knob.style.transition = 'transform .25s cubic-bezier(.32,.72,0,1)';
        setP(1);
        igniteStreak();
      } else {
        knob.style.transition = 'transform .45s cubic-bezier(.32,.72,0,1)';
        trail.style.transition = 'height .45s cubic-bezier(.32,.72,0,1)';
        stage.style.transition = '--p .45s';
        setP(0);
        if(dy < 6){ track.classList.remove('nudge'); void track.offsetWidth; track.classList.add('nudge'); }
      }
    };
    knob.addEventListener('pointerup', end);
    knob.addEventListener('pointercancel', end);
    // с клавиатуры: Enter / пробел
    knob.addEventListener('keydown', function(e){
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); setP(1); igniteStreak(); }
    });
  }

  // =====================================================================
  // ---------- АДМИН-ПАНЕЛЬ (для тестирования; работает только на этом устройстве) ----------
  // Вход: 50 нажатий на версию в настройках → в быстром вводе «admin.give.50».
  // Это не защита (код открыт), а скрытое меню для разработчиков.
  // =====================================================================
  var ADMIN_KEY = 'lessoncal_admin', FAKE_KEY = 'lessoncal_fake_today', STREAK_FREE_KEY = 'lessoncal_streak_free';
  var APP_VERSION = '2.0';
  function isAdmin(){ try{ return localStorage.getItem(ADMIN_KEY)==='1'; }catch(e){ return false; } }
  function streakFree(){ try{ return isAdmin() && localStorage.getItem(STREAK_FREE_KEY)==='1'; }catch(e){ return false; } }
  var adminGate = {taps: 0, last: 0, armedAt: 0};
  function versionTap(el){
    var now = Date.now();
    if(now - adminGate.last > 2500) adminGate.taps = 0;
    adminGate.last = now;
    adminGate.taps++;
    if(el){ el.classList.remove('tap'); void el.offsetWidth; el.classList.add('tap'); }
    if(adminGate.taps >= 50){
      adminGate.taps = 0;
      adminGate.armedAt = now;
      if(navigator.vibrate){ try{ navigator.vibrate([10, 50, 10]); }catch(e){} }
      state.modal = null; render();
      openQuick(true);
    }
  }
  function adminTryCode(text){
    if(String(text||'').trim().toLowerCase()!=='admin.give.50') return false;
    if(!isAdmin() && !(adminGate.armedAt && Date.now()-adminGate.armedAt < 120000)) return false;
    try{ localStorage.setItem(ADMIN_KEY, '1'); }catch(e){}
    adminGate.armedAt = 0;
    qBot('🛠 <b>Админ-режим включён</b><div class="q-lines"><div>Панель доступна в настройках и по этой же команде.</div></div>',
      [{label: 'Открыть панель', primary: true, fn: function(){ closeQuick(); state.modal = 'admin'; state.menuOpen = false; render(); }}]);
    return true;
  }
  function setFakeToday(ds){
    FAKE_TODAY = (ds && isValidDs(ds)) ? ds : '';
    try{ if(FAKE_TODAY) localStorage.setItem(FAKE_KEY, FAKE_TODAY); else localStorage.removeItem(FAKE_KEY); }catch(e){}
    state.viewDate = startOfMonth(todayD());
    state.weekStart = null;
    state.scheduleDay = todayD().getDay();
    render();
  }
  function setStreakTo(n, includeToday, best){
    var d = loadStreak(), t = todayD();
    var end = includeToday ? t : addDays(t, -1);
    d.days = [];
    for(var i=n-1; i>=0; i--) d.days.push(fmt(addDays(end, -i)));
    d.best = Math.max(n, best||0);
    saveStreak(d);
  }

  // ---------- шаблоны тестовых досок ----------
  function tplRand(seed){ var x = seed; return function(){ x = (x*9301 + 49297) % 233280; return x/233280; }; }
  function tplDs(n){ return fmt(addDays(todayD(), n)); }
  function tplMonthDay(back, day){ var t = todayD(); var d = new Date(t.getFullYear(), t.getMonth()-back, 1); return fmt(new Date(d.getFullYear(), d.getMonth(), Math.min(day, daysInMonthOf(d.getFullYear(), d.getMonth())))); }
  function tplFinance(){
    var b = newBoard('🧪 Финансы', 'finance'); b.test = true;
    var t = todayD(), rnd = tplRand(7);
    var card = {id: uid(), label: 'Карта', amount: 25000, currency: 'UAH', kind: 'main', history: []};
    var usd = {id: uid(), label: 'Доллары', amount: 300, currency: 'USD', kind: 'main', history: []};
    var cash = {id: uid(), label: 'Наличные', amount: 1500, currency: 'UAH', kind: 'secondary', history: []};
    b.balances = [card, usd, cash];
    b.rates = {USD_UAH: 41.5, EUR_UAH: 45};
    var payDay = Math.min(t.getDate(), 28);
    var salary = {id: uid(), name: 'Зарплата', color: 'sage', amount: 40000, currency: 'UAH', scheduleType: 'monthly', dayOfMonth: payDay,
      history: [], confirmed: {}, postponed: {}, skipped: [], createdAt: fmt(t)};
    for(var k=1;k<=5;k++){ var od = tplMonthDay(k, payDay); salary.history.push({id: uid(), date: od, amount: 40000, balanceId: card.id, occ: od, noCard: true}); salary.confirmed[od] = salary.history[salary.history.length-1].id; }
    var freelance = {id: uid(), name: 'Фриланс', color: 'sky', amount: 0, currency: 'UAH', scheduleType: 'once', date: tplDs(5), dayOfMonth: 1,
      history: [{id: uid(), date: tplMonthDay(1, 14), amount: 6500}, {id: uid(), date: tplMonthDay(3, 9), amount: 4200}], confirmed: {}, postponed: {}, skipped: [], createdAt: fmt(t)};
    freelance.amount = 10700;
    b.income = [salary, freelance];
    function exp(name, color, budget, subs, perMonth, curDays){
      var e = {id: uid(), name: name, color: color, amount: 0, currency: 'UAH', budget: budget, subs: [], history: [], aliases: [], recurring: null};
      e.subs = subs.map(function(n){ return {id: uid(), name: n, amount: 0}; });
      for(var m=5; m>=0; m--){
        var cnt = m===0 ? curDays : 4;
        for(var j=0;j<cnt;j++){
          var day = m===0 ? Math.max(1, t.getDate() - j*2) : 3 + j*6;
          var date = m===0 ? fmt(addDays(t, -j*2)) : tplMonthDay(m, day);
          var a = Math.round(perMonth/4 * (0.6 + rnd()*0.8));
          var sb = e.subs.length ? e.subs[j % e.subs.length] : null;
          if(sb) sb.amount += a;
          e.history.push({id: uid(), date: date, amount: a, balanceId: card.id, balAmount: a, subId: sb ? sb.id : null, subName: sb ? sb.name : ''});
          e.amount += a;
        }
      }
      return e;
    }
    var shop = exp('Магазин', 'amber', 6000, ['Хлеб', 'Молоко', 'Овощи'], 6200, 5);
    var cafe = exp('Кафе', 'clay', 1500, [], 1900, 4);
    var taxi = exp('Такси', 'lilac', 0, [], 900, 2);
    var rent = {id: uid(), name: 'Аренда', color: 'rose', amount: 45000, currency: 'UAH', budget: 0, subs: [], history: [], aliases: [],
      recurring: {scheduleType: 'monthly', amount: 9000, dayOfMonth: t.getDate(), balanceId: card.id, confirmed: {}, postponed: {}, skipped: [], createdAt: fmt(t)}};
    for(var r=1;r<=5;r++) rent.history.push({id: uid(), date: tplMonthDay(r, t.getDate()), amount: 9000, balanceId: card.id, balAmount: 9000});
    var util = {id: uid(), name: 'Коммуналка', color: 'aqua', amount: 0, currency: 'UAH', budget: 0, subs: [], history: [], aliases: ['свет', 'газ'],
      recurring: {scheduleType: 'monthly', amount: 1800, dayOfMonth: addDays(t, 2).getDate(), balanceId: card.id, confirmed: {}, postponed: {}, skipped: [], createdAt: fmt(t)}};
    b.expenses = [shop, cafe, taxi, rent, util];
    return b;
  }
  function tplSubs(fin){
    var b = newBoard('🧪 Подписки', 'subs'); b.test = true;
    var link = fin ? {boardId: fin.id, expenseId: '', balanceId: fin.balances[0].id} : null;
    function sub(name, color, amount, cur, period, start, extra){
      var x = {id: uid(), name: name, color: color, amount: amount, currency: cur, period: period, startDate: start, active: true,
        paid: {}, skipped: [], history: [], createdAt: tplDs(-1), financeLink: link};
      for(var k in (extra||{})) x[k] = extra[k];
      return x;
    }
    var gpt = sub('ChatGPT', 'sage', 20, 'USD', 'month', tplDs(-10));
    var paidOcc = tplDs(-10);
    gpt.createdAt = tplDs(-40);
    gpt.history.push({id: uid(), orig: paidOcc, date: paidOcc, amount: 20, finance: null});
    gpt.paid[paidOcc] = gpt.history[0].id;
    b.subs = [
      sub('Netflix', 'rose', 299, 'UAH', 'month', tplDs(0)),
      sub('Spotify', 'sage', 199, 'UAH', 'month', tplDs(2)),
      gpt,
      sub('iCloud', 'sky', 99, 'UAH', 'year', tplDs(-200)),
      sub('Duolingo', 'olive', 7, 'USD', 'month', tplDs(-5), {active: false})
    ];
    return b;
  }
  function tplHabits(){
    var b = newBoard('🧪 Привычки', 'habits'); b.test = true;
    var t = todayD(), rnd = tplRand(3);
    function hb(name, color, kind, target, unit, days){ return {id: uid(), name: name, color: color, kind: kind, target: target, unit: unit, days: days || DOW_VALUES.slice(), log: {}, createdAt: tplDs(-30)}; }
    var water = hb('Вода', 'aqua', 'count', 8, 'стаканов');
    var sport = hb('Спорт', 'clay', 'check', 1, '', [1, 3, 5]);
    var read = hb('Чтение', 'lilac', 'count', 20, 'мин');
    for(var i=1;i<=30;i++){
      var ds = fmt(addDays(t, -i)), dow = addDays(t, -i).getDay();
      if(i<=12 || rnd()>0.35) water.log[ds] = i===5 ? 5 : 8;
      if(sport.days.indexOf(dow)!==-1 && (i<=14 || rnd()>0.4)) sport.log[ds] = 1;
      if(rnd()>0.3) read.log[ds] = Math.round(10 + rnd()*15);
    }
    water.log[fmt(t)] = 3;
    b.habits = [water, sport, read];
    return b;
  }
  function tplLessons(){
    var b = newBoard('🧪 Занятия', 'lessons'); b.test = true;
    var en = {id: uid(), name: 'Английский', color: 'sky', days: [1, 3, 5], startDate: tplDs(-60), planType: 'dynamic', total: 0, paidUntil: '', timeStart: '16:00', timeEnd: '17:00', cancelled: [], rescheduled: {}, payments: []};
    var swim = {id: uid(), name: 'Плавание', color: 'sage', days: [2, 4], startDate: tplDs(-40), planType: 'static', total: 0, paidUntil: tplDs(2), timeStart: '08:00', timeEnd: '09:00', cancelled: [], rescheduled: {}, payments: []};
    var guitar = {id: uid(), name: 'Гитара', color: 'clay', days: [6], startDate: tplDs(-20), planType: 'dynamic', total: 16, paidUntil: '', timeStart: '12:00', timeEnd: '13:00', cancelled: [], rescheduled: {}, payments: [{id: uid(), date: tplDs(-20), amount: 3200, currency: 'UAH', lessons: 16, until: '', prevUntil: '', finance: null}]};
    b.subjects = [en, swim, guitar];
    normalizeBoard(b);
    en.total = Math.max(1, en.total - remaining(en) + 1); // остался ровно 1 урок — сработает напоминание
    return b;
  }
  function tplPlanner(){
    var b = newBoard('🧪 Задачи', 'planner'); b.test = true;
    var t = todayD(), dow = t.getDay();
    function task(name, color, notes, times){ return {id: uid(), name: name, color: color, notes: notes, times: times}; }
    function tm(day, s, e, extra){ var x = {id: uid(), day: day, date: '', timeStart: s, timeEnd: e, doneWeeks: []}; for(var k in (extra||{})) x[k] = extra[k]; return x; }
    var wk = weekKey(t);
    b.scheduleItems = [
      task('Купить продукты', 'aqua', 'Молоко, хлеб, сыр', [tm(dow, '10:00', '11:00'), tm((dow+3)%7, '18:00', '19:00')]),
      task('Тренировка', 'clay', '', [tm(1, '07:00', '08:00', {doneWeeks: [wk]}), tm(3, '07:00', '08:00'), tm(5, '07:00', '08:00')]),
      task('Позвонить маме', 'rose', '', [tm(addDays(t,1).getDay(), '', '', {date: tplDs(1)})]),
      task('Очень длинное название задачи для проверки многоточия в неделе', 'lilac', 'Длинное описание, чтобы проверить кнопку «…»', [tm(dow, '14:00', '15:00')])
    ];
    return b;
  }
  function addTemplate(kind){
    var made = [];
    var fin = null;
    if(kind==='finance' || kind==='all'){ fin = tplFinance(); made.push(fin); }
    if(kind==='subs' || kind==='all'){
      if(!fin) fin = state.boards.find(function(x){ return x.type==='finance' && x.test; }) || null;
      made.push(tplSubs(fin));
    }
    if(kind==='habits' || kind==='all') made.push(tplHabits());
    if(kind==='lessons' || kind==='all') made.push(tplLessons());
    if(kind==='planner' || kind==='all') made.push(tplPlanner());
    made.forEach(function(b){ normalizeBoard(b); state.boards.push(b); });
    state.activeBoardId = made[0].id;
    state.modal = null;
    pendingAnim = 'enter';
    showToast('Создано тестовых досок: '+made.length);
    saveData();
  }
  function removeTestBoards(){
    var n = state.boards.filter(function(b){ return b.test; }).length;
    if(!n){ showToast('Тестовых досок нет'); return; }
    withUndo('Удалено тестовых досок: '+n, function(){
      state.boards = state.boards.filter(function(b){ return !b.test; });
      if(!state.boards.length) state.boards.push(newBoard(T('Мой календарь'), 'lessons'));
      if(!state.boards.some(function(b){ return b.id===state.activeBoardId; })) state.activeBoardId = state.boards[0].id;
      saveData();
    });
  }

  function renderAdminModal(){
    var d = loadStreak(), n = streakCount(d), lit = streakLitToday(d);
    var realToday = (function(){ var x = new Date(); return fmt(new Date(x.getFullYear(), x.getMonth(), x.getDate())); })();
    var testCount = state.boards.filter(function(b){ return b.test; }).length;
    var tplBtn = function(k, label){ return '<button type="button" class="btn small" data-act="admin-tpl" data-kind="'+k+'">'+label+'</button>'; };
    return '<div class="overlay"><div class="modal narrow admin-modal" data-stop="1">'+
      '<button class="close-x" data-act="close-modal">✕</button>'+
      '<h3 class="display">🛠 Админ-панель</h3>'+
      '<div class="sub">Инструменты для тестирования. Действуют только на этом устройстве.</div>'+

      '<div class="adm-sec"><div class="adm-title">Тестовая дата</div>'+
        '<div class="adm-note">'+(FAKE_TODAY ? 'Сейчас приложение думает, что сегодня <b>'+fmtHuman(FAKE_TODAY)+'</b>.' : 'Используется настоящая дата.')+'</div>'+
        '<div class="adm-row">'+
          '<input type="date" id="adm-date" value="'+(FAKE_TODAY || realToday)+'">'+
          '<button type="button" class="btn small primary" data-act="admin-date-set">Применить</button>'+
        '</div>'+
        '<div class="adm-row">'+
          '<button type="button" class="btn small" data-act="admin-date-shift" data-days="-1">−1 день</button>'+
          '<button type="button" class="btn small" data-act="admin-date-shift" data-days="1">+1 день</button>'+
          '<button type="button" class="btn small" data-act="admin-date-shift" data-days="7">+1 неделя</button>'+
          '<button type="button" class="btn small" data-act="admin-date-shift" data-days="30">+30 дней</button>'+
          (FAKE_TODAY ? '<button type="button" class="btn small danger" data-act="admin-date-reset">Сбросить</button>' : '')+
        '</div>'+
      '</div>'+

      '<div class="adm-sec"><div class="adm-title">Огонёк</div>'+
        '<div class="adm-note">Серия: <b>'+n+'</b> · рекорд: <b>'+Math.max(d.best, n)+'</b> · всего дней: <b>'+d.days.length+'</b> · сегодня '+(lit ? 'зажжён' : 'не зажжён')+'</div>'+
        '<div class="adm-row">'+
          '<input type="number" id="adm-streak" min="0" max="3650" value="'+n+'" style="width:96px;">'+
          '<label class="adm-check"><input type="checkbox" id="adm-streak-today"'+(lit?' checked':'')+'> включая сегодня</label>'+
          '<button type="button" class="btn small primary" data-act="admin-streak-set">Выставить</button>'+
        '</div>'+
        '<div class="adm-row">'+
          '<button type="button" class="btn small danger" data-act="admin-streak-reset">Сбросить огонёк</button>'+
        '</div>'+
        '<label class="switch-label" style="margin-top:8px !important;"><span>Свободный режим — зажигать сколько угодно раз</span><input type="checkbox" class="switch" id="adm-streak-free"'+(streakFree()?' checked':'')+'></label>'+
      '</div>'+

      '<div class="adm-sec"><div class="adm-title">Шаблоны для тестов</div>'+
        '<div class="adm-note">Создают готовые доски с данными на сегодняшнюю (или тестовую) дату: выплаты и платежи, которые ждут подтверждения, бюджеты, график за 6 месяцев, подписки, связанные с финансами, серии привычек.</div>'+
        '<div class="adm-row wrap">'+
          tplBtn('all', '✨ Всё сразу')+tplBtn('finance', 'Финансы')+tplBtn('subs', 'Подписки')+
          tplBtn('habits', 'Привычки')+tplBtn('lessons', 'Занятия')+tplBtn('planner', 'Задачи')+
        '</div>'+
        (testCount ? '<div class="adm-row"><button type="button" class="btn small danger" data-act="admin-tpl-remove">Удалить тестовые доски ('+testCount+')</button></div>' : '')+
      '</div>'+

      '<div class="adm-sec"><button type="button" class="btn danger" style="width:100%;" data-act="admin-exit">Выйти из админ-режима</button>'+
        '<div class="adm-note" style="margin-top:6px;">Тестовая дата и свободный режим огонька тоже выключатся.</div></div>'+
    '</div></div>';
  }

  // =====================================================================
  // ---------- ПЕРВЫЙ ЗАПУСК ----------
  // =====================================================================
  var ONB_KEY = 'lessoncal_onboarded';
  function markOnboarded(){ try{ localStorage.setItem(ONB_KEY, '1'); }catch(e){} }
  function isOnboarded(){ try{ return localStorage.getItem(ONB_KEY)==='1'; }catch(e){ return true; } }
  var ONB_TYPES = [
    {t: 'lessons',  ico: '📚', c: '#0a84ff', d: 'Курсы и уроки: сколько осталось оплаченных и когда продлевать'},
    {t: 'finance',  ico: '💳', c: '#30d158', d: 'Доходы, расходы, балансы и бюджеты'},
    {t: 'habits',   ico: '🔥', c: '#ff9f0a', d: 'Отмечайте каждый день и держите серию'},
    {t: 'subs',     ico: '🔁', c: '#ff375f', d: 'Netflix, Spotify и другие — напомнит о списании'},
    {t: 'planner',  ico: '✅', c: '#64d2ff', d: 'Задачи по дням недели с отметками «выполнено»'},
    {t: 'events',   ico: '🎉', c: '#bf5af2', d: 'Дни рождения и важные даты'},
    {t: 'schedule', ico: '🗓', c: '#5e5ce6', d: 'Расписание уроков или пар по дням недели'}
  ];
  function onbSteps(){
    var s = ['welcome', 'types'];
    if(state.onb.types.indexOf('finance')!==-1) s.push('account');
    s.push('tips');
    return s;
  }
  function startOnboarding(){
    state.onb = {i: 0, types: [], acc: {label: T('Карта'), amount: '', currency: DEFAULT_CURRENCY}, back: false};
    state.modal = 'onboarding'; state.menuOpen = false;
    render();
  }
  function renderOnboarding(){
    var o = state.onb;
    if(!o) return '';
    var steps = onbSteps();
    if(o.i >= steps.length) o.i = steps.length - 1;
    var step = steps[o.i];
    var dots = steps.map(function(_, k){ return '<i class="'+(k===o.i?'on':(k<o.i?'done':''))+'"></i>'; }).join('');
    var body = '', actions = '';
    if(step==='welcome'){
      body = '<div class="onb-hero">'+
          '<div class="onb-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="10" width="52" height="46" rx="12" fill="#fff"/><rect x="6" y="10" width="52" height="15" rx="12" fill="#ff453a"/><rect x="6" y="18" width="52" height="7" fill="#ff453a"/><text x="32" y="48" text-anchor="middle" font-size="22" font-weight="700" fill="#1d1d1f" font-family="-apple-system,Inter,sans-serif">'+todayD().getDate()+'</text></svg></div>'+
          '<h2>'+T('Добро пожаловать!')+'</h2>'+
          '<p>'+T('Занятия, деньги, привычки и задачи — в одном календаре. Всё хранится только на вашем устройстве.')+'</p>'+
        '</div>'+
        '<div class="onb-lang">'+[['ru','Русский'],['uk','Українська'],['en','English']].map(function(l){
          return '<button type="button" class="onb-chip'+(LANG===l[0]?' on':'')+'" data-act="onb-lang" data-lang="'+l[0]+'">'+l[1]+'</button>';
        }).join('')+'</div>';
      actions = '<button type="button" class="btn primary onb-main" data-act="onb-next">'+T('Начать')+'</button>';
    } else if(step==='types'){
      body = '<h2>'+T('Что вы хотите вести?')+'</h2><p>'+T('Выберите одно или несколько — для каждого появится своя доска. Добавить другие можно потом в меню ☰.')+'</p>'+
        '<div class="onb-types">'+ONB_TYPES.map(function(x){
          var on = o.types.indexOf(x.t)!==-1;
          return '<button type="button" class="onb-type'+(on?' on':'')+'" data-act="onb-type" data-type="'+x.t+'" aria-pressed="'+on+'">'+
            '<span class="onb-ti" style="background:'+x.c+'">'+x.ico+'</span>'+
            '<span class="onb-tt"><b>'+BOARD_TYPE_LABELS[x.t]+'</b><span>'+T(x.d)+'</span></span>'+
            '<span class="onb-tick"></span></button>';
        }).join('')+'</div>';
      actions = '<button type="button" class="btn onb-back" data-act="onb-back">'+T('Назад')+'</button>'+
        '<button type="button" class="btn primary onb-main" data-act="onb-next" id="onb-types-next"'+(o.types.length?'':' disabled')+'>'+T('Продолжить')+'</button>';
    } else if(step==='account'){
      body = '<h2>'+T('Ваш основной счёт')+'</h2><p>'+T('Чтобы траты и доходы сразу меняли баланс. Можно пропустить и добавить позже.')+'</p>'+
        '<div class="field"><label>'+T('Название')+'</label><input type="text" id="onb-acc-label" value="'+escapeHtml(o.acc.label)+'"></div>'+
        '<div class="field-row">'+
          '<div class="field" style="flex:2;"><label>'+T('Сколько сейчас')+'</label><input type="number" id="onb-acc-amount" min="0" step="0.01" inputmode="decimal" placeholder="0" value="'+escapeHtml(o.acc.amount)+'"></div>'+
          '<div class="field" style="flex:1;"><label>'+T('Валюта')+'</label><select id="onb-acc-cur">'+currencyOptionsHtml(o.acc.currency)+'</select></div>'+
        '</div>';
      actions = '<button type="button" class="btn onb-back" data-act="onb-back">'+T('Назад')+'</button>'+
        '<button type="button" class="btn onb-skip-acc" data-act="onb-skip-acc">'+T('Пропустить')+'</button>'+
        '<button type="button" class="btn primary onb-main" data-act="onb-next">'+T('Продолжить')+'</button>';
    } else {
      var tips = [
        ['☰', T('Доски'), T('Переключайтесь между досками и создавайте новые в меню слева сверху.')],
        ['📅', T('Нажмите на день'), T('Откроются все записи и действия на этот день.')],
        ['💬', T('Быстрый ввод'), T('На телефоне кнопка справа внизу: напишите «кофе 85» — и трата записана.')],
        ['🔥', T('Огонёк'), T('Заходите каждый день и зажигайте огонёк внизу экрана — держите серию.')]
      ];
      body = '<h2>'+T('Всё готово!')+'</h2><p>'+T('Пара подсказок, чтобы быстрее освоиться:')+'</p>'+
        '<div class="onb-tips">'+tips.map(function(t, k){
          return '<div class="onb-tip" style="animation-delay:'+(0.08*k+0.1).toFixed(2)+'s"><span class="onb-tip-i">'+t[0]+'</span><div><b>'+t[1]+'</b><span>'+t[2]+'</span></div></div>';
        }).join('')+'</div>';
      actions = '<button type="button" class="btn onb-back" data-act="onb-back">'+T('Назад')+'</button>'+
        '<button type="button" class="btn primary onb-main" data-act="onb-finish">'+T('Поехали')+'</button>';
    }
    return '<div class="overlay onb-overlay"><div class="modal onb-modal" data-stop="1">'+
      '<button class="close-x" data-act="close-modal" aria-label="'+T('Пропустить')+'">✕</button>'+
      '<div class="onb-dots">'+dots+'</div>'+
      '<div class="onb-step'+(o.back?' back':'')+'" data-step="'+step+'">'+body+'</div>'+
      '<div class="onb-actions">'+actions+'</div>'+
    '</div></div>';
  }
  function onbReadAccount(){
    var o = state.onb;
    var l = document.getElementById('onb-acc-label'), a = document.getElementById('onb-acc-amount'), c = document.getElementById('onb-acc-cur');
    if(l) o.acc.label = l.value; if(a) o.acc.amount = a.value; if(c) o.acc.currency = c.value;
  }
  function boardIsEmpty(b){
    return !(b.subjects.length || b.events.length || b.income.length || b.expenses.length || b.balances.length || b.scheduleItems.length || b.subs.length || b.habits.length);
  }
  function finishOnboarding(){
    var o = state.onb;
    onbReadAccount();
    var order = ONB_TYPES.map(function(x){ return x.t; }).filter(function(t){ return o.types.indexOf(t)!==-1; });
    // пустую доску «Мой календарь», созданную по умолчанию, заменяем выбранными
    if(state.boards.length===1 && boardIsEmpty(state.boards[0]) && order.length) state.boards = [];
    var made = order.map(function(t){
      var b = newBoard(BOARD_TYPE_LABELS[t], t);
      if(t==='finance' && o.acc.useAccount !== false){
        var amt = parseFloat(o.acc.amount);
        b.balances.push({id: uid(), label: (o.acc.label||'').trim() || T('Карта'), amount: isFinite(amt) ? r2(Math.max(0, amt)) : 0, currency: o.acc.currency || DEFAULT_CURRENCY, kind: 'main', history: []});
      }
      normalizeBoard(b);
      state.boards.push(b);
      return b;
    });
    if(!state.boards.length) state.boards.push(newBoard(T('Мой календарь'), 'lessons'));
    state.activeBoardId = made.length ? made[0].id : state.boards[0].id;
    markOnboarded();
    state.onb = null; state.modal = null;
    pendingAnim = 'enter';
    saveData();
  }

  // ---------- event mutations ----------
  function addEvent(data){
    var b = activeBoard();
    b.events.push({id: uid(), name: data.name, color: data.color, date: data.date, yearly: !!data.yearly});
    saveData();
  }
  function deleteEvent(id){
    var b = activeBoard();
    b.events = b.events.filter(function(e){ return e.id!==id; });
    saveData();
  }
  function updateEvent(id, data){
    var b = activeBoard();
    var e = b.events.find(function(x){ return x.id===id; });
    if(!e) return;
    e.name = data.name; e.color = data.color; e.date = data.date; e.yearly = !!data.yearly;
    saveData();
  }

  // ---------- finance mutations ----------
  function addIncome(data){
    var b = activeBoard();
    var todayStr = fmt(todayD());
    b.income.push({
      id: uid(), name: data.name, color: data.color, amount: data.amount, currency: data.currency,
      scheduleType: data.scheduleType, date: data.date || '', dayOfMonth: data.dayOfMonth || 1,
      history: [], confirmed: {}, postponed: {}, skipped: [],
      // разовый доход «задним числом» тоже можно подтвердить
      createdAt: (data.scheduleType!=='monthly' && data.date && data.date<todayStr) ? data.date : todayStr
    });
    saveData();
  }
  function updateIncome(id, data){
    var b = activeBoard();
    var x = b.income.find(function(v){ return v.id===id; });
    if(!x) return;
    x.name = data.name; x.color = data.color; x.amount = data.amount; x.currency = data.currency;
    x.scheduleType = data.scheduleType; x.date = data.date || ''; x.dayOfMonth = data.dayOfMonth || 1;
    saveData();
  }
  function deleteIncome(id){
    var b = activeBoard();
    b.income = b.income.filter(function(x){ return x.id!==id; });
    saveData();
  }
  function addExpense(data){
    var b = activeBoard();
    var hist = [];
    // сумма, указанная при создании, считается тратой сегодняшнего дня (баланс не меняется)
    if(data.amount>0) hist.push({id: uid(), date: fmt(todayD()), amount: data.amount, balanceId: null, subId: null, subName: '', note: T('начальная сумма')});
    b.expenses.push({id: uid(), name: data.name, color: data.color, amount: data.amount, currency: data.currency, budget: data.budget || 0, subs: buildSubs(data.subs, []), history: hist, aliases: [], recurring: makeRecurring(data.recurring, null)});
    saveData();
  }
  function updateExpense(id, data){
    var b = activeBoard();
    var x = b.expenses.find(function(v){ return v.id===id; });
    if(!x) return;
    x.name = data.name; x.color = data.color; x.amount = data.amount; x.currency = data.currency;
    x.budget = data.budget || 0;
    x.subs = buildSubs(data.subs, x.subs);
    x.recurring = makeRecurring(data.recurring, x.recurring);
    saveData();
  }
  // настройки регулярного платежа (отметки об оплатах сохраняются при редактировании)
  function makeRecurring(r, old){
    if(!r) return null;
    var todayStr = fmt(todayD());
    return {
      scheduleType: 'monthly', amount: r.amount, dayOfMonth: r.dayOfMonth,
      balanceId: old ? old.balanceId : '',
      confirmed: old ? old.confirmed : {}, postponed: old ? old.postponed : {}, skipped: old ? old.skipped : [],
      createdAt: (old && old.dayOfMonth===r.dayOfMonth) ? old.createdAt : todayStr
    };
  }
  function deleteExpense(id){
    var b = activeBoard();
    b.expenses = b.expenses.filter(function(x){ return x.id!==id; });
    saveData();
  }

  // ---------- подкатегории расхода (разбивка суммы карточки) ----------
  function buildSubs(list, existing){
    var old = {};
    (existing||[]).forEach(function(s){ old[s.id] = true; });
    return (list||[]).map(function(s){
      return {id: (s.id && old[s.id]) ? s.id : uid(), name: s.name, amount: s.amount};
    });
  }
  // подпись подкатегории для истории: «Магазин → Хлеб»
  function histSub(item, h){
    if(h && h.note) return ' · ' + h.note;
    if(!h || !h.subId) return '';
    var s = (item.subs||[]).find(function(v){ return v.id===h.subId; });
    var nm = s ? s.name : (h.subName || '');
    return nm ? ' → ' + nm : '';
  }

  // ---------- подтверждение удаления карточек ----------
  function askDelete(kind, id){
    var labels = {subject:T('Курс удалён'), event:T('Событие удалено'), income:T('Доход удалён'), expense:T('Расход удалён'), schedule: activeBoard().type==='planner' ? T('Задача удалена') : T('Урок удалён')};
    labels.sub = T('Подписка удалена'); labels.habit = T('Привычка удалена');
    withUndo(labels[kind] || T('Удалено'), function(){ performCardDelete({kind: kind, id: id}); });
  }

  function performCardDelete(c){
    if(c.kind==='subject') deleteSubject(c.id);
    else if(c.kind==='event') deleteEvent(c.id);
    else if(c.kind==='income') deleteIncome(c.id);
    else if(c.kind==='expense') deleteExpense(c.id);
    else if(c.kind==='schedule') deleteScheduleItem(c.id);
    else if(c.kind==='sub'){ var b1 = activeBoard(); b1.subs = b1.subs.filter(function(x){ return x.id!==c.id; }); saveData(); }
    else if(c.kind==='habit'){ var b2 = activeBoard(); b2.habits = b2.habits.filter(function(x){ return x.id!==c.id; }); saveData(); }
  }

  // ---------- schedule mutations ----------
  function addScheduleItem(data){
    var b = activeBoard();
    b.scheduleItems.push({id: uid(), name: data.name, color: data.color, notes: data.notes || '', times: []});
    saveData();
  }
  function updateScheduleItem(id, data){
    var b = activeBoard();
    var x = b.scheduleItems.find(function(v){ return v.id===id; });
    if(!x) return;
    x.name = data.name; x.color = data.color; x.notes = data.notes || '';
    saveData();
  }
  function deleteScheduleItem(id){
    var b = activeBoard();
    b.scheduleItems = b.scheduleItems.filter(function(x){ return x.id!==id; });
    saveData();
  }
  function addScheduleTime(itemId, data){
    var b = activeBoard();
    var x = b.scheduleItems.find(function(v){ return v.id===itemId; });
    if(!x) return;
    x.times.push({id: uid(), day: data.day, date: data.date || '', timeStart: data.timeStart || '', timeEnd: data.timeEnd || '', doneWeeks: []});
    saveData();
  }
  function updateScheduleTime(itemId, timeId, data){
    var b = activeBoard();
    var x = b.scheduleItems.find(function(v){ return v.id===itemId; });
    if(!x) return;
    var t = x.times.find(function(v){ return v.id===timeId; });
    if(!t) return;
    if((t.date||'')!==(data.date||'')) t.doneWeeks = [];
    t.day = data.day; t.date = data.date || ''; t.timeStart = data.timeStart || ''; t.timeEnd = data.timeEnd || '';
    saveData();
  }
  function timeOnDate(t, ds){ return t.date ? t.date===ds : t.day===parseD(ds).getDay(); }
  function isDoneOn(t, ds){ return (t.doneWeeks||[]).indexOf(weekKey(parseD(ds)))!==-1; }
  function findBoard(id){ return state.boards.find(function(x){ return x.id===id; }) || activeBoard(); }
  // дата, к которой относится отметка в боковой панели: для разовой — её дата, для еженедельной — этот день текущей недели
  function sidebarDateFor(t){ return t.date || fmt(dateOfWeekday(t.day)); }
  function timeLabel(t){
    return (t.date ? fmtHumanNoYear(t.date) : DOW_LABELS[DOW_VALUES.indexOf(t.day)]) + (timeRangeStr(t) ? ' · '+timeRangeStr(t) : '');
  }
  function toggleTaskDone(itemId, timeId, ds, boardId){
    var b = boardId ? findBoard(boardId) : activeBoard();
    var x = b.scheduleItems.find(function(v){ return v.id===itemId; });
    if(!x) return;
    var t = x.times.find(function(v){ return v.id===timeId; });
    if(!t) return;
    var wk = weekKey(parseD(isValidDs(ds) ? ds : sidebarDateFor(t)));
    var i = t.doneWeeks.indexOf(wk);
    if(i===-1) t.doneWeeks.push(wk); else t.doneWeeks.splice(i,1);
    t.doneWeeks.sort();
    if(t.doneWeeks.length>30) t.doneWeeks = t.doneWeeks.slice(-30);
    saveData();
  }

  function deleteScheduleTime(itemId, timeId){
    var b = activeBoard();
    var x = b.scheduleItems.find(function(v){ return v.id===itemId; });
    if(!x) return;
    x.times = x.times.filter(function(v){ return v.id!==timeId; });
    saveData();
  }

  // ---------- balance mutations ----------
  // сумма в валюте счёта (null — нет курса)
  function convertForBalance(b, amount, currency, bal){
    var rate = getRate(b, currency, bal.currency);
    return rate===null ? null : r2(amount*rate);
  }
  // курс понятным образом: «1 USD = 41.5 UAH», а не «1 UAH = 0.024 USD»
  function rateText(from, to, r){
    return r>=1 ? '1 '+from+' = '+fmtRate(r)+' '+to : '1 '+to+' = '+fmtRate(1/r)+' '+from;
  }
  function balLabel(x){ return (x.label ? x.label+' · ' : '') + fmtMoney(x.amount, x.currency); }
  // список счетов: сначала в валюте операции, ниже — в другой валюте по курсу
  function balanceOptionsHtml(b, currency, selectedId, noneLabel){
    var same = b.balances.filter(function(x){ return x.currency===currency; });
    var other = b.balances.filter(function(x){ return x.currency!==currency; });
    var usable = function(x){ return getRate(b, currency, x.currency)!==null; };
    var sel = selectedId!==undefined && selectedId!==null && (selectedId==='' || b.balances.some(function(x){ return x.id===selectedId && usable(x); }))
      ? selectedId : (same[0] ? same[0].id : ((other.filter(usable)[0] || {}).id || ''));
    var opt = function(x){
      var ok = usable(x);
      var extra = x.currency===currency ? '' : (ok ? ' · '+rateText(currency, x.currency, getRate(b, currency, x.currency)) : ' · '+T('нужен курс'));
      return '<option value="'+x.id+'"'+(x.id===sel?' selected':'')+(ok?'':' disabled')+'>'+escapeHtml(balLabel(x)+extra)+'</option>';
    };
    return same.map(opt).join('')+
      (other.length ? '<optgroup label="'+escapeHtml(T('Другая валюта — по курсу'))+'">'+other.map(opt).join('')+'</optgroup>' : '')+
      '<option value=""'+(sel===''?' selected':'')+'>'+escapeHtml(noneLabel || T('Не изменять баланс'))+'</option>';
  }
  function findBalanceAny(id){
    for(var i=0;i<state.boards.length;i++){
      var x = (state.boards[i].balances||[]).find(function(v){ return v.id===id; });
      if(x) return {board: state.boards[i], bal: x};
    }
    return null;
  }
  // пополнение счёта (не доход — просто деньги на счёт)
  function topUpBalance(b, balId, amount, date, note){
    var x = b.balances.find(function(v){ return v.id===balId; });
    if(!x || !(amount>0)) return null;
    x.amount = r2(x.amount + amount);
    var hid = uid();
    x.history.push({id: hid, kind: 'topup', date: date || fmt(todayD()), amount: r2(amount), note: note || ''});
    saveData();
    return hid;
  }
  // перевод между счетами (например, снял наличные с карты)
  function transferBalance(b, fromId, toId, amount, date){
    var from = b.balances.find(function(v){ return v.id===fromId; });
    var to = b.balances.find(function(v){ return v.id===toId; });
    if(!from || !to || from===to || !(amount>0)) return null;
    var got = convertForBalance(b, amount, from.currency, to);
    if(got===null) return null;
    var pair = uid();
    from.amount = r2(from.amount - amount);
    to.amount = r2(to.amount + got);
    from.history.push({id: uid(), kind: 'out', pair: pair, other: to.id, date: date, amount: r2(amount)});
    to.history.push({id: uid(), kind: 'in', pair: pair, other: from.id, date: date, amount: got});
    saveData();
    return pair;
  }
  function deleteBalanceEntry(b, balId, hid){
    var x = b.balances.find(function(v){ return v.id===balId; });
    if(!x) return;
    var h = x.history.find(function(v){ return v.id===hid; });
    if(!h) return;
    var undo = function(bal, e){
      bal.amount = r2(bal.amount + (e.kind==='out' ? e.amount : -e.amount));
      bal.history = bal.history.filter(function(v){ return v!==e; });
    };
    undo(x, h);
    if(h.pair){
      b.balances.forEach(function(o){
        var e = o.history.find(function(v){ return v.pair===h.pair; });
        if(e) undo(o, e);
      });
    }
    saveData();
  }
  function addBalance(data){
    var b = activeBoard();
    b.balances.push({id: uid(), label: data.label || '', currency: data.currency, amount: data.amount, kind: data.kind==='secondary' ? 'secondary' : 'main'});
    saveData();
  }
  function updateBalance(id, data){
    var b = activeBoard();
    var x = b.balances.find(function(v){ return v.id===id; });
    if(!x) return;
    x.label = data.label || ''; x.currency = data.currency; x.amount = data.amount; x.kind = data.kind==='secondary' ? 'secondary' : 'main';
    saveData();
  }
  function deleteBalance(id){
    var b = activeBoard();
    b.balances = b.balances.filter(function(x){ return x.id!==id; });
    saveData();
  }

  // ---------- transactions: add an amount to an income/expense card and move a chosen balance account ----------
  function r2(n){ return Math.round((Number(n)||0)*100)/100; }
  function addTransaction(kind, id, amount, balanceId, date, subId){
    return addTransactionOn(activeBoard(), kind, id, amount, balanceId, date, subId);
  }
  function addTransactionOn(b, kind, id, amount, balanceId, date, subId, note){
    var list = kind==='income' ? b.income : b.expenses;
    var item = list.find(function(x){ return x.id===id; });
    if(!item) return null;
    item.amount = r2(Math.max(0, item.amount + amount));
    var sub = (kind==='expense' && subId) ? (item.subs||[]).find(function(s){ return s.id===subId; }) : null;
    if(sub) sub.amount = r2((Number(sub.amount)||0) + amount);
    var bal = balanceId ? b.balances.find(function(x){ return x.id===balanceId; }) : null;
    var moved = bal ? convertForBalance(b, amount, item.currency, bal) : null;
    if(moved===null) bal = null;
    var found = !!bal;
    if(bal){
      bal.amount = r2(bal.amount + (kind==='income' ? moved : -moved));
    }
    if(!Array.isArray(item.history)) item.history = [];
    var hid = uid();
    item.history.push({id: hid, date: date || fmt(todayD()), amount: amount, balanceId: found ? balanceId : null, balAmount: found ? moved : null, subId: sub ? sub.id : null, subName: sub ? sub.name : '', note: note || ''});
    lastHistoryId = hid;
    saveData();
    return found;
  }
  var lastHistoryId = null;
  function deleteTransaction(kind, itemId, historyId){
    deleteTransactionOn(activeBoard(), kind, itemId, historyId);
  }
  function deleteTransactionOn(b, kind, itemId, historyId){
    var list = kind==='income' ? b.income : b.expenses;
    var item = list.find(function(x){ return x.id===itemId; });
    if(!item || !Array.isArray(item.history)) return;
    var idx = item.history.findIndex(function(h){ return h.id===historyId; });
    if(idx===-1) return;
    var h = item.history[idx];
    if(!h.noCard) item.amount = r2(Math.max(0, item.amount - h.amount));
    if(h.occ && item.confirmed) delete item.confirmed[h.occ];
    if(h.occ && item.recurring && item.recurring.confirmed && item.recurring.confirmed[h.occ]===h.id) delete item.recurring.confirmed[h.occ];
    if(h.subId){
      var sb = (item.subs||[]).find(function(s){ return s.id===h.subId; });
      if(sb) sb.amount = r2(Math.max(0, (Number(sb.amount)||0) - h.amount));
    }
    if(h.balanceId){
      var bal = b.balances.find(function(x){ return x.id===h.balanceId; });
      var mv = (typeof h.balAmount==='number') ? h.balAmount : h.amount;
      if(bal){ bal.amount = r2(bal.amount - (kind==='income' ? mv : -mv)); }
    }
    item.history.splice(idx, 1);
    saveData();
  }

  // ---------- подтверждение / перенос выплат ----------
  function confirmIncome(id, orig, amount, balanceId, date){
    var b = activeBoard();
    var inc = b.income.find(function(x){ return x.id===id; });
    if(!inc) return;
    var bal = balanceId ? b.balances.find(function(x){ return x.id===balanceId; }) : null;
    var moved = bal ? convertForBalance(b, amount, inc.currency, bal) : null;
    if(moved===null) bal = null;
    if(bal) bal.amount = r2(bal.amount + moved);
    var hid = uid();
    inc.history.push({id: hid, date: date || fmt(todayD()), amount: amount, balanceId: bal ? bal.id : null, balAmount: bal ? moved : null, subId: null, subName: '', occ: orig, noCard: true});
    inc.confirmed[orig] = hid;
    inc.skipped = inc.skipped.filter(function(x){ return x!==orig; });
    showToast(bal ? T('Зачислено на «')+(bal.label || T('счёт'))+'»' : T('Выплата отмечена'));
    saveData();
  }
  // объект с расписанием: сам доход или настройки регулярного расхода
  function recurSched(kind, id){
    var b = activeBoard();
    if(kind==='expense'){
      var e = b.expenses.find(function(x){ return x.id===id; });
      return (e && e.recurring) ? e.recurring : null;
    }
    return b.income.find(function(x){ return x.id===id; }) || null;
  }
  function payExpense(id, orig, amount, balanceId, date){
    var b = activeBoard();
    var exp = b.expenses.find(function(x){ return x.id===id; });
    if(!exp || !exp.recurring) return;
    var found = addTransactionOn(b, 'expense', exp.id, amount, balanceId || null, date, null, T('регулярный платёж'));
    var h = exp.history.find(function(v){ return v.id===lastHistoryId; });
    if(h) h.occ = orig;
    exp.recurring.confirmed[orig] = lastHistoryId;
    exp.recurring.skipped = exp.recurring.skipped.filter(function(v){ return v!==orig; });
    exp.recurring.balanceId = balanceId || '';
    var bal = found ? b.balances.find(function(x){ return x.id===balanceId; }) : null;
    showToast(bal ? T('Оплачено · списано с «')+(bal.label || T('счёт'))+'»' : T('Оплата отмечена'));
    saveData();
  }
  function postponeIncome(id, orig, newDate, kind){
    var inc = recurSched(kind, id);
    if(!inc || !isValidDs(newDate)) return;
    if(newDate===orig) delete inc.postponed[orig]; else inc.postponed[orig] = newDate;
    inc.skipped = inc.skipped.filter(function(x){ return x!==orig; });
    showToast(T('Перенесено на ')+fmtHuman(newDate));
    saveData();
  }
  function skipIncome(id, orig, kind){
    var inc = recurSched(kind, id);
    if(!inc) return;
    if(inc.skipped.indexOf(orig)===-1) inc.skipped.push(orig);
    saveData();
  }
  function unskipIncome(id, orig, kind){
    var inc = recurSched(kind, id);
    if(!inc) return;
    inc.skipped = inc.skipped.filter(function(x){ return x!==orig; });
    saveData();
  }

  // ---------- render ----------
  var app = document.getElementById('app');

  var pendingAnim = 'enter'; // 'enter' | 'slide-next' | 'slide-prev' | ''

  // помечаем окно ключом, чтобы понимать, какое окно открылось, а какое закрылось
  function ov(key, html, center){
    if(!html) return '';
    return html.replace('<div class="overlay">', '<div class="overlay'+(center?' center':'')+'" data-ov="'+key+'">');
  }
  // закрытое окно не исчезает мгновенно, а плавно уходит
  function ghostOut(node, under){
    node.classList.remove('static');
    node.classList.add('closing');
    if(under) node.classList.add('under');
    node.querySelectorAll('[id]').forEach(function(el){ el.removeAttribute('id'); });
    node.querySelectorAll('[data-act]').forEach(function(el){ el.removeAttribute('data-act'); });
    node.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(node, app);
    var done = false;
    var remove = function(){ if(done) return; done = true; if(node.parentNode) node.parentNode.removeChild(node); };
    node.addEventListener('animationend', function(ev){ if(ev.target===node) remove(); });
    setTimeout(remove, 450);
  }

  function render(){
    var prevCards = app.querySelector('.cards');
    var savedCards = prevCards ? prevCards.scrollTop : 0;
    var oldOverlays = {}, savedModalScroll = {};
    app.querySelectorAll('.overlay[data-ov]').forEach(function(o){
      oldOverlays[o.dataset.ov] = o;
      var m = o.querySelector('.modal');
      savedModalScroll[o.dataset.ov] = m ? m.scrollTop : 0;
    });
    var savedWinY = window.pageYOffset;
    var resetCards = (pendingAnim==='enter');
    var html = '';
    html += renderHeader();
    html += '<div class="layout' + (pendingAnim ? ' ' + pendingAnim : '') + '">';
    pendingAnim = '';
    html += renderSidebar();
    html += renderCalendar();
    html += '</div>';
    html += renderStreakBar();
    if(state.menuOpen) html += ov('menu', renderMenuDrawer());
    if(state.modal==='add') html += ov('add', renderAddModal());
    if(state.modal==='day') html += ov('day', renderDayModal());
    if(state.modal==='balance') html += ov('balance', renderBalanceModal());
    if(state.modal==='transaction') html += ov('transaction', renderTransactionModal());
    if(state.modal==='rates') html += ov('rates', renderRatesModal());
    if(state.modal==='history') html += ov('history', renderTransactionHistoryModal());
    if(state.modal==='settings') html += ov('settings', renderSettingsModal());
    if(state.modal==='schedule-time') html += ov('schedule-time', renderScheduleTimeModal());
    if(state.modal==='task-detail') html += ov('task-detail', renderTaskDetailModal());
    if(state.modal==='renew') html += ov('renew', renderRenewModal());
    if(state.modal==='income-confirm') html += ov('income-confirm', renderIncomeConfirmModal());
    if(state.modal==='income-postpone') html += ov('income-postpone', renderIncomePostponeModal());
    if(state.modal==='expense-pay') html += ov('expense-pay', renderExpensePayModal());
    if(state.modal==='balance-op') html += ov('balance-op', renderBalanceOpModal());
    if(state.modal==='summary') html += ov('summary', renderSummaryModal());
    if(state.modal==='sub-pay') html += ov('sub-pay', renderSubPayModal());
    if(state.modal==='streak') html += ov('streak', renderStreakModal());
    if(state.modal==='onboarding') html += ov('onboarding', renderOnboarding());
    if(state.modal==='admin' && isAdmin()) html += ov('admin', renderAdminModal());
    if(state.pendingBackup) html += ov('backup', renderBackupDialog(), true);
    if(state.confirmDeleteId) html += ov('confirm-board', renderConfirmDeleteBoardModal(), true);
    if(state.renameBoardId) html += ov('rename-board', renderRenameBoardModal(), true);
    if(state.confirmCard) html += ov('confirm-card', renderConfirmDeleteCardModal(), true);
    app.innerHTML = html;
    // окна, которые были открыты и раньше, не анимируем повторно
    var newKeys = {};
    var newOverlays = app.querySelectorAll('.overlay[data-ov]');
    newOverlays.forEach(function(o){
      var k = o.dataset.ov;
      newKeys[k] = true;
      if(oldOverlays[k]){
        o.classList.add('static');
        var m = o.querySelector('.modal');
        if(m) m.scrollTop = savedModalScroll[k] || 0;
      }
    });
    Object.keys(oldOverlays).forEach(function(k){
      if(!newKeys[k]) ghostOut(oldOverlays[k], newOverlays.length>0);
    });
    document.documentElement.classList.toggle('modal-open', newOverlays.length>0);
    attachHandlers();
    updateNowHighlight();
    applySearch();
    // сохраняем прокрутку: страницы и списка карточек
    var cardsEl = app.querySelector('.cards');
    if(cardsEl && !resetCards) cardsEl.scrollTop = savedCards;
    if(Math.abs(window.pageYOffset - savedWinY) > 1) window.scrollTo(0, savedWinY);
    updateTruncation();
    renderMiniBar();
  }

  // при «Изменить» в балансе: прокрутить к форме и дважды мигнуть полями
  function focusBalanceForm(){
    var f = document.getElementById('balance-form');
    if(!f) return;
    f.scrollIntoView({behavior: 'smooth', block: 'center'});
    setTimeout(function(){
      f.classList.remove('flash');
      void f.offsetWidth;
      f.classList.add('flash');
    }, 250);
  }

  // подсветка урока, который идёт прямо сейчас (таблица расписания)
  function updateNowHighlight(){
    var nowDow = new Date().getDay();
    var hm = nowHM();
    document.querySelectorAll('.schedule-table tr[data-start]').forEach(function(tr){
      var st = tr.dataset.start, en = tr.dataset.end;
      var on = Number(tr.dataset.day)===nowDow && st && en && hm>=st && hm<en && !tr.classList.contains('is-done');
      tr.classList.toggle('now', !!on);
    });
  }

  // ---------- поиск по карточкам (боковая панель, все типы досок) ----------
  function iconSvg(name){
    var paths = {
      edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
      copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
      x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[name]+'</svg>';
  }
  function renderSearchBox(){
    return '<div class="search-box">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'+
      T('<input type="search" id="card-search" placeholder="Поиск по названию" autocomplete="off" value="')+escapeHtml(state.search||'')+'">'+
    '</div>';
  }
  function applySearch(){
    var q = (state.search||'').trim().toLowerCase();
    var wrap = app.querySelector('.cards');
    if(!wrap) return;
    var cards = wrap.querySelectorAll('.punch-card');
    var shown = 0;
    cards.forEach(function(c){
      var nm = c.querySelector('.pc-name .txt');
      var text = (nm ? nm.textContent : '').toLowerCase();
      var ok = !q || text.indexOf(q)!==-1;
      c.style.display = ok ? '' : 'none';
      if(ok) shown++;
    });
    var msg = wrap.querySelector('.search-empty');
    if(cards.length && q && shown===0){
      if(!msg){
        msg = document.createElement('div');
        msg.className = 'search-empty empty';
        msg.style.padding = '20px 6px';
        msg.innerHTML = T('<div class="display">Ничего не найдено</div>Попробуйте другой запрос.');
        wrap.appendChild(msg);
      }
    } else if(msg){
      msg.remove();
    }
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function renderAddModal(){
    var ab = activeBoard();
    if(ab.type==='events') return renderAddEventModal();
    if(ab.type==='finance') return state.financeView==='expenses' ? renderAddExpenseModal() : renderAddIncomeModal();
    if(isSchedType(ab.type)) return renderAddScheduleItemModal();
    if(ab.type==='subs') return renderAddSubModal();
    if(ab.type==='habits') return renderAddHabitModal();
    return renderAddSubjectModal();
  }
  function renderDayModal(){
    var ab = activeBoard();
    if(ab.type==='events') return renderEventDayModal();
    if(ab.type==='finance') return renderFinanceDayModal();
    if(isSchedType(ab.type)) return renderScheduleDayModal();
    if(ab.type==='subs') return renderSubsDayModal();
    if(ab.type==='habits') return renderHabitsDayModal();
    return renderLessonDayModal();
  }

  function renderHeader(){
    var vd = state.viewDate;
    var ab = activeBoard();
    var typeLabel = {events:T('события'), finance:T('финансы'), schedule:T('расписание'), planner:T('задачи'), subs:T('подписки'), habits:T('привычки')}[ab.type] || T('занятия');
    var storageWarn = state.storageOk ? '' :
      T('<div class="storage-warn">Локальное хранилище браузера недоступно (например, приватный режим) — изменения не сохранятся.</div>');
    var financeToggle = '';
    if(ab.type==='finance'){
      financeToggle = ''+
        '<div class="segmented" role="tablist">'+
          '<button class="seg-btn'+(state.financeView==='income'?' active':'')+T('" data-act="finance-view" data-view="income">Доходы</button>')+
          '<button class="seg-btn'+(state.financeView==='expenses'?' active':'')+T('" data-act="finance-view" data-view="expenses">Расходы</button>')+
        '</div>';
    }
    return ''+
      '<header class="top">'+
        '<div class="top-left">'+
          T('<button class="icon-btn" data-act="open-menu" title="Доски">☰</button>')+
          T('<div><h1 class="display">Календарь<span>Доска: <b>')+escapeHtml(ab.name)+'</b> · '+typeLabel+'</span></h1></div>'+
          privBtnHtml('in-top')+
        '</div>'+
        '<div class="month-nav">'+
          '<div class="month-switch">'+
            '<button class="icon-btn" data-act="prev-month">‹</button>'+
            '<div class="label mono">'+periodLabel()+'</div>'+
            '<button class="icon-btn" data-act="next-month">›</button>'+
          '</div>'+
          '<div class="month-extra">'+
            financeToggle+
            todayBtnHtml()+
            T('<button class="btn small" data-act="open-summary">Сводка</button>')+
            privBtnHtml('in-extra')+
          '</div>'+
        '</div>'+
      '</header>'+
      (FAKE_TODAY ? '<button type="button" class="fake-date-badge" data-act="open-admin">🧪 Тестовая дата: <b>'+fmtHuman(FAKE_TODAY)+'</b> · нажмите, чтобы изменить</button>' : '')+
      storageWarn;
  }

  function renderSidebar(){
    var ab = activeBoard();
    if(ab.type==='events') return renderEventsSidebar(ab);
    if(ab.type==='finance') return state.financeView==='expenses' ? renderExpensesSidebar(ab) : renderIncomeSidebar(ab);
    if(isSchedType(ab.type)) return renderScheduleSidebar(ab);
    if(ab.type==='subs') return renderSubsSidebar(ab);
    if(ab.type==='habits') return renderHabitsSidebar(ab);
    return renderLessonsSidebar(ab);
  }

  function renderLessonsSidebar(ab){
    var html = '<div class="sidebar">'+renderRenewalNotice(ab)+T('<h2>Курсы</h2>')+renderSearchBox()+'<div class="cards">';
    if(ab.subjects.length===0){
      html += T('<div class="empty" style="padding:20px 6px;"><div class="display">Пока пусто</div>Добавьте первый курс, чтобы начать отсчёт уроков.</div>');
    }
    ab.subjects.forEach(function(s){
      var color = COLORS[s.color] || COLORS.amber;
      var daysStr = s.days.slice().sort(function(a,b){ return DOW_VALUES.indexOf(a)-DOW_VALUES.indexOf(b); })
        .map(function(v){ return DOW_LABELS[DOW_VALUES.indexOf(v)]; }).join(', ');
      var timeStr = timeRangeStr(s);
      var metaLine = daysStr + T(' · с ')+fmtHuman(s.startDate) + (timeStr ? ' · '+timeStr : '');

      var bodyHtml;
      if(s.planType==='static'){
        var statLine;
        if(!s.paidUntil){
          statLine = T('<span class="dim">Дата окончания не указана</span>');
        } else {
          var dl = daysUntil(s.paidUntil);
          if(dl<0) statLine = T('<span class="warn">Абонемент истёк ')+fmtHuman(s.paidUntil)+'</span>';
          else if(dl<=7) statLine = T('<span class="warn">Осталось ')+dl+T(' дн. (до ')+fmtHuman(s.paidUntil)+')</span>';
          else statLine = T('Оплачено до <b>')+fmtHuman(s.paidUntil)+'</b>';
        }
        bodyHtml = ''+
          '<div class="pc-stats">'+
            T('Абонемент до <span class="pc-total-edit"><input type="date" class="mono" data-act="edit-paiduntil" data-id="')+s.id+'" value="'+(s.paidUntil||'')+'"></span>'+
            '<br>'+statLine+
          '</div>';
      } else {
        var used = usedCount(s);
        var rem = remaining(s);
        var fc = forecast(s);
        var maxDots = 60;
        var dotsHtml = '';
        var dotCount = Math.min(s.total, maxDots);
        for(var i=0;i<dotCount;i++){
          dotsHtml += '<i class="'+(i<used?'filled':'')+'" style="--dotcolor:'+color+'"></i>';
        }
        var overflowNote = s.total>maxDots ? ' <span class="mono" style="font-size:10px;">+'+(s.total-maxDots)+'</span>' : '';
        var statLine2;
        if(rem<0){
          statLine2 = T('<span class="warn">Превышение на ')+Math.abs(rem)+T(' — увеличьте количество уроков</span>');
        } else if(rem===0){
          statLine2 = T('<span class="warn">Уроки закончились</span>');
        } else if(fc.date){
          statLine2 = T('Хватит до <b>')+fmtHuman(fc.date)+'</b>';
        } else if(fc.unknown){
          statLine2 = T('<span class="dim">хватит более чем на 3 года вперёд</span>');
        } else {
          statLine2 = '';
        }
        bodyHtml = ''+
          '<div class="dots">'+dotsHtml+overflowNote+'</div>'+
          '<div class="pc-stats">'+
            T('Осталось <b>')+rem+T('</b> из ')+
            '<span class="pc-total-edit"><input type="number" min="0" class="mono" data-act="edit-total" data-id="'+s.id+'" value="'+s.total+'"></span>'+
            '<br>'+statLine2+
          '</div>';
      }

      html += ''+
        '<div class="punch-card" data-subj="'+s.id+'">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt" title="'+escapeHtml(s.name)+'">'+escapeHtml(s.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="renew-subject" data-id="'+s.id+T('" title="Продлить и история оплат" style="width:26px;height:26px;font-size:13px;">↻</button>')+
              '<button class="icon-btn" data-act="edit-subject" data-id="'+s.id+T('" title="Изменить" style="width:26px;height:26px;font-size:12px;">✎</button>')+
              '<button class="icon-btn" data-act="delete-subject" data-id="'+s.id+T('" title="Удалить" style="width:26px;height:26px;font-size:13px;">✕</button>')+
            '</div>'+
          '</div>'+
          '<div class="pc-days mono">'+metaLine+'</div>'+
          '<div class="pc-body">'+bodyHtml+(paidTotals(s).length ? T('<div class="pc-paid">Оплачено всего: <b>')+paidTotals(s).join(' + ')+'</b></div>' : '')+'</div>'+
        '</div>';
    });
    html += '</div>';
    html += T('<button class="add-card" data-act="open-add">+ Добавить курс</button>');
    html += '</div>';
    return html;
  }

  function renderEventsSidebar(ab){
    var html = T('<div class="sidebar"><h2>События</h2>')+renderSearchBox()+'<div class="cards">';
    if(ab.events.length===0){
      html += T('<div class="empty" style="padding:20px 6px;"><div class="display">Пока пусто</div>Добавьте первое событие — например, день рождения.</div>');
    }
    var sorted = ab.events.slice().sort(function(a,b){
      var na = nextOccurrence(a), nb = nextOccurrence(b);
      if(!na && !nb) return 0;
      if(!na) return 1;
      if(!nb) return -1;
      return na < nb ? -1 : 1;
    });
    sorted.forEach(function(ev){
      var color = COLORS[ev.color] || COLORS.amber;
      var next = nextOccurrence(ev);
      var line1 = ev.yearly ? (T('Ежегодно · ')+fmtHumanNoYear(ev.date)) : fmtHuman(ev.date);
      var line2;
      if(next){
        var dl = daysUntil(next);
        if(dl===0) line2 = T('<b style="color:var(--today)">Сегодня!</b>');
        else line2 = T('через ')+dl+T(' дн.');
      } else {
        line2 = T('<span class="dim">прошло</span>');
      }
      html += ''+
        '<div class="punch-card">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt" title="'+escapeHtml(ev.name)+'">'+escapeHtml(ev.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="edit-event" data-id="'+ev.id+T('" title="Изменить" style="width:26px;height:26px;font-size:12px;">✎</button>')+
              '<button class="icon-btn" data-act="delete-event" data-id="'+ev.id+T('" title="Удалить" style="width:26px;height:26px;font-size:13px;">✕</button>')+
            '</div>'+
          '</div>'+
          '<div class="pc-body">'+
            '<div class="pc-stats">'+line1+'<br>'+line2+'</div>'+
          '</div>'+
        '</div>';
    });
    html += '</div>';
    html += T('<button class="add-card" data-act="open-add">+ Добавить событие</button>');
    html += '</div>';
    return html;
  }

  function renderScheduleSidebar(ab){
    var html = '<div class="sidebar"><h2>'+(ab.type==='planner'?T('Задачи'):T('Расписание'))+'</h2>'+renderSearchBox()+'<div class="cards">';
    if(ab.scheduleItems.length===0){
      html += T('<div class="empty" style="padding:20px 6px;"><div class="display">Пока пусто</div>')+(ab.type==='planner'?T('Сначала добавьте задачу, а потом расставьте дни и время для неё.'):T('Сначала добавьте урок, а потом расставьте дни и время для него.'))+'</div>';
    }
    var sorted = ab.scheduleItems.slice().sort(function(a,b){ return a.name.localeCompare(b.name); });
    sorted.forEach(function(it){
      var color = COLORS[it.color] || COLORS.amber;
      var timesSorted = it.times.slice().sort(function(a,b){
        if(!!a.date!==!!b.date) return a.date ? 1 : -1;
        if(a.date && a.date!==b.date) return a.date<b.date ? -1 : 1;
        var da = DOW_VALUES.indexOf(a.day), db = DOW_VALUES.indexOf(b.day);
        if(da!==db) return da-db;
        return (a.timeStart||'').localeCompare(b.timeStart||'');
      });
      var timesHtml;
      if(timesSorted.length===0){
        timesHtml = T('<div class="dim" style="font-size:12px;">Дни и время ещё не заданы</div>');
      } else {
        timesHtml = timesSorted.map(function(t){
          var lbl = timeLabel(t);
          var sds = sidebarDateFor(t);
          var dn = isDoneOn(t, sds);
          var pastOnce = t.date && t.date < fmt(todayD());
          return ''+
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 0;">'+
              '<span style="display:flex;align-items:center;gap:8px;">'+
                (ab.type==='planner' ? '<input type="checkbox" class="task-check" data-act="toggle-done" data-item="'+it.id+'" data-time="'+t.id+'" data-date="'+sds+'"'+(dn?' checked':'')+'>' : '')+
                '<span class="mono'+(ab.type==='planner' && dn ? ' task-done' : '')+(pastOnce ? ' dim' : '')+'" style="font-size:13px;">'+lbl+(t.date ? T(' <span class="tag">разово</span>') : '')+'</span>'+
              '</span>'+
              '<span style="display:flex;gap:4px;">'+
                '<button class="icon-btn tiny" data-act="edit-schedule-time" data-item="'+it.id+'" data-time="'+t.id+T('" title="Изменить">✎</button>')+
                '<button class="icon-btn tiny" data-act="delete-schedule-time" data-item="'+it.id+'" data-time="'+t.id+T('" title="Удалить">✕</button>')+
              '</span>'+
            '</div>';
        }).join('');
      }
      html += ''+
        '<div class="punch-card">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt" title="'+escapeHtml(it.name)+'">'+escapeHtml(it.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="add-schedule-time" data-item="'+it.id+T('" title="Добавить день и время" style="width:26px;height:26px;font-size:14px;">+</button>')+
              '<button class="icon-btn" data-act="edit-schedule-item" data-id="'+it.id+T('" title="Изменить" style="width:26px;height:26px;font-size:12px;">✎</button>')+
              '<button class="icon-btn" data-act="delete-schedule-item" data-id="'+it.id+T('" title="Удалить" style="width:26px;height:26px;font-size:13px;">✕</button>')+
            '</div>'+
          '</div>'+
          '<div class="pc-body">'+
            (it.notes?'<div class="pc-stats" style="margin-bottom:6px;"><span class="dim">'+escapeHtml(it.notes)+'</span></div>':'')+
            timesHtml+
          '</div>'+
        '</div>';
    });
    html += '</div>';
    html += '<button class="add-card" data-act="open-add">+ '+(ab.type==='planner'?T('Добавить задачу'):T('Добавить урок'))+'</button>';
    html += '</div>';
    return html;
  }

  function renderBalanceWidget(ab){
    var mains = ab.balances.filter(function(x){ return x.kind==='main'; });
    var body;
    if(mains.length){
      body = mains.map(function(x){
        return '<div class="balance-line">'+
          '<span class="bl-name">'+escapeHtml(x.label || T('Основной'))+'</span>'+
          '<span class="bl-sum">'+fmtMoney(x.amount, x.currency)+'</span>'+
          '<button type="button" class="bl-plus" data-act="balance-op" data-id="'+x.id+'" title="'+T('Пополнить или перевести')+'" aria-label="'+T('Пополнить или перевести')+'">+</button>'+
        '</div>';
      }).join('');
    } else {
      body = T('Добавить баланс');
    }
    return ''+
      '<div class="balance-widget" role="button" tabindex="0" data-act="open-balance">'+
        T('<div class="balance-widget-label">Баланс</div>')+
        '<div class="balance-widget-value mono">'+body+'</div>'+
      '</div>';
  }

  function renderIncomeSidebar(ab){
    var html = '<div class="sidebar">'+renderIncomePrompts(ab)+renderBalanceWidget(ab)+T('<h2>Доходы</h2>')+renderSearchBox()+'<div class="cards">';
    if(ab.income.length===0){
      html += T('<div class="empty" style="padding:20px 6px;"><div class="display">Пока пусто</div>Добавьте зарплату, инвестиции или другой источник дохода.</div>');
    }
    var sorted = ab.income.slice().sort(function(a,b){
      var na = nextIncomeDate(a), nb = nextIncomeDate(b);
      if(!na && !nb) return 0;
      if(!na) return 1;
      if(!nb) return -1;
      return na < nb ? -1 : 1;
    });
    sorted.forEach(function(inc){
      var color = COLORS[inc.color] || COLORS.amber;
      var line1 = inc.scheduleType==='monthly' ? (T('Ежемесячно · ')+inc.dayOfMonth+T(' числа')) : (T('Разово · ')+fmtHuman(inc.date));
      var next = nextIncomeDate(inc);
      var line2;
      if(next){
        var dl = daysUntil(next);
        if(dl===0) line2 = T('<b style="color:var(--today)">Сегодня!</b>');
        else line2 = T('через ')+dl+T(' дн.');
      } else {
        line2 = T('<span class="dim">прошло</span>');
      }
      html += ''+
        '<div class="punch-card">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt" title="'+escapeHtml(inc.name)+'">'+escapeHtml(inc.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="add-transaction" data-kind="income" data-id="'+inc.id+T('" title="Добавить сумму" style="width:26px;height:26px;font-size:14px;">+</button>')+
              '<button class="icon-btn" data-act="edit-income" data-id="'+inc.id+T('" title="Изменить" style="width:26px;height:26px;font-size:12px;">✎</button>')+
              '<button class="icon-btn" data-act="delete-income" data-id="'+inc.id+T('" title="Удалить" style="width:26px;height:26px;font-size:13px;">✕</button>')+
            '</div>'+
          '</div>'+
          '<div class="pc-body">'+
            '<div class="pc-stats"><b>'+fmtMoney(inc.amount, inc.currency)+'</b><br>'+line1+'<br>'+line2+'</div>'+
          '</div>'+
        '</div>';
    });
    html += '</div>';
    html += T('<button class="add-card" data-act="open-add">+ Добавить доход</button>');
    html += '</div>';
    return html;
  }

  function renderSubsBlock(exp){
    var subs = exp.subs || [];
    if(!subs.length) return '';
    var cur = exp.currency;
    var sum = subs.reduce(function(t,s){ return t + (Number(s.amount)||0); }, 0);
    var html = '<div class="sub-list">'+
      subs.map(function(s){
        return '<div class="sub-row">'+
          '<span class="sub-name" title="'+escapeHtml(s.name)+'">'+escapeHtml(s.name)+'</span>'+
          '<span class="sub-sum mono">'+fmtMoney2(s.amount, cur)+'</span>'+
          '<button class="icon-btn" data-act="add-transaction" data-kind="expense" data-id="'+exp.id+'" data-sub="'+s.id+T('" title="Добавить сумму" style="width:26px;height:26px;font-size:14px;">+</button>')+
        '</div>';
      }).join('')+
    '</div>';
    var rest = exp.amount - sum;
    html += '<div class="sub-rest">'+(rest>=0
      ? T('Остальное: <b>')+fmtMoney2(rest, cur)+'</b>'
      : T('<span class="warn">Подкатегории больше суммы на ')+fmtMoney2(-rest, cur)+'</span>')+'</div>';
    return html;
  }

  function renderExpensesSidebar(ab){
    var html = '<div class="sidebar">'+renderIncomePrompts(ab)+renderBalanceWidget(ab)+T('<h2>Расходы</h2>')+renderSearchBox()+'<div class="cards">';
    if(ab.expenses.length===0){
      html += T('<div class="empty" style="padding:20px 6px;"><div class="display">Пока пусто</div>Добавьте статьи расходов, чтобы увидеть их на колесе.</div>');
    }
    var totalsByCur = {};
    ab.expenses.forEach(function(e){ totalsByCur[e.currency] = (totalsByCur[e.currency]||0) + e.amount; });
    ab.expenses.forEach(function(exp){
      var color = COLORS[exp.color] || COLORS.amber;
      var curTotal = totalsByCur[exp.currency] || 0;
      var pct = curTotal>0 ? Math.round(exp.amount/curTotal*100) : 0;
      html += ''+
        '<div class="punch-card">'+
          '<div class="notch left"></div><div class="notch right"></div><div class="perf"></div>'+
          '<div class="pc-head">'+
            '<div class="pc-name"><span class="dot" style="background:'+color+'"></span><span class="txt" title="'+escapeHtml(exp.name)+'">'+escapeHtml(exp.name)+'</span></div>'+
            '<div style="display:flex;gap:4px;">'+
              '<button class="icon-btn" data-act="add-transaction" data-kind="expense" data-id="'+exp.id+T('" title="Добавить сумму" style="width:26px;height:26px;font-size:14px;">+</button>')+
              '<button class="icon-btn" data-act="edit-expense" data-id="'+exp.id+T('" title="Изменить" style="width:26px;height:26px;font-size:12px;">✎</button>')+
              '<button class="icon-btn" data-act="delete-expense" data-id="'+exp.id+T('" title="Удалить" style="width:26px;height:26px;font-size:13px;">✕</button>')+
            '</div>'+
          '</div>'+
          '<div class="pc-body">'+
            '<div class="pc-stats"><b>'+fmtMoney(exp.amount, exp.currency)+'</b><br>'+pct+T('% от расходов в ')+(CURRENCIES[exp.currency]||exp.currency)+'</div>'+
            renderRecurringLine(exp)+
            renderBudgetBlock(exp)+
            renderSubsBlock(exp)+
          '</div>'+
        '</div>';
    });
    html += '</div>';
    html += T('<button class="add-card" data-act="open-add">+ Добавить расход</button>');
    html += '</div>';
    return html;
  }

  function renderCalendar(){
    var ab = activeBoard();
    var compact = (ab.type==='finance') || isSchedType(ab.type) || ab.type==='subs' || ab.type==='habits';
    var html = '<div class="cal-col">';
    html += renderCalendarGrid(compact);
    if(ab.type==='finance'){
      html += (state.financeView==='expenses') ? renderExpenseWheel(ab) : renderMoneyWheel(ab);
      html += renderMonthlyStats(ab);
    }
    if(ab.type==='schedule') html += renderScheduleTable(ab);
    if(ab.type==='planner') html += renderPlannerTable(ab);
    if(ab.type==='subs') html += renderSubsPanel(ab);
    if(ab.type==='habits') html += renderHabitsPanel(ab);
    html += '</div>';
    return html;
  }

  function renderCalendarGrid(compact){
    var vd = state.viewDate;
    var ab = activeBoard();
    var y = vd.getFullYear(), m = vd.getMonth();
    var firstOfMonth = new Date(y,m,1);
    var jsDow = firstOfMonth.getDay();
    var mondayOffset = (jsDow===0) ? 6 : jsDow-1;
    var gridStart = addDays(firstOfMonth, -mondayOffset);
    var todayStr = fmt(todayD());
    var isWeek = state.calView==='week';
    if(isWeek) gridStart = parseD(curWeekStart());

    var dowRow = '<div class="cal-dow">'+DOW_LABELS.map(function(l){ return '<div>'+l+'</div>'; }).join('')+'</div>';
    var viewSwitch = '<div class="cal-top"><div class="segmented" role="tablist">'+
      '<button class="seg-btn'+(isWeek?' active':'')+'" data-act="cal-view" data-view="week">'+T('Неделя')+'</button>'+
      '<button class="seg-btn'+(isWeek?'':' active')+'" data-act="cal-view" data-view="month">'+T('Месяц')+'</button>'+
    '</div></div>';
    var cells = '';
    for(var i=0;i<(isWeek?7:42);i++){
      var d = addDays(gridStart, i);
      var ds = fmt(d);
      var outside = !isWeek && d.getMonth()!==m;
      var isToday = ds===todayStr;
      var markers = '';
      if(ab.type==='events'){
        ab.events.forEach(function(ev){
          if(!eventOccursOn(ev, ds)) return;
          var color = COLORS[ev.color] || COLORS.amber;
          var cls = 'marker' + (ds<=todayStr ? '' : ' outline');
          markers += '<span class="'+cls+'" title="'+escapeHtml(ev.name)+'" style="--mc:'+color+'"></span>';
        });
      } else if(ab.type==='finance'){
        ab.income.forEach(function(inc){
          var color = COLORS[inc.color] || COLORS.amber;
          incomeOccsOn(inc, ds).forEach(function(o){
            var cls = 'marker';
            var note = '';
            if(o.status==='skipped'){ cls += ' cancelled'; note = T(' · не будет'); }
            else if(o.status==='pending'){
              cls += ' outline';
              if(ds<=todayStr && o.orig>=inc.createdAt){ cls += ' due'; note = T(' · ждёт подтверждения'); }
            } else note = T(' · получено');
            if(o.moved) cls += ' moved';
            var tt = inc.name+' · '+fmtMoney(inc.amount, inc.currency)+note;
            markers += '<span class="'+cls+'" title="'+escapeHtml(tt)+'" style="--mc:'+color+'"></span>';
          });
          var histEntry = (inc.history||[]).find(function(h){ return h.date===ds && !h.occ; });
          if(histEntry){
            markers += '<span class="marker" title="'+escapeHtml(inc.name+' · +'+fmtMoney(histEntry.amount, inc.currency))+'" style="--mc:'+color+'"></span>';
          }
        });
        ab.expenses.forEach(function(exp){
          if(!exp.recurring) return;
          incomeOccsOn(exp.recurring, ds).forEach(function(o){
            if(o.status==='confirmed') return; // оплаченный платёж виден как обычная трата
            var cls = 'marker';
            if(o.status==='skipped') cls += ' cancelled';
            else { cls += ' outline'; if(ds<=todayStr && o.orig>=exp.recurring.createdAt) cls += ' due'; }
            if(o.moved) cls += ' moved';
            markers += '<span class="'+cls+'" title="'+escapeHtml(exp.name+' · '+fmtMoney(exp.recurring.amount, exp.currency))+'" style="--mc:'+(COLORS[exp.color]||COLORS.amber)+'"></span>';
          });
        });
        ab.expenses.forEach(function(exp){
          var histEntry = (exp.history||[]).find(function(h){ return h.date===ds; });
          if(!histEntry) return;
          var color = COLORS[exp.color] || COLORS.amber;
          var cls = 'marker' + (ds<=todayStr ? '' : ' outline');
          var tt = exp.name+' · -'+fmtMoney(histEntry.amount, exp.currency);
          markers += '<span class="'+cls+'" title="'+escapeHtml(tt)+'" style="--mc:'+color+'"></span>';
        });
      } else if(ab.type==='subs'){
        markers += subMarkersFor(ab, ds, todayStr);
      } else if(ab.type==='habits'){
        markers += habitMarkersFor(ab, ds, todayStr);
      } else if(isSchedType(ab.type)){
        ab.scheduleItems.forEach(function(it){
          it.times.forEach(function(t){
            if(!timeOnDate(t, ds)) return;
            var color = COLORS[it.color] || COLORS.amber;
            var cls = ab.type==='planner' ? ('marker' + (isDoneOn(t, ds) ? '' : ' outline')) : ('marker' + (ds<=todayStr ? '' : ' outline'));
            var tt = it.name + (timeRangeStr(t) ? ' · '+timeRangeStr(t) : '');
            markers += '<span class="'+cls+'" title="'+escapeHtml(tt)+'" style="--mc:'+color+'"></span>';
          });
        });
      } else {
        ab.subjects.forEach(function(s){
          var info = dayInfo(s, ds);
          if(!info) return;
          var color = COLORS[s.color] || COLORS.amber;
          var cls = 'marker';
          if(info.kind==='cancelled'){ cls += ' cancelled'; }
          else if(info.kind==='upcoming'){ cls += ' outline'; }
          else if(info.kind==='moved-upcoming'){ cls += ' outline moved'; }
          else if(info.kind==='moved-done'){ cls += ' moved'; }
          var tt = s.name + (timeRangeStr(s) ? ' · '+timeRangeStr(s) : '');
          markers += '<span class="'+cls+'" title="'+escapeHtml(tt)+'" style="--mc:'+color+'"></span>';
        });
      }
      if(isWeek){
        // в режиме недели рядом с точкой пишем название
        var wkItems = [];
        markers.replace(/<span class="(marker[^"]*)" title="([^"]*)" style="([^"]*)"><\/span>/g, function(all, c, t, st){
          wkItems.push('<span class="wk-item" title="'+t+'"><span class="'+c+'" style="'+st+'"></span><span class="wk-txt">'+t+'</span></span>');
          return '';
        });
        var WK_MAX = 5;
        markers = wkItems.slice(0, WK_MAX).join('') +
          (wkItems.length > WK_MAX ? '<span class="wk-more">'+(LANG==='en' ? '+'+(wkItems.length - WK_MAX)+' more' : T('ещё')+' '+(wkItems.length - WK_MAX))+'</span>' : '');
      }
      cells += ''+
        '<div class="cal-cell'+(outside?' outside':'')+(isToday?' today':'')+'" data-act="open-day" data-date="'+ds+'">'+
          (isWeek ? '<div class="wk-head"><span class="wk-dow">'+DOW_LABELS[i]+'</span><div class="num">'+d.getDate()+'</div></div>' : '<div class="num">'+d.getDate()+'</div>')+
          '<div class="cal-markers">'+(markers || (isWeek ? '<span class="wk-empty">—</span>' : ''))+'</div>'+
        '</div>';
    }
    return '<div class="cal-wrap'+(compact?' compact':'')+(isWeek?' week':'')+'">'+viewSwitch+dowRow+'<div class="cal-grid">'+cells+'</div></div>';
  }

  function renderExpenseWheel(ab){
    var curs = currenciesUsed(ab.expenses);
    var display = (ab.wheelCurrency && CURRENCY_KEYS.indexOf(ab.wheelCurrency)!==-1) ? ab.wheelCurrency : (curs[0] || DEFAULT_CURRENCY);
    var controlsHtml = ''+
      '<div class="wheel-controls">'+
        T('<label class="mono">Колесо в:</label>')+
        '<select data-act="set-wheel-currency">'+
          CURRENCY_KEYS.map(function(c){ return '<option value="'+c+'"'+(c===display?' selected':'')+'>'+c+' ('+CURRENCIES[c]+')</option>'; }).join('')+
        '</select>'+
        '<button type="button" class="btn small" data-act="refresh-rates" data-to="'+display+T('">Обновить курсы</button>')+
        T('<button type="button" class="btn small" data-act="open-rates">Курсы валют</button>')+
        T('<button type="button" class="btn small" data-act="open-history">История транзакций</button>')+
      '</div>';
    if(ab.expenses.length===0){
      return controlsHtml + T('<div class="empty" style="padding:24px 10px;"><div class="display">Колесо пусто</div>Добавьте расходы слева, чтобы увидеть распределение.</div>');
    }

    var missing = [];
    var items = ab.expenses.map(function(exp){
      var rate = getRate(ab, exp.currency, display);
      var known = rate!==null;
      if(!known){ rate = 1; if(missing.indexOf(exp.currency)===-1 && exp.currency!==display) missing.push(exp.currency); }
      return {exp: exp, val: exp.amount*rate, known: known};
    });
    var total = items.reduce(function(s,it){ return s+it.val; }, 0);

    var selectorHtml = controlsHtml;

    var rateHtml = '';
    if(missing.length){
      rateHtml = T('<div class="wheel-rate-warning">Не удалось найти курс автоматически — введите вручную:')+
        missing.map(function(c){
          return '<div class="rate-row"><span class="mono">1 '+c+' ('+CURRENCIES[c]+') = </span>'+
            T('<input type="number" step="0.0001" min="0" placeholder="курс" data-act="set-rate" data-from="')+c+'" data-to="'+display+'">'+
            '<span class="mono">'+display+'</span></div>';
        }).join('')+
      '</div>';
    }

    if(total<=0){
      var flatLegend = ab.expenses.map(function(exp){
        var color = COLORS[exp.color] || COLORS.amber;
        return '<div class="wheel-legend-item"><span class="dot" style="background:'+color+'"></span><span>'+escapeHtml(exp.name)+'</span><span class="pct">'+fmtMoney(exp.amount, exp.currency)+'</span></div>';
      }).join('');
      return selectorHtml + rateHtml + ''+
      '<div class="finance-wheel-wrap">'+
        '<div class="wheel-outer" style="background:var(--surface-2);">'+
          T('<div class="wheel-hole"><div class="wheel-total mono" style="font-size:12px;">0</div><div class="mono" style="font-size:10px;color:var(--ink-faint);">пока нечего делить</div></div>')+
        '</div>'+
        '<div class="wheel-legend">'+flatLegend+'</div>'+
      '</div>';
    }

    var cum = 0;
    var stops = [];
    var legend = '';
    items.forEach(function(it){
      var exp = it.exp;
      var color = COLORS[exp.color] || COLORS.amber;
      var pct = it.val/total*100;
      var start = cum;
      cum += pct;
      stops.push(color+' '+start.toFixed(2)+'% '+cum.toFixed(2)+'%');
      var shown = fmtMoney(exp.amount, exp.currency);
      var extra = '';
      if(exp.currency!==display){
        extra = it.known ? (' ≈ '+fmtMoney(it.val, display)) : T(' <span style="color:var(--rose)">— нужен курс</span>');
      }
      legend += ''+
        '<div class="wheel-legend-item">'+
          '<span class="dot" style="background:'+color+'"></span>'+
          '<span>'+escapeHtml(exp.name)+'</span>'+
          '<span class="pct">'+shown+extra+' · '+Math.round(pct)+'%</span>'+
        '</div>';
    });
    var gradient = 'conic-gradient('+stops.join(', ')+')';
    return selectorHtml + rateHtml + ''+
    '<div class="finance-wheel-wrap">'+
      '<div class="wheel-outer" style="background:'+gradient+'">'+
        '<div class="wheel-hole"><div class="wheel-total">'+fmtMoney(total, display)+T('</div><div class="mono" style="font-size:10px;color:var(--ink-faint);">всего</div></div>')+
      '</div>'+
      '<div class="wheel-legend">'+legend+'</div>'+
    '</div>';
  }

  function renderMoneyWheel(ab){
    var curs = currenciesUsed(ab.balances);
    var display = (ab.wheelCurrency && CURRENCY_KEYS.indexOf(ab.wheelCurrency)!==-1) ? ab.wheelCurrency : (curs[0] || DEFAULT_CURRENCY);
    var controlsHtml = ''+
      '<div class="wheel-controls">'+
        T('<label class="mono">Колесо в:</label>')+
        '<select data-act="set-wheel-currency">'+
          CURRENCY_KEYS.map(function(c){ return '<option value="'+c+'"'+(c===display?' selected':'')+'>'+c+' ('+CURRENCIES[c]+')</option>'; }).join('')+
        '</select>'+
        '<button type="button" class="btn small" data-act="refresh-rates" data-to="'+display+T('">Обновить курсы</button>')+
        T('<button type="button" class="btn small" data-act="open-rates">Курсы валют</button>')+
      '</div>';
    if(ab.balances.length===0){
      return controlsHtml + T('<div class="empty" style="padding:24px 10px;"><div class="display">Балансов пока нет</div>Добавьте их через виджет «Баланс» слева.</div>');
    }
    var missing = [];
    var items = ab.balances.map(function(x, idx){
      var rate = getRate(ab, x.currency, display);
      var known = rate!==null;
      if(!known){ rate = 1; if(missing.indexOf(x.currency)===-1 && x.currency!==display) missing.push(x.currency); }
      return {b: x, val: x.amount*rate, known: known, color: COLORS[COLOR_KEYS[idx % COLOR_KEYS.length]]};
    });
    var sum = items.reduce(function(t,it){ return t+it.val; }, 0);
    var pieTotal = items.reduce(function(t,it){ return t+Math.max(0,it.val); }, 0);

    var rateHtml = '';
    if(missing.length){
      rateHtml = T('<div class="wheel-rate-warning">Не удалось найти курс автоматически — введите вручную:')+
        missing.map(function(c){
          return '<div class="rate-row"><span class="mono">1 '+c+' ('+CURRENCIES[c]+') = </span>'+
            T('<input type="number" step="any" min="0" placeholder="курс" data-act="set-rate" data-from="')+c+'" data-to="'+display+'">'+
            '<span class="mono">'+display+'</span></div>';
        }).join('')+
      '</div>';
    }

    var cum = 0, stops = [], legend = '';
    items.forEach(function(it){
      var x = it.b;
      var pct = pieTotal>0 ? Math.max(0,it.val)/pieTotal*100 : 0;
      var start = cum;
      cum += pct;
      if(pct>0) stops.push(it.color+' '+start.toFixed(2)+'% '+cum.toFixed(2)+'%');
      var extra = '';
      if(x.currency!==display){
        extra = it.known ? (' ≈ '+fmtMoney2(it.val, display)) : T(' <span style="color:var(--rose)">— нужен курс</span>');
      }
      var tag = x.kind==='main' ? T('осн.') : T('втор.');
      legend += ''+
        '<div class="wheel-legend-item">'+
          '<span class="dot" style="background:'+it.color+'"></span>'+
          '<span>'+escapeHtml(x.label || T('Без пометки'))+' <span class="dim mono" style="font-size:10px;">'+tag+'</span></span>'+
          '<span class="pct">'+fmtMoney2(x.amount, x.currency)+extra+' · '+Math.round(pct)+'%</span>'+
        '</div>';
    });
    var bg = stops.length ? 'conic-gradient('+stops.join(', ')+')' : 'var(--surface-2)';
    return controlsHtml + rateHtml + ''+
    '<div class="finance-wheel-wrap">'+
      '<div class="wheel-outer" style="background:'+bg+'">'+
        '<div class="wheel-hole"><div class="wheel-total">'+fmtMoney2(sum, display)+T('</div><div class="mono" style="font-size:10px;color:var(--ink-faint);">всего денег</div></div>')+
      '</div>'+
      '<div class="wheel-legend">'+legend+'</div>'+
    '</div>';
  }

  function scheduleDayPicker(){
    var todayDow = todayD().getDay();
    return '<div class="day-toggles" style="margin-bottom:14px;">'+
      DOW_VALUES.map(function(v,idx){
        return '<button type="button" class="day-toggle'+(state.scheduleDay===v?' active':'')+(todayDow===v?' is-today':'')+'" data-act="pick-schedule-day" data-day="'+v+'">'+DOW_LABELS[idx]+'</button>';
      }).join('')+
    '</div>';
  }
  function scheduleRowsFor(ab, ds){
    var rows = [];
    ab.scheduleItems.forEach(function(it){
      it.times.forEach(function(t){
        if(timeOnDate(t, ds)) rows.push({item: it, t: t});
      });
    });
    return rows;
  }
  function selectedDayLabel(ds){
    var d = parseD(ds);
    return DOW_FULL[d.getDay()].charAt(0).toUpperCase()+DOW_FULL[d.getDay()].slice(1)+', '+fmtHumanNoYear(ds)+(ds===fmt(todayD()) ? T(' · сегодня') : '');
  }
  function renderScheduleTable(ab){
    var ds = fmt(dateOfWeekday(state.scheduleDay));
    var rows = scheduleRowsFor(ab, ds);
    rows.sort(function(a,b){ return (a.t.timeStart||'').localeCompare(b.t.timeStart||''); });
    var bodyHtml;
    if(rows.length===0){
      bodyHtml = T('<div class="empty" style="padding:24px 10px;"><div class="display">Пусто</div>На этот день пока ничего не добавлено.</div>');
    } else {
      bodyHtml = T('<table class="schedule-table"><thead><tr><th>Начало</th><th>Конец</th><th>Описание</th></tr></thead><tbody>')+
        rows.map(function(r){
          var it = r.item, t = r.t;
          var color = COLORS[it.color] || COLORS.amber;
          return '<tr data-day="'+t.day+'" data-start="'+(t.timeStart||'')+'" data-end="'+(t.timeEnd||'')+'">'+
            '<td class="mono tm">'+(t.timeStart||'—')+'</td>'+
            '<td class="mono tm">'+(t.timeEnd||'—')+'</td>'+
            taskCellHtml(it, t, color, false, ds)+
          '</tr>';
        }).join('')+
      '</tbody></table>';
    }
    return ''+
    '<div class="finance-wheel-wrap" style="display:block;">'+
      T('<div class="sub" style="margin-bottom:10px;">Выберите день, чтобы увидеть расписание на него</div>')+
      scheduleDayPicker()+
      '<div class="day-caption">'+selectedDayLabel(ds)+'</div>'+
      bodyHtml+
    '</div>';
  }

  function renderPlannerTable(ab){
    var ds = fmt(dateOfWeekday(state.scheduleDay));
    var rows = scheduleRowsFor(ab, ds);
    var byTime = function(a,b){ return (a.t.timeStart||'').localeCompare(b.t.timeStart||''); };
    var pending = rows.filter(function(r){ return !isDoneOn(r.t, ds); }).sort(byTime);
    var done = rows.filter(function(r){ return isDoneOn(r.t, ds); }).sort(byTime);

    function rowHtml(r){
      var it = r.item, t = r.t;
      var dn = isDoneOn(t, ds);
      var color = COLORS[it.color] || COLORS.amber;
      return '<tr class="task-row'+(dn?' is-done':'')+'" data-day="'+t.day+'" data-start="'+(t.timeStart||'')+'" data-end="'+(t.timeEnd||'')+'">'+
        '<td class="chk"><input type="checkbox" class="task-check" data-act="toggle-done" data-item="'+it.id+'" data-time="'+t.id+'" data-date="'+ds+'"'+(dn?' checked':'')+'></td>'+
        '<td class="mono tm">'+(t.timeStart||'—')+'</td>'+
        '<td class="mono tm">'+(t.timeEnd||'—')+'</td>'+
        taskCellHtml(it, t, color, dn, ds)+
      '</tr>';
    }
    function section(title, list){
      return '<tr class="sec-row"><td colspan="4">'+title+' · '+list.length+'</td></tr>'+
        (list.length ? list.map(rowHtml).join('') : T('<tr><td colspan="4" class="dim" style="font-size:13px;">Пусто</td></tr>'));
    }
    var bodyHtml;
    if(rows.length===0){
      bodyHtml = T('<div class="empty" style="padding:24px 10px;"><div class="display">Пусто</div>На этот день пока нет задач.</div>');
    } else {
      var pct = Math.round(done.length/rows.length*100);
      bodyHtml = '<div class="progress-line"><div class="budget-bar"><i style="width:'+pct+'%"></i></div><span>'+done.length+T(' из ')+rows.length+'</span></div>'+
        T('<table class="schedule-table"><thead><tr><th></th><th>Начало</th><th>Конец</th><th>Задача</th></tr></thead><tbody>')+
        section(T('Не выполнено'), pending)+section(T('Выполнено'), done)+
      '</tbody></table>';
    }
    return ''+
    '<div class="finance-wheel-wrap" style="display:block;">'+
      T('<div class="sub" style="margin-bottom:10px;">Выберите день этой недели. Отметки «выполнено» сбрасываются каждый понедельник.</div>')+
      scheduleDayPicker()+
      '<div class="day-caption">'+selectedDayLabel(ds)+'</div>'+
      bodyHtml+
    '</div>';
  }

  function renderAddSubjectModal(){
    var editing = (state.editing && state.editing.kind==='subject') ? activeBoard().subjects.find(function(x){ return x.id===state.editing.id; }) : null;
    var isStatic = editing && editing.planType==='static';
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editing?T('Изменить курс'):T('Новый курс'))+'</h3>'+
        T('<div class="sub">Добавьте занятие и укажите, по каким дням оно проходит</div>')+
        '<form id="add-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          T('<div class="field"><label>Название</label><input type="text" name="name" placeholder="Например, английский" value="')+(editing?escapeHtml(editing.name):'')+'" required></div>'+
          T('<div class="field"><label>Цвет</label><div class="color-picker">')+
            COLOR_KEYS.map(function(k){
              var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
              return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
            }).join('')+
          '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
          T('<div class="field"><label>Дни недели</label><div class="day-toggles">')+
            DOW_VALUES.map(function(v,idx){
              var active = editing && editing.days.indexOf(v)!==-1;
              return '<button type="button" class="day-toggle'+(active?' active':'')+'" data-day="'+v+'">'+DOW_LABELS[idx]+'</button>';
            }).join('')+
          '</div></div>'+
          T('<div class="field"><label>Время (необязательно)</label><div class="field-row">')+
            timeInputHtml('timeStart', editing?editing.timeStart:'')+'<span class="tp-dash">–</span>'+
            timeInputHtml('timeEnd', editing?editing.timeEnd:'')+
          '</div>'+TIME_HINT+'</div>'+
          T('<div class="field"><label>Дата начала</label><input type="date" name="startDate" value="')+(editing?editing.startDate:fmt(todayD()))+'" required></div>'+
          '<div class="field">'+
            T('<label>Тип оплаты</label>')+
            '<div class="toggle-row">'+
              '<button type="button" class="toggle-btn'+(!isStatic?' active':'')+T('" data-plan="dynamic">По урокам</button>')+
              '<button type="button" class="toggle-btn'+(isStatic?' active':'')+T('" data-plan="static">По абонементу</button>')+
            '</div>'+
            '<input type="hidden" name="planType" value="'+(isStatic?'static':'dynamic')+'">'+
          '</div>'+
          '<div class="field" data-plan-field="dynamic" style="'+(isStatic?'display:none;':'')+T('"><label>Количество уроков</label><input type="number" name="total" min="1" value="')+(editing&&!isStatic?editing.total:8)+'"></div>'+
          '<div class="field" data-plan-field="static" style="'+(isStatic?'':'display:none;')+T('"><label>Оплачено до</label><input type="date" name="paidUntil" value="')+(editing&&isStatic?(editing.paidUntil||''):'')+T('"><div class="field-hint">Вместо счётчика уроков будет показываться, до какого числа оплачен курс.</div></div>')+
          '<div class="modal-actions">'+
            T('<button type="button" class="btn" data-act="close-modal">Отмена</button>')+
            '<button type="submit" class="btn primary">'+(editing?T('Сохранить'):T('Создать курс'))+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderAddEventModal(){
    var editing = (state.editing && state.editing.kind==='event') ? activeBoard().events.find(function(x){ return x.id===state.editing.id; }) : null;
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editing?T('Изменить событие'):T('Новое событие'))+'</h3>'+
        T('<div class="sub">Например, день рождения или разовое напоминание</div>')+
        '<form id="add-event-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          T('<div class="field"><label>Название</label><input type="text" name="name" placeholder="Например, день рождения Иры" value="')+(editing?escapeHtml(editing.name):'')+'" required></div>'+
          T('<div class="field"><label>Цвет</label><div class="color-picker">')+
            COLOR_KEYS.map(function(k){
              var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
              return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
            }).join('')+
          '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
          T('<div class="field"><label>Дата</label><input type="date" name="date" value="')+(editing?editing.date:fmt(todayD()))+'" required></div>'+
          '<div class="field">'+
            T('<label class="switch-label"><span>Повторять каждый год</span>')+
              '<input type="checkbox" class="switch" name="yearly"'+(editing&&editing.yearly?' checked':'')+'>'+
            '</label>'+
          '</div>'+
          '<div class="modal-actions">'+
            T('<button type="button" class="btn" data-act="close-modal">Отмена</button>')+
            '<button type="submit" class="btn primary">'+(editing?T('Сохранить'):T('Добавить событие'))+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderLessonDayModal(){
    var ds = state.selectedDate;
    var ab = activeBoard();
    var items = '';
    var any = false;
    ab.subjects.forEach(function(s){
      var info = dayInfo(s, ds);
      if(!info) return;
      any = true;
      var color = COLORS[s.color] || COLORS.amber;
      var timeTag = timeRangeStr(s) ? '<span class="mono" style="font-size:11px; color:var(--ink-dim);">'+timeRangeStr(s)+'</span>' : '';
      var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(s.name)+'</span>'+timeTag+'</div>';
      var body = '';
      if(info.kind==='cancelled'){
        body = T('<div class="status warn">Занятие отменено</div>')+
          '<div class="row-actions"><button class="btn small" data-act="restore" data-subj="'+s.id+'" data-date="'+ds+T('">Восстановить</button></div>');
      } else if(info.kind==='moved-away'){
        body = T('<div class="status">Перенесено на ')+fmtHuman(info.movedTo)+'</div>';
      } else if(info.kind==='moved-done' || info.kind==='moved-upcoming'){
        body = T('<div class="status ok">Перенесено сюда с ')+fmtHuman(info.movedFrom)+'</div>'+
          '<div class="row-actions"><button class="btn small danger" data-act="cancel" data-subj="'+s.id+'" data-date="'+ds+T('">Отменить</button></div>');
      } else {
        var label = info.kind==='done' ? T('Прошло / засчитано') : T('Запланировано');
        var cls = info.kind==='done' ? 'ok' : '';
        body = '<div class="status '+cls+'">'+label+'</div>'+
          '<div class="row-actions">'+
            '<button class="btn small danger" data-act="cancel" data-subj="'+s.id+'" data-date="'+ds+T('">Отменить</button>')+
            '<button class="btn small" data-act="show-resched" data-subj="'+s.id+'" data-date="'+ds+T('">Перенести</button>')+
          '</div>'+
          '<div class="resched-box" data-subj-box="'+s.id+'" data-date-box="'+ds+'" style="display:none;">'+
            '<div class="resched-form">'+
              '<input type="date" class="mono" value="'+ds+'">'+
              '<button class="btn small primary" data-act="confirm-resched" data-subj="'+s.id+'" data-date="'+ds+T('">ОК</button>')+
            '</div>'+
          '</div>';
      }
      items += '<div class="day-item">'+head+body+'</div>';
    });
    if(!any){
      items = T('<div class="empty" style="padding:20px 6px;">На этот день ничего не запланировано.</div>');
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+fmtHuman(ds)+'</h3>'+
        T('<div class="sub">Занятия и действия на этот день</div>')+
        items+
      '</div>'+
    '</div>';
  }

  function renderEventDayModal(){
    var ds = state.selectedDate;
    var ab = activeBoard();
    var items = '';
    var any = false;
    ab.events.forEach(function(ev){
      if(!eventOccursOn(ev, ds)) return;
      any = true;
      var color = COLORS[ev.color] || COLORS.amber;
      var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(ev.name)+'</span></div>';
      var body = (ev.yearly ? T('<div class="status ok">Повторяется каждый год</div>') : T('<div class="status">Разовое событие</div>'))+
        '<div class="row-actions"><button class="btn small danger" data-act="delete-event" data-id="'+ev.id+T('">Удалить</button></div>');
      items += '<div class="day-item">'+head+body+'</div>';
    });
    if(!any){
      items = T('<div class="empty" style="padding:20px 6px;">На этот день ничего не запланировано.</div>');
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+fmtHuman(ds)+'</h3>'+
        T('<div class="sub">События на этот день</div>')+
        items+
      '</div>'+
    '</div>';
  }

  function currencyOptionsHtml(selected){
    return CURRENCY_KEYS.map(function(c){
      return '<option value="'+c+'"'+(c===selected?' selected':'')+'>'+c+' ('+CURRENCIES[c]+')</option>';
    }).join('');
  }

  function renderAddIncomeModal(){
    var editing = (state.editing && state.editing.kind==='income') ? activeBoard().income.find(function(x){ return x.id===state.editing.id; }) : null;
    var isMonthly = editing && editing.scheduleType==='monthly';
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editing?T('Изменить доход'):T('Новый доход'))+'</h3>'+
        T('<div class="sub">Зарплата, инвестиции или другой источник дохода</div>')+
        '<form id="add-income-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          T('<div class="field"><label>Название</label><input type="text" name="name" placeholder="Например, зарплата" value="')+(editing?escapeHtml(editing.name):'')+'" required></div>'+
          '<div class="field-row">'+
            T('<div class="field" style="flex:2;"><label>Сумма</label><input type="number" name="amount" min="0" step="0.01" placeholder="0" value="')+(editing?editing.amount:'')+'" required></div>'+
            T('<div class="field" style="flex:1;"><label>Валюта</label><select name="currency">')+currencyOptionsHtml(editing?editing.currency:DEFAULT_CURRENCY)+'</select></div>'+
          '</div>'+
          T('<div class="field"><label>Цвет</label><div class="color-picker">')+
            COLOR_KEYS.map(function(k){
              var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
              return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
            }).join('')+
          '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
          '<div class="field">'+
            T('<label>Периодичность</label>')+
            '<div class="toggle-row">'+
              '<button type="button" class="toggle-btn'+(!isMonthly?' active':'')+T('" data-schedule="once">Разово</button>')+
              '<button type="button" class="toggle-btn'+(isMonthly?' active':'')+T('" data-schedule="monthly">Ежемесячно</button>')+
            '</div>'+
            '<input type="hidden" name="scheduleType" value="'+(isMonthly?'monthly':'once')+'">'+
          '</div>'+
          '<div class="field" data-schedule-field="once" style="'+(isMonthly?'display:none;':'')+T('"><label>Дата</label><input type="date" name="date" value="')+(editing&&editing.date?editing.date:fmt(todayD()))+'"></div>'+
          '<div class="field" data-schedule-field="monthly" style="'+(isMonthly?'':'display:none;')+T('"><label>Число месяца</label><input type="number" name="dayOfMonth" min="1" max="28" value="')+(editing?editing.dayOfMonth:1)+'"></div>'+
          '<div class="modal-actions">'+
            T('<button type="button" class="btn" data-act="close-modal">Отмена</button>')+
            '<button type="submit" class="btn primary">'+(editing?T('Сохранить'):T('Добавить доход'))+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function subFormRowHtml(s){
    s = s || {};
    var amt = (s.amount===undefined || s.amount===null) ? '' : s.amount;
    return '<div class="sub-form-row"'+(s.id?' data-sub-id="'+s.id+'"':'')+'>'+
      T('<input type="text" class="sf-name" placeholder="Подкатегория этого расхода" value="')+escapeHtml(s.name||'')+'">'+
      T('<input type="number" class="sf-amount" min="0" step="0.01" placeholder="Сумма" value="')+amt+'">'+
      T('<button type="button" class="icon-btn tiny" data-remove-sub title="Убрать">✕</button>')+
    '</div>';
  }

  function renderAddExpenseModal(){
    var editing = (state.editing && state.editing.kind==='expense') ? activeBoard().expenses.find(function(x){ return x.id===state.editing.id; }) : null;
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editing?T('Изменить расход'):T('Новый расход'))+'</h3>'+
        T('<div class="sub">Появится как доля на колесе расходов</div>')+
        '<form id="add-expense-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          T('<div class="field"><label>Название</label><input type="text" name="name" placeholder="Например, аренда" value="')+(editing?escapeHtml(editing.name):'')+'" required></div>'+
          (editing
            ? '<div class="field-row">'+
                T('<div class="field" style="flex:2;"><label>Сумма</label><input type="number" name="amount" min="0" step="0.01" placeholder="0" value="')+editing.amount+'" required></div>'+
                T('<div class="field" style="flex:1;"><label>Валюта</label><select name="currency">')+currencyOptionsHtml(editing.currency)+'</select></div>'+
              '</div>'
            : '<input type="hidden" name="amount" value="0">'+
              T('<div class="field" style="flex:1;"><label>Валюта</label><select name="currency">')+currencyOptionsHtml(DEFAULT_CURRENCY)+'</select>'+
              '<div class="field-hint">'+T('Расход начинается с нуля — траты добавляйте кнопкой «+» на карточке, тогда они попадут в историю и график.')+'</div></div>')+
          T('<div class="field"><label>Бюджет на месяц <span class="dim">(необязательно)</span></label>')+
            T('<input type="number" name="budget" min="0" step="0.01" placeholder="Без лимита" value="')+(editing&&editing.budget?editing.budget:'')+'">'+
            T('<div class="field-hint">Покажем, сколько потрачено в этом месяце через «+», и предупредим, когда лимит близко.</div></div>')+
          (function(){
            var rc = editing && editing.recurring;
            return '<div class="field">'+
              '<label class="switch-label"><span>'+T('Регулярный платёж')+'</span><input type="checkbox" class="switch" name="isRecurring"'+(rc?' checked':'')+'></label>'+
              '<div class="recur-fields" style="'+(rc?'':'display:none;')+'">'+
                '<div class="field-row" style="margin-top:12px;">'+
                  '<div class="field" style="flex:1;"><label>'+T('Сумма платежа')+'</label><input type="number" name="recAmount" min="0" step="0.01" placeholder="0" value="'+(rc?rc.amount:'')+'"></div>'+
                  '<div class="field" style="flex:1;"><label>'+T('Число месяца')+'</label><input type="number" name="recDay" min="1" max="31" value="'+(rc?rc.dayOfMonth:todayD().getDate())+'"></div>'+
                '</div>'+
                '<div class="field-hint">'+T('Аренда, коммуналка, интернет… В этот день приложение спросит «Оплатили?» и спишет сумму со счёта. Если в месяце нет такого числа — платёж будет в последний день.')+'</div>'+
              '</div>'+
            '</div>';
          })()+
          T('<div class="field"><label>Цвет</label><div class="color-picker">')+
            COLOR_KEYS.map(function(k){
              var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
              return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
            }).join('')+
          '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
          '<div class="field">'+
            T('<div class="sub-form-head"><label>Подкатегории <span class="dim">(необязательно)</span></label>')+
              T('<button type="button" class="btn primary" id="sub-add-btn" title="Добавить подкатегорию">+ Подкатегория</button></div>')+
            '<div id="sub-form-rows">'+(editing ? (editing.subs||[]).map(subFormRowHtml).join('') : '')+'</div>'+
            T('<div class="field-hint">Разбивка суммы расхода: например, у «Магазина» — хлеб, молоко. Общую сумму они сами не меняют, а кнопка «+» на подкатегории добавляет трату и в неё, и в расход.</div>')+
          '</div>'+
          '<div class="modal-actions">'+
            T('<button type="button" class="btn" data-act="close-modal">Отмена</button>')+
            '<button type="submit" class="btn primary">'+(editing?T('Сохранить'):T('Добавить расход'))+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderAddScheduleItemModal(){
    var pl = activeBoard().type==='planner';
    var editing = (state.editing && state.editing.kind==='schedule') ? activeBoard().scheduleItems.find(function(x){ return x.id===state.editing.id; }) : null;
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editing ? (pl?T('Изменить задачу'):T('Изменить урок')) : (pl?T('Новая задача'):T('Новый урок')))+'</h3>'+
        T('<div class="sub">Сначала добавьте ')+(pl?T('саму задачу'):T('сам урок'))+T(' — дни и время для ')+(pl?T('неё'):T('него'))+T(' можно будет расставить после, кнопкой «+» на карточке</div>')+
        '<form id="add-schedule-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          T('<div class="field"><label>Название</label><input type="text" name="name" placeholder="')+(pl?T('Например, купить продукты'):T('Например, математика'))+'" value="'+(editing?escapeHtml(editing.name):'')+'" required></div>'+
          T('<div class="field"><label>Цвет</label><div class="color-picker">')+
            COLOR_KEYS.map(function(k){
              var active = editing ? (editing.color===k) : (k===COLOR_KEYS[0]);
              return '<div class="swatch'+(active?' active':'')+'" data-color="'+k+'" style="background:'+COLORS[k]+'"></div>';
            }).join('')+
          '</div><input type="hidden" name="color" value="'+(editing?editing.color:COLOR_KEYS[0])+'"></div>'+
          T('<div class="field"><label>Описание (необязательно)</label><textarea name="notes" placeholder="')+(pl?T('Детали, ссылки, заметки...'):T('Кабинет, преподаватель, детали...'))+'">'+(editing?escapeHtml(editing.notes||''):'')+'</textarea></div>'+
          '<div class="modal-actions">'+
            T('<button type="button" class="btn" data-act="close-modal">Отмена</button>')+
            '<button type="submit" class="btn primary">'+(editing?T('Сохранить'):T('Добавить'))+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderScheduleTimeModal(){
    var ab = activeBoard();
    var editingTime = null, item = null;
    if(state.editing && state.editing.kind==='scheduletime'){
      item = ab.scheduleItems.find(function(x){ return x.id===state.editing.itemId; });
      editingTime = item ? item.times.find(function(t){ return t.id===state.editing.timeId; }) : null;
    } else if(state.scheduleTimeTarget){
      item = ab.scheduleItems.find(function(x){ return x.id===state.scheduleTimeTarget; });
    }
    if(!item) return '';
    var once = !!(editingTime && editingTime.date);
    var defDay = editingTime ? editingTime.day : state.scheduleDay;
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+(editingTime?T('Изменить время'):T('Добавить время'))+'</h3>'+
        '<div class="sub">'+(ab.type==='planner'?T('Для задачи'):T('Для урока'))+' «'+escapeHtml(item.name)+T('» — выберите, когда</div>')+
        '<form id="schedule-time-form">'+
          '<input type="hidden" name="itemId" value="'+item.id+'">'+
          (editingTime?'<input type="hidden" name="timeId" value="'+editingTime.id+'">':'')+
          T('<div class="field"><label>Повтор</label>')+
            '<div class="toggle-row">'+
              '<button type="button" class="toggle-btn'+(!once?' active':'')+T('" data-repeat="weekly">Каждую неделю</button>')+
              '<button type="button" class="toggle-btn'+(once?' active':'')+T('" data-repeat="once">Один раз</button>')+
            '</div>'+
            '<input type="hidden" name="repeat" value="'+(once?'once':'weekly')+'">'+
          '</div>'+
          '<div class="field" data-repeat-field="weekly" style="'+(once?'display:none;':'')+T('"><label>День недели</label><div class="day-toggles">')+
            DOW_VALUES.map(function(v,idx){
              return '<button type="button" class="day-toggle'+(defDay===v?' active':'')+'" data-day="'+v+'">'+DOW_LABELS[idx]+'</button>';
            }).join('')+
          '</div><input type="hidden" name="day" value="'+defDay+'"></div>'+
          '<div class="field" data-repeat-field="once" style="'+(once?'':'display:none;')+T('"><label>Дата</label>')+
            '<input type="date" name="date" value="'+(once ? editingTime.date : fmt(dateOfWeekday(state.scheduleDay) < todayD() ? todayD() : dateOfWeekday(state.scheduleDay)))+'"></div>'+
          T('<div class="field"><label>Время</label><div class="field-row">')+
            timeInputHtml('timeStart', editingTime?editingTime.timeStart:'')+'<span class="tp-dash">–</span>'+
            timeInputHtml('timeEnd', editingTime?editingTime.timeEnd:'')+
          '</div>'+TIME_HINT+'</div>'+
          '<div class="modal-actions">'+
            T('<button type="button" class="btn" data-act="close-modal">Отмена</button>')+
            '<button type="submit" class="btn primary">'+(editingTime?T('Сохранить'):T('Добавить'))+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  // ячейка описания: имя и описание в одну строку, если не влезают — «…» открывает подробности
  function taskCellHtml(it, t, color, strike, ds){
    return '<td class="desc"><div class="task-cell">'+
      '<div class="task-main'+(strike?' task-done':'')+'">'+
        '<div class="task-name"><span class="dot" style="background:'+color+';display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;"></span>'+escapeHtml(it.name)+(t.date ? T(' <span class="tag">разово</span>') : '')+'</div>'+
        (it.notes ? '<div class="task-notes dim">'+escapeHtml(it.notes)+'</div>' : '')+
      '</div>'+
      '<button type="button" class="more-btn" data-act="show-task" data-item="'+it.id+'" data-time="'+t.id+'" data-date="'+(ds||'')+T('" title="Подробнее">…</button>')+
    '</div></td>';
  }

  function updateTruncation(){
    app.querySelectorAll('.task-cell').forEach(function(cell){
      var btn = cell.querySelector('.more-btn');
      if(!btn) return;
      var over = false;
      cell.querySelectorAll('.task-name, .task-notes').forEach(function(el){
        if(el.scrollWidth > el.clientWidth + 1) over = true;
      });
      btn.classList.toggle('on', over);
    });
  }
  function renderTaskDetailModal(){
    var ab = activeBoard();
    var tg = state.detailTarget;
    if(!tg) return '';
    var it = ab.scheduleItems.find(function(x){ return x.id===tg.itemId; });
    var t = it ? it.times.find(function(v){ return v.id===tg.timeId; }) : null;
    if(!t) return '';
    var color = COLORS[it.color] || COLORS.amber;
    var isPl = ab.type==='planner';
    var ds = isValidDs(tg.ds) ? tg.ds : sidebarDateFor(t);
    var when = timeLabel(t) + (t.date ? '' : T(' · каждую неделю'));
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display" style="padding-right:26px;"><span class="dot" style="background:'+color+';display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;"></span>'+escapeHtml(it.name)+'</h3>'+
        '<div class="sub">'+when+(isPl ? ' · '+(isDoneOn(t, ds)?T('выполнено'):T('не выполнено')) : '')+'</div>'+
        T('<div class="section-title" style="margin-top:6px;">Описание</div>')+
        (it.notes ? '<div class="detail-notes">'+escapeHtml(it.notes)+'</div>' : T('<div class="dim" style="font-size:14px;">Описания нет.</div>'))+
        T('<div class="modal-actions"><button type="button" class="btn" data-act="close-modal">Закрыть</button></div>')+
      '</div>'+
    '</div>';
  }

  function renderScheduleDayModal(){
    var ds = state.selectedDate;
    var ab = activeBoard();
    var rows = scheduleRowsFor(ab, ds);
    rows.sort(function(a,b){ return (a.t.timeStart||'').localeCompare(b.t.timeStart||''); });
    var isPl = ab.type==='planner';
    var body = '';
    if(rows.length===0){
      body = T('<div class="empty" style="padding:20px 6px;">На этот день ничего не запланировано.</div>');
    } else {
      rows.forEach(function(r){
        var it = r.item, t = r.t;
        var dn = isDoneOn(t, ds);
        var color = COLORS[it.color] || COLORS.amber;
        var head = '<div class="day-item-head">'+
          (isPl ? '<input type="checkbox" class="task-check" data-act="toggle-done" data-item="'+it.id+'" data-time="'+t.id+'" data-date="'+ds+'"'+(dn?' checked':'')+'>' : '')+
          '<span class="dot" style="background:'+color+'"></span><span class="nm'+(isPl && dn ? ' task-done' : '')+'">'+escapeHtml(it.name)+'</span>'+(t.date ? T('<span class="tag">разово</span>') : '')+'</div>';
        var timeStr = timeRangeStr(t);
        var b2 = (timeStr?'<div class="status">'+timeStr+'</div>':'')+(it.notes?'<div class="status dim">'+escapeHtml(it.notes)+'</div>':'')+
          '<div class="row-actions">'+
            '<button class="btn small" data-act="edit-schedule-time" data-item="'+it.id+'" data-time="'+t.id+T('">Изменить время</button>')+
            '<button class="btn small danger" data-act="delete-schedule-time" data-item="'+it.id+'" data-time="'+t.id+T('">Удалить</button>')+
          '</div>';
        body += '<div class="day-item">'+head+b2+'</div>';
      });
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+fmtHuman(ds)+'</h3>'+
        '<div class="sub">'+(isPl ? T('Задачи на этот день') : T('Расписание на этот день'))+'</div>'+
        body+
      '</div>'+
    '</div>';
  }

  function renderFinanceDayModal(){
    var ds = state.selectedDate;
    var ab = activeBoard();
    var todayStr = fmt(todayD());
    var items = '';
    var any = false;
    ab.income.forEach(function(inc){
      var color = COLORS[inc.color] || COLORS.amber;
      incomeOccsOn(inc, ds).forEach(function(o){
        any = true;
        var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(inc.name)+'</span><span class="mono" style="font-size:12px;color:var(--ink-dim);">'+fmtMoney(inc.amount, inc.currency)+'</span></div>';
        var st = '', acts = '';
        var postponeBtn = '<button class="btn small" data-act="income-postpone" data-id="'+inc.id+'" data-orig="'+o.orig+T('">Перенести</button>');
        if(o.status==='confirmed'){
          st = T('<div class="status ok">Получено</div>');
        } else if(o.status==='skipped'){
          st = T('<div class="status warn">В этот раз не будет</div>');
          acts = '<button class="btn small" data-act="income-unskip" data-id="'+inc.id+'" data-orig="'+o.orig+T('">Вернуть</button>');
        } else if(o.date<=todayStr){
          st = T('<div class="status warn">Ждёт подтверждения</div>');
          acts = '<button class="btn small primary" data-act="income-arrived" data-id="'+inc.id+'" data-orig="'+o.orig+T('">Пришла</button>')+postponeBtn;
        } else {
          st = '<div class="status">'+(inc.scheduleType==='monthly' ? T('Ежемесячная выплата') : T('Разовый доход'))+'</div>';
          acts = postponeBtn;
        }
        if(o.moved) st += T('<div class="status">Перенесено с ')+fmtHuman(o.orig)+'</div>';
        items += '<div class="day-item">'+head+st+(acts ? '<div class="row-actions">'+acts+'</div>' : '')+'</div>';
      });
      (inc.history||[]).filter(function(h){ return h.date===ds; }).forEach(function(h){
        any = true;
        var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(inc.name)+' · '+(h.occ ? T('поступление') : T('пополнение'))+'</span><span class="mono" style="font-size:12px;color:var(--sage);">+'+fmtMoney(h.amount, inc.currency)+'</span></div>';
        var body = '<div class="row-actions"><button class="btn small danger" data-act="delete-transaction" data-kind="income" data-item="'+inc.id+'" data-hist="'+h.id+T('">Удалить запись</button></div>');
        items += '<div class="day-item">'+head+body+'</div>';
      });
    });
    ab.expenses.forEach(function(exp){
      if(!exp.recurring) return;
      var color = COLORS[exp.color] || COLORS.amber;
      incomeOccsOn(exp.recurring, ds).forEach(function(o){
        if(o.status==='confirmed') return;
        any = true;
        var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(exp.name)+'</span><span class="mono" style="font-size:12px;color:var(--ink-dim);">'+fmtMoney(exp.recurring.amount, exp.currency)+'</span></div>';
        var st, acts;
        var pp = '<button class="btn small" data-act="income-postpone" data-kind="expense" data-id="'+exp.id+'" data-orig="'+o.orig+'">'+T('Перенести')+'</button>';
        if(o.status==='skipped'){
          st = '<div class="status warn">'+T('В этот раз не платим')+'</div>';
          acts = '<button class="btn small" data-act="income-unskip" data-kind="expense" data-id="'+exp.id+'" data-orig="'+o.orig+'">'+T('Вернуть')+'</button>';
        } else {
          st = '<div class="status'+(o.date<=todayStr?' warn':'')+'">'+(o.date<=todayStr ? T('Ждёт оплаты') : T('Регулярный платёж'))+'</div>';
          acts = '<button class="btn small primary" data-act="expense-paid" data-id="'+exp.id+'" data-orig="'+o.orig+'">'+T('Оплачено')+'</button>'+pp;
        }
        if(o.moved) st += T('<div class="status">Перенесено с ')+fmtHuman(o.orig)+'</div>';
        items += '<div class="day-item">'+head+st+'<div class="row-actions">'+acts+'</div></div>';
      });
    });
    ab.expenses.forEach(function(exp){
      var color = COLORS[exp.color] || COLORS.amber;
      (exp.history||[]).filter(function(h){ return h.date===ds; }).forEach(function(h){
        any = true;
        var head = '<div class="day-item-head"><span class="dot" style="background:'+color+'"></span><span class="nm">'+escapeHtml(exp.name+histSub(exp,h))+T(' · трата</span><span class="mono" style="font-size:12px;color:var(--rose);">-')+fmtMoney(h.amount, exp.currency)+'</span></div>';
        var body = '<div class="row-actions"><button class="btn small danger" data-act="delete-transaction" data-kind="expense" data-item="'+exp.id+'" data-hist="'+h.id+T('">Удалить запись</button></div>');
        items += '<div class="day-item">'+head+body+'</div>';
      });
    });
    if(!any){
      items = T('<div class="empty" style="padding:20px 6px;">На этот день ничего не запланировано.</div>');
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+fmtHuman(ds)+'</h3>'+
        T('<div class="sub">Финансы за этот день</div>')+
        items+
      '</div>'+
    '</div>';
  }

  function renderBalanceModal(){
    var ab = activeBoard();
    var editing = (state.editing && state.editing.kind==='balance') ? ab.balances.find(function(x){ return x.id===state.editing.id; }) : null;
    function rowHtml(x){
      return ''+
        '<div class="day-item">'+
          '<div class="day-item-head bal-head">'+
            '<span class="nm">'+escapeHtml(x.label || T('Без пометки'))+'</span>'+
            '<span class="bal-amt mono">'+fmtMoney(x.amount, x.currency)+'</span>'+
            '<button type="button" class="bl-plus" data-act="balance-op" data-id="'+x.id+'" title="'+T('Пополнить или перевести')+'" aria-label="'+T('Пополнить или перевести')+'">+</button>'+
          '</div>'+
          '<div class="row-actions">'+
            '<button class="btn small" data-act="edit-balance" data-id="'+x.id+T('">Изменить</button>')+
            '<button class="btn small danger" data-act="delete-balance" data-id="'+x.id+T('">Удалить</button>')+
          '</div>'+
        '</div>';
    }
    var mainRows = '', secRows = '', mainCount = 0;
    ab.balances.forEach(function(x){
      if(x.kind==='main'){ mainRows += rowHtml(x); mainCount++; }
      else secRows += rowHtml(x);
    });
    if(!mainRows) mainRows = T('<div class="empty" style="padding:12px 6px;">Пока нет основных балансов.</div>');
    if(!secRows) secRows = T('<div class="empty" style="padding:12px 6px;">Пока нет второстепенных балансов.</div>');
    var kind = editing ? editing.kind : (mainCount<MAX_MAIN_BALANCES ? 'main' : 'secondary');
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        T('<h3 class="display">Баланс</h3>')+
        '<div class="sub">'+T('Основные счета видны на главном экране, с них списываются траты из быстрого ввода. Второстепенные — наличные в заначке, копилка и т.д.')+'</div>'+
        '<div class="section-title">'+T('Основные балансы')+' <span class="dim">· '+mainCount+'</span></div>'+
        mainRows+
        T('<div class="section-title">Второстепенные балансы</div>')+
        secRows+
        '<div class="drawer-hr"></div>'+
        '<form id="balance-form">'+
          (editing?'<input type="hidden" name="editId" value="'+editing.id+'">':'')+
          T('<div class="field"><label>Тип баланса</label>')+
            '<div class="toggle-row">'+
              '<button type="button" class="toggle-btn'+(kind==='main'?' active':'')+T('" data-balkind="main">Основной</button>')+
              '<button type="button" class="toggle-btn'+(kind==='secondary'?' active':'')+T('" data-balkind="secondary">Второстепенный</button>')+
            '</div>'+
            '<input type="hidden" name="kind" value="'+kind+'">'+
          '</div>'+
          T('<div class="field"><label>Пометка (необязательно)</label><input type="text" name="label" placeholder="Например, карта или наличные" value="')+(editing?escapeHtml(editing.label||''):'')+'"></div>'+
          '<div class="field-row">'+
            T('<div class="field" style="flex:2;"><label>Сумма</label><input type="number" name="amount" min="0" step="0.01" placeholder="0" value="')+(editing?editing.amount:'')+'" required></div>'+
            T('<div class="field" style="flex:1;"><label>Валюта</label><select name="currency">')+currencyOptionsHtml(editing?editing.currency:DEFAULT_CURRENCY)+'</select></div>'+
          '</div>'+
          '<div class="modal-actions">'+
            (editing?T('<button type="button" class="btn" data-act="cancel-edit-balance">Отмена</button>'):'')+
            '<button type="submit" class="btn primary">'+(editing?T('Сохранить'):T('Добавить'))+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderBalanceOpModal(){
    var tg = state.balanceTarget;
    if(!tg) return '';
    var ab = activeBoard();
    var x = ab.balances.find(function(v){ return v.id===tg.id; });
    if(!x) return '';
    var mode = tg.mode==='transfer' ? 'transfer' : 'topup';
    var others = ab.balances.filter(function(v){ return v.id!==x.id; });
    var todayStr = fmt(todayD());
    var cur = CURRENCIES[x.currency] || x.currency;
    var body;
    if(mode==='topup'){
      body = '<div class="field"><label>'+T('Сумма')+' ('+cur+')</label><input type="number" name="amount" min="0.01" step="0.01" inputmode="decimal" placeholder="0" required></div>'+
        '<div class="field"><label>'+T('Комментарий')+' <span class="dim">'+T('(необязательно)')+'</span></label><input type="text" name="note" placeholder="'+T('Например, подарок или возврат долга')+'"></div>';
    } else if(others.length){
      body = '<div class="field"><label>'+T('Куда')+'</label><select name="to">'+
          others.map(function(o){
            var r = getRate(ab, x.currency, o.currency);
            var extra = o.currency===x.currency ? '' : (r!==null ? ' · '+rateText(x.currency, o.currency, r) : ' · '+T('нужен курс'));
            return '<option value="'+o.id+'"'+(r===null?' disabled':'')+'>'+escapeHtml(balLabel(o)+extra)+'</option>';
          }).join('')+'</select></div>'+
        '<div class="field"><label>'+T('Сумма')+' ('+cur+')</label><input type="number" name="amount" min="0.01" step="0.01" inputmode="decimal" placeholder="0" required>'+
          '<div class="field-hint">'+T('Спишется с «')+escapeHtml(x.label || T('счёт'))+T('» и зачислится на выбранный счёт. Это не доход и не расход — в статистику не попадёт.')+'</div></div>';
    } else {
      body = '<div class="empty" style="padding:14px 6px;">'+T('Нужен второй счёт — добавьте его в окне «Баланс».')+'</div>';
    }
    var hist = x.history.slice(-8).reverse().map(function(h){
      var nm = h.kind==='topup' ? T('Пополнение')+(h.note ? ' · '+escapeHtml(h.note) : '') : '';
      if(h.kind==='in' || h.kind==='out'){
        var o = ab.balances.find(function(v){ return v.id===h.other; });
        nm = (h.kind==='in' ? T('Перевод с') : T('Перевод на'))+' «'+escapeHtml(o ? (o.label || T('счёт')) : '?')+'»';
      }
      var plus = h.kind!=='out';
      return '<div class="day-item compact"><div class="day-item-head"><span class="nm">'+nm+'</span>'+
        '<span class="mono" style="font-size:13px;color:'+(plus?'var(--sage)':'var(--rose)')+';">'+(plus?'+':'−')+fmtMoney2(h.amount, x.currency)+'</span></div>'+
        '<div class="row-between"><span class="status">'+fmtHuman(h.date)+'</span>'+
        '<button class="btn small danger" data-act="delete-balance-entry" data-bal="'+x.id+'" data-id="'+h.id+'">'+T('Удалить')+'</button></div></div>';
    }).join('');
    return '<div class="overlay"><div class="modal narrow" data-stop="1">'+
      '<button class="close-x" data-act="close-modal">✕</button>'+
      '<h3 class="display">'+escapeHtml(x.label || T('Счёт'))+'</h3>'+
      '<div class="sub">'+T('Сейчас')+': <b>'+fmtMoney2(x.amount, x.currency)+'</b></div>'+
      '<div class="segmented seg-wide" style="margin-bottom:16px;">'+
        '<button type="button" class="seg-btn'+(mode==='topup'?' active':'')+'" data-act="balance-mode" data-mode="topup">'+T('Пополнить')+'</button>'+
        '<button type="button" class="seg-btn'+(mode==='transfer'?' active':'')+'" data-act="balance-mode" data-mode="transfer">'+T('Перевести')+'</button>'+
      '</div>'+
      '<form id="balance-op-form" data-mode="'+mode+'">'+
        body+
        ((mode==='topup' || others.length) ?
          '<div class="field"><label>'+T('Дата')+'</label><input type="date" name="date" value="'+todayStr+'" required></div>'+
          '<div class="modal-actions">'+
            '<button type="button" class="btn" data-act="close-modal">'+T('Отмена')+'</button>'+
            '<button type="submit" class="btn primary">'+(mode==='topup' ? T('Пополнить') : T('Перевести'))+'</button>'+
          '</div>' : '')+
      '</form>'+
      (hist ? '<div class="section-title">'+T('Последние операции')+'</div>'+hist : '')+
    '</div></div>';
  }

  function accountSelectHtml(ab, currency, emptyHint){
    if(!ab.balances.length){
      return '<div class="field-hint" style="margin-bottom:14px;">'+emptyHint+'</div>';
    }
    return T('<div class="field"><label>Счёт</label><select name="balanceId">')+balanceOptionsHtml(ab, currency, null)+'</select></div>';
  }

  function renderIncomeConfirmModal(){
    var tg = state.incomeTarget;
    if(!tg) return '';
    var ab = activeBoard();
    var inc = ab.income.find(function(x){ return x.id===tg.id; });
    if(!inc) return '';
    var eff = inc.postponed[tg.orig] || tg.orig;
    var todayStr = fmt(todayD());
    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        T('<h3 class="display">Выплата пришла</h3>')+
        '<div class="sub">«'+escapeHtml(inc.name)+T('» за ')+fmtHuman(tg.orig)+(eff!==tg.orig ? T(' (перенесена на ')+fmtHuman(eff)+')' : '')+T('. Проверьте сумму — она зачислится на выбранный счёт.</div>')+
        '<form id="income-confirm-form">'+
          T('<div class="field"><label>Сумма (')+(CURRENCIES[inc.currency]||inc.currency)+')</label><input type="number" name="amount" min="0.01" step="0.01" value="'+inc.amount+'" required></div>'+
          accountSelectHtml(ab, inc.currency, T('Нет счёта в валюте ')+inc.currency+T(' — выплата отметится, но баланс не изменится. Счёт можно добавить через виджет «Баланс».'))+
          T('<div class="field"><label>Дата поступления</label><input type="date" name="date" value="')+(eff<=todayStr ? todayStr : eff)+'" required></div>'+
          '<div class="modal-actions">'+
            T('<button type="button" class="btn" data-act="close-modal">Отмена</button>')+
            T('<button type="submit" class="btn primary">Зачислить</button>')+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderIncomePostponeModal(){
    var tg = state.incomeTarget;
    if(!tg) return '';
    var ab = activeBoard();
    var isExp = tg.kind==='expense';
    var inc = isExp ? ab.expenses.find(function(x){ return x.id===tg.id; }) : ab.income.find(function(x){ return x.id===tg.id; });
    var sch = isExp ? (inc && inc.recurring) : inc;
    if(!inc || !sch) return '';
    var eff = sch.postponed[tg.orig] || tg.orig;
    var base = parseD(eff) < todayD() ? todayD() : parseD(eff);
    if(isExp){
      return '<div class="overlay"><div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        '<h3 class="display">'+T('Перенести платёж')+'</h3>'+
        '<div class="sub">«'+escapeHtml(inc.name)+'» '+T('был запланирован на')+' '+fmtHuman(eff)+'. '+T('Выберите новую дату — в этот день приложение снова спросит об оплате.')+'</div>'+
        '<form id="income-postpone-form">'+
          T('<div class="field"><label>Новая дата</label><input type="date" name="date" value="')+fmt(addDays(base,1))+'" required></div>'+
          '<div class="quick-dates">'+
            [1,3,7].map(function(n){ return '<button type="button" class="btn small" data-quick-days="'+n+'">+'+n+' '+plural(n,T('день'),T('дня'),T('дней'))+'</button>'; }).join('')+
          '</div>'+
          '<div class="modal-actions spread">'+
            '<button type="button" class="btn danger" data-act="income-skip">'+T('В этот раз не платим')+'</button>'+
            T('<button type="submit" class="btn primary">Перенести</button>')+
          '</div>'+
        '</form>'+
      '</div></div>';
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        T('<h3 class="display">Перенести выплату</h3>')+
        '<div class="sub">«'+escapeHtml(inc.name)+T('» ожидалась ')+fmtHuman(eff)+T('. Выберите новую дату — в этот день приложение снова спросит, пришли ли деньги.</div>')+
        '<form id="income-postpone-form">'+
          T('<div class="field"><label>Новая дата</label><input type="date" name="date" value="')+fmt(addDays(base,1))+'" required></div>'+
          '<div class="quick-dates">'+
            [1,3,7].map(function(n){ return '<button type="button" class="btn small" data-quick-days="'+n+'">+'+n+' '+plural(n,T('день'),T('дня'),T('дней'))+'</button>'; }).join('')+
          '</div>'+
          '<div class="modal-actions spread">'+
            T('<button type="button" class="btn danger" data-act="income-skip">В этот раз не будет</button>')+
            T('<button type="submit" class="btn primary">Перенести</button>')+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderExpensePayModal(){
    var tg = state.incomeTarget;
    if(!tg) return '';
    var ab = activeBoard();
    var exp = ab.expenses.find(function(x){ return x.id===tg.id; });
    if(!exp || !exp.recurring) return '';
    var rc = exp.recurring;
    var eff = rc.postponed[tg.orig] || tg.orig;
    var todayStr = fmt(todayD());
    var selId = rc.balanceId ? rc.balanceId : (Object.keys(rc.confirmed).length ? '' : null);
    var acc = ab.balances.length
      ? '<div class="field"><label>'+T('Списать со счёта')+'</label><select name="balanceId">'+balanceOptionsHtml(ab, exp.currency, selId, T('Не списывать со счёта'))+'</select></div>'
      : '<div class="field-hint" style="margin-bottom:14px;">'+T('Нет счёта в этой валюте — платёж отметится, но баланс не изменится.')+'</div>';
    return '<div class="overlay"><div class="modal narrow" data-stop="1">'+
      '<button class="close-x" data-act="close-modal">✕</button>'+
      '<h3 class="display">'+T('Оплата')+' «'+escapeHtml(exp.name)+'»</h3>'+
      '<div class="sub">'+T('Платёж за')+' '+fmtHuman(tg.orig)+(eff!==tg.orig ? ' ('+T('перенесён на')+' '+fmtHuman(eff)+')' : '')+'. '+T('Проверьте сумму — она спишется с выбранного счёта.')+'</div>'+
      '<form id="expense-pay-form">'+
        '<div class="field"><label>'+T('Сумма')+' ('+(CURRENCIES[exp.currency]||exp.currency)+')</label><input type="number" name="amount" min="0.01" step="0.01" value="'+rc.amount+'" required></div>'+
        acc+
        '<div class="field"><label>'+T('Дата оплаты')+'</label><input type="date" name="date" value="'+(eff<=todayStr ? todayStr : eff)+'" required></div>'+
        '<div class="modal-actions">'+
          '<button type="button" class="btn" data-act="close-modal">'+T('Отмена')+'</button>'+
          '<button type="submit" class="btn primary">'+T('Оплачено')+'</button>'+
        '</div>'+
      '</form>'+
    '</div></div>';
  }

  // регулярные расходы: что ждёт оплаты и что скоро
  function expensePromptRows(b){
    var rows = [];
    b.expenses.forEach(function(exp){
      if(!exp.recurring) return;
      pendingIncomeOccs(exp.recurring).forEach(function(o){ rows.push({exp: exp, o: o}); });
    });
    return rows;
  }
  function expenseSoonRows(b){
    var t = todayD(), rows = [];
    b.expenses.forEach(function(exp){
      if(!exp.recurring) return;
      incomeOccs(exp.recurring, addDays(t,1), addDays(t,3)).forEach(function(o){ if(o.status==='pending') rows.push({exp: exp, o: o}); });
    });
    return rows;
  }
  function renderExpensePromptRow(r, boardId){
    var dl = daysUntil(r.o.date);
    var when = dl===0 ? T('Сегодня день оплаты') : T('Платёж был')+' '+fmtHumanNoYear(r.o.date);
    var bAttr = boardId ? ' data-board="'+boardId+'"' : '';
    var color = COLORS[r.exp.color] || COLORS.amber;
    return '<div class="notice-row">'+
      '<div class="notice-text"><span class="dot" style="background:'+color+'"></span><div><b>'+escapeHtml(r.exp.name)+'</b> · '+fmtMoney(r.exp.recurring.amount, r.exp.currency)+
        '<div class="notice-sub">'+when+' — '+T('оплатили?')+'</div></div></div>'+
      '<div class="notice-actions">'+
        '<button class="btn small" data-act="income-postpone" data-kind="expense" data-id="'+r.exp.id+'" data-orig="'+r.o.orig+'"'+bAttr+'>'+T('Перенести')+'</button>'+
        '<button class="btn small primary" data-act="expense-paid" data-id="'+r.exp.id+'" data-orig="'+r.o.orig+'"'+bAttr+'>'+T('Оплачено')+'</button>'+
      '</div>'+
    '</div>';
  }
  function renderExpenseSoonRow(r){
    var color = COLORS[r.exp.color] || COLORS.amber;
    return '<div class="notice-row"><div class="notice-text"><span class="dot" style="background:'+color+'"></span><div><b>'+escapeHtml(r.exp.name)+'</b> · '+fmtMoney(r.exp.recurring.amount, r.exp.currency)+
      '<div class="notice-sub">'+T('Платёж')+' '+inDaysText(daysUntil(r.o.date))+', '+fmtHumanNoYear(r.o.date)+'</div></div></div></div>';
  }
  function renderExpensePrompts(ab){
    var due = expensePromptRows(ab), soon = expenseSoonRows(ab);
    if(!due.length && !soon.length) return '';
    return '<div class="notice'+(due.length?'':' warn')+'"><div class="notice-title">'+(due.length ? T('Подтвердите оплату') : T('Скоро платёж'))+'</div>'+
      due.map(function(r){ return renderExpensePromptRow(r); }).join('')+soon.map(renderExpenseSoonRow).join('')+'</div>';
  }

  // плашка «Зарплата пришла?» над карточками финансов (и в сводке)
  function incomePromptRows(b){
    var rows = [];
    b.income.forEach(function(inc){
      pendingIncomeOccs(inc).forEach(function(o){ rows.push({inc: inc, o: o}); });
    });
    return rows;
  }
  function renderIncomePromptRow(r, boardId){
    var dl = daysUntil(r.o.date);
    var when = dl===0 ? T('Сегодня день выплаты') : (dl===-1 ? T('Ожидалась вчера') : T('Ожидалась ')+fmtHumanNoYear(r.o.date));
    var bAttr = boardId ? ' data-board="'+boardId+'"' : '';
    var color = COLORS[r.inc.color] || COLORS.amber;
    return '<div class="notice-row">'+
      '<div class="notice-text"><span class="dot" style="background:'+color+'"></span><div><b>'+escapeHtml(r.inc.name)+'</b> · '+fmtMoney(r.inc.amount, r.inc.currency)+
        '<div class="notice-sub">'+when+T(' — пришла?</div></div></div>')+
      '<div class="notice-actions">'+
        '<button class="btn small" data-act="income-postpone" data-id="'+r.inc.id+'" data-orig="'+r.o.orig+'"'+bAttr+T('>Перенести</button>')+
        '<button class="btn small primary" data-act="income-arrived" data-id="'+r.inc.id+'" data-orig="'+r.o.orig+'"'+bAttr+T('>Пришла</button>')+
      '</div>'+
    '</div>';
  }
  function renderIncomePrompts(ab){
    var rows = incomePromptRows(ab);
    var exp = renderExpensePrompts(ab);
    if(!rows.length) return exp;
    return T('<div class="notice"><div class="notice-title">Подтвердите поступление</div>')+rows.map(function(r){ return renderIncomePromptRow(r); }).join('')+'</div>'+exp;
  }

  function renderRecurringLine(exp){
    var rc = exp.recurring;
    if(!rc) return '';
    var pend = pendingIncomeOccs(rc).length;
    var t = todayD();
    var nx = incomeOccs(rc, addDays(t,1), addDays(t,400)).filter(function(o){ return o.status==='pending'; })[0];
    return '<div class="recur-line"><span class="recur-ico">↻</span><div>'+
      T('Регулярно')+': <b>'+fmtMoney(rc.amount, exp.currency)+'</b> · '+rc.dayOfMonth+T('-го числа')+
      '<div class="recur-sub">'+(pend ? '<span class="warn">'+T('Ждёт оплаты')+'</span>' : (nx ? T('Следующий платёж')+': '+fmtHumanNoYear(nx.date)+' · '+inDaysText(daysUntil(nx.date)) : ''))+'</div>'+
    '</div></div>';
  }

  // бюджет категории на текущий месяц
  function renderBudgetBlock(exp){
    if(!(exp.budget>0)) return '';
    var spent = spentInMonth(exp, monthKeyOf(fmt(todayD())));
    var pct = spent/exp.budget*100;
    var cls = pct>100 ? ' over' : (pct>=80 ? ' warn' : '');
    var text = pct>100
      ? T('Превышен на <b>')+fmtMoney2(spent-exp.budget, exp.currency)+'</b>'
      : T('Осталось <b>')+fmtMoney2(exp.budget-spent, exp.currency)+'</b>';
    return '<div class="budget'+cls+'">'+
      T('<div class="budget-top"><span>В этом месяце ')+fmtMoney2(spent, exp.currency)+T(' из ')+fmtMoney2(exp.budget, exp.currency)+'</span><span>'+Math.round(pct)+'%</span></div>'+
      '<div class="budget-bar"><i style="width:'+Math.min(100, pct).toFixed(1)+'%"></i></div>'+
      '<div class="budget-text">'+text+'</div>'+
    '</div>';
  }

  // доходы и расходы за последние 6 месяцев
  function renderMonthlyStats(ab){
    var display = (ab.wheelCurrency && CURRENCY_KEYS.indexOf(ab.wheelCurrency)!==-1) ? ab.wheelCurrency
      : (currenciesUsed(ab.balances.concat(ab.income, ab.expenses))[0] || DEFAULT_CURRENCY);
    var t = todayD();
    var months = [], idx = {};
    for(var i=5;i>=0;i--){
      var d = new Date(t.getFullYear(), t.getMonth()-i, 1);
      idx[fmt(d).slice(0,7)] = months.length;
      months.push({label: MONTH_SHORT[d.getMonth()], inc: 0, exp: 0});
    }
    var missing = [];
    function add(list, field){
      list.forEach(function(item){
        var rate = getRate(ab, item.currency, display);
        (item.history||[]).forEach(function(h){
          var k = monthKeyOf(h.date);
          if(!(k in idx)) return;
          if(rate===null){ if(missing.indexOf(item.currency)===-1) missing.push(item.currency); return; }
          months[idx[k]][field] += (Number(h.amount)||0) * rate;
        });
      });
    }
    add(ab.income, 'inc');
    add(ab.expenses, 'exp');
    var max = 0;
    months.forEach(function(m){ max = Math.max(max, m.inc, m.exp); });
    var cur = months[months.length-1];
    var head = T('<div class="stats-head"><div class="stats-title">Последние 6 месяцев</div>')+
      T('<div class="stats-legend"><span><i class="lg-inc"></i>Доходы</span><span><i class="lg-exp"></i>Расходы</span></div></div>');
    if(max<=0){
      return '<div class="finance-wheel-wrap stats">'+head+
        T('<div class="empty" style="padding:18px 6px;">Здесь появится график, когда вы начнёте добавлять суммы через «+» или подтверждать выплаты.</div></div>');
    }
    var bars = months.map(function(m, i){
      var hi = m.inc/max*100, he = m.exp/max*100;
      return '<div class="stat-col'+(i===months.length-1 ? ' current' : '')+'">'+
        '<div class="stat-bars">'+
          '<i class="stat-bar inc" style="height:'+hi.toFixed(1)+T('%" title="Доходы: ')+escapeHtml(fmtMoney2(m.inc, display))+'"></i>'+
          '<i class="stat-bar exp" style="height:'+he.toFixed(1)+T('%" title="Расходы: ')+escapeHtml(fmtMoney2(m.exp, display))+'"></i>'+
        '</div>'+
        '<div class="stat-label">'+m.label+'</div>'+
      '</div>';
    }).join('');
    var net = cur.inc - cur.exp;
    var summary = '<div class="stats-summary">'+
      T('<div><span>Доходы</span><b class="pos">')+fmtMoney2(cur.inc, display)+'</b></div>'+
      T('<div><span>Расходы</span><b class="neg">')+fmtMoney2(cur.exp, display)+'</b></div>'+
      T('<div><span>Итог месяца</span><b>')+(net>=0?'+':'−')+fmtMoney2(Math.abs(net), display)+'</b></div>'+
    '</div>';
    return '<div class="finance-wheel-wrap stats">'+head+summary+'<div class="stat-chart">'+bars+'</div>'+
      T('<div class="field-hint">Учитываются операции с датой: суммы через «+», подтверждённые выплаты и оплаты курсов. Сумму, вписанную в карточку вручную, график не видит.</div>')+
      (missing.length ? T('<div class="field-hint">Без курса не учтены: ')+missing.join(', ')+T('. Добавьте курс в «Курсы валют».</div>') : '')+
    '</div>';
  }

  function renderTransactionModal(){
    var t = state.transactionTarget;
    if(!t) return '';
    var ab = activeBoard();
    var list = t.kind==='income' ? ab.income : ab.expenses;
    var item = list.find(function(x){ return x.id===t.id; });
    if(!item) return '';
    var tSub = (t.kind==='expense' && t.subId) ? (item.subs||[]).find(function(s){ return s.id===t.subId; }) : null;
    var verb = t.kind==='income' ? T('доходу') : T('расходу');
    var effect = t.kind==='income' ? T('прибавится к выбранному счёту') : T('спишется с выбранного счёта');
    var accountField;
    if(ab.balances.length){
      // по умолчанию — счёт, с которого платили в эту категорию в прошлый раз
      var lastBal = null;
      (item.history||[]).slice().reverse().some(function(h){ if(h.balanceId){ lastBal = h.balanceId; return true; } return false; });
      accountField = T('<div class="field"><label>Счёт</label><select name="balanceId">')+balanceOptionsHtml(ab, item.currency, lastBal)+'</select></div>';
    } else {
      accountField = T('<div class="field-hint" style="margin-bottom:14px;">Нет счёта в валюте ')+item.currency+T(' — сумма добавится к карточке, но баланс не изменится. Можно добавить счёт через «Баланс» в меню.</div>');
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        T('<h3 class="display">Добавить сумму</h3>')+
        '<div class="sub">'+(tSub
          ? T('К подкатегории «')+escapeHtml(tSub.name)+T('» (расход «')+escapeHtml(item.name)+T('»), сейчас ')+fmtMoney(tSub.amount, item.currency)+T('. Сумма ')+effect+T(' и добавится к общей сумме расхода.')
          : T('К «')+escapeHtml(item.name)+'» ('+verb+T('), сейчас ')+fmtMoney(item.amount, item.currency)+T('. Сумма ')+effect+'.')+'</div>'+
        '<form id="transaction-form">'+
          T('<div class="field"><label>Сумма (')+(CURRENCIES[item.currency]||item.currency)+')</label><input type="number" name="amount" min="0.01" step="0.01" placeholder="0" required></div>'+
          accountField+
          '<div class="field"><label>'+(t.kind==='income' ? T('Дата поступления') : T('Дата траты'))+'</label><input type="date" name="date" value="'+fmt(todayD())+'" required></div>'+
          '<div class="modal-actions">'+
            T('<button type="button" class="btn" data-act="close-modal">Отмена</button>')+
            T('<button type="submit" class="btn primary">Добавить</button>')+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderRatesModal(){
    var ab = activeBoard();
    var keys = Object.keys(ab.rates);
    var rows = keys.map(function(k){
      var parts = k.split('_');
      var from = parts[0], to = parts[1];
      return ''+
        '<div class="day-item">'+
          '<div class="day-item-head"><span class="nm mono">1 '+from+' = '+fmtRate(ab.rates[k])+' '+to+'</span></div>'+
          '<div class="row-actions">'+
            '<button class="btn small" data-act="edit-rate" data-key="'+k+T('">Изменить</button>')+
            '<button class="btn small danger" data-act="delete-rate" data-key="'+k+T('">Удалить</button>')+
          '</div>'+
        '</div>';
    }).join('');
    if(!rows){
      rows = T('<div class="empty" style="padding:16px 6px;">Пока нет сохранённых курсов.</div>');
    }
    var editingKey = (state.editing && state.editing.kind==='rate') ? state.editing.key : null;
    var editParts = editingKey ? editingKey.split('_') : null;
    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        T('<h3 class="display">Курсы валют</h3>')+
        T('<div class="sub">Сохранённые курсы конвертации для колеса расходов</div>')+
        rows+
        '<div class="drawer-hr"></div>'+
        '<form id="rate-form">'+
          (editingKey?'<input type="hidden" name="oldKey" value="'+editingKey+'">':'')+
          '<div class="field-row">'+
            T('<div class="field" style="flex:1;"><label>Из</label><select name="from">')+currencyOptionsHtml(editParts?editParts[0]:CURRENCY_KEYS[0])+'</select></div>'+
            T('<div class="field" style="flex:1;"><label>В</label><select name="to">')+currencyOptionsHtml(editParts?editParts[1]:CURRENCY_KEYS[1])+'</select></div>'+
          '</div>'+
          T('<div class="field"><label>Курс (1 «Из» = ? «В»)</label><input type="number" step="any" min="0" name="value" value="')+(editingKey?fmtRate(ab.rates[editingKey]):'')+'" required></div>'+
          '<div class="modal-actions">'+
            (editingKey?T('<button type="button" class="btn" data-act="cancel-edit-rate">Отмена</button>'):'')+
            '<button type="submit" class="btn primary">'+(editingKey?T('Сохранить'):T('Добавить курс'))+'</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderTransactionHistoryModal(){
    var ab = activeBoard();
    var all = [];
    ab.income.forEach(function(inc){
      (inc.history||[]).forEach(function(h){
        all.push({kind:'income', itemId:inc.id, name:inc.name, color:inc.color, currency:inc.currency, h:h});
      });
    });
    ab.expenses.forEach(function(exp){
      (exp.history||[]).forEach(function(h){
        all.push({kind:'expense', itemId:exp.id, name:exp.name+histSub(exp,h), color:exp.color, currency:exp.currency, h:h});
      });
    });
    ab.balances.forEach(function(x){
      x.history.forEach(function(h){
        if(h.kind==='in') return; // перевод показываем один раз — со стороны списания
        var nm;
        if(h.kind==='out'){
          var o = ab.balances.find(function(v){ return v.id===h.other; });
          nm = T('Перевод')+' «'+(x.label || T('счёт'))+'» → «'+(o ? (o.label || T('счёт')) : '?')+'»';
        } else nm = T('Пополнение')+' «'+(x.label || T('счёт'))+'»'+(h.note ? ' · '+h.note : '');
        all.push({kind: h.kind==='out' ? 'transfer' : 'topup', balId: x.id, itemId: '', name: nm, color: '', currency: x.currency, h: h});
      });
    });
    all.sort(function(a,b){ return a.h.date < b.h.date ? 1 : (a.h.date > b.h.date ? -1 : 0); });
    var rows = all.map(function(t){
      if(t.kind==='topup' || t.kind==='transfer'){
        return '<div class="day-item"><div class="day-item-head">'+
            '<span class="dot bal-dot">'+(t.kind==='topup' ? '+' : '⇄')+'</span>'+
            '<span class="nm">'+escapeHtml(t.name)+'</span>'+
            '<span class="mono" style="font-size:11px;color:'+(t.kind==='topup'?'var(--sage)':'var(--ink-dim)')+';">'+(t.kind==='topup'?'+':'')+fmtMoney(t.h.amount, t.currency)+'</span>'+
          '</div>'+
          '<div class="status">'+fmtHuman(t.h.date)+'</div>'+
          '<div class="row-actions"><button class="btn small danger" data-act="delete-balance-entry" data-bal="'+t.balId+'" data-id="'+t.h.id+'">'+T('Удалить')+'</button></div>'+
        '</div>';
      }
      var color = COLORS[t.color] || COLORS.amber;
      var sign = t.kind==='income' ? '+' : '-';
      var signColor = t.kind==='income' ? 'var(--sage)' : 'var(--rose)';
      return ''+
        '<div class="day-item">'+
          '<div class="day-item-head">'+
            '<span class="dot" style="background:'+color+'"></span>'+
            '<span class="nm">'+escapeHtml(t.name)+'</span>'+
            '<span class="mono" style="font-size:11px;color:'+signColor+';">'+sign+fmtMoney(t.h.amount, t.currency)+'</span>'+
          '</div>'+
          '<div class="status">'+fmtHuman(t.h.date)+'</div>'+
          '<div class="row-actions"><button class="btn small danger" data-act="delete-transaction" data-kind="'+t.kind+'" data-item="'+t.itemId+'" data-hist="'+t.h.id+T('">Удалить</button></div>')+
        '</div>';
    }).join('');
    if(!rows){
      rows = T('<div class="empty" style="padding:16px 6px;">Пока нет ни одной транзакции.</div>');
    }
    return ''+
    '<div class="overlay">'+
      '<div class="modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        T('<h3 class="display">История транзакций</h3>')+
        T('<div class="sub">Все пополнения и траты по карточкам этой доски, от новых к старым</div>')+
        rows+
      '</div>'+
    '</div>';
  }

  function renderMenuDrawer(){
    var boardsHtml = state.boards.map(function(b){
      var active = b.id===state.activeBoardId;
      var tag = '<span class="mono dim" style="font-size:10px;">'+BOARD_TYPE_LABELS[b.type]+'</span>';
      return '<div class="board-row'+(active?' active':'')+'">'+
        '<button class="board-name" data-act="switch-board" data-id="'+b.id+'">'+escapeHtml(b.name)+' '+tag+'</button>'+
        '<span class="board-actions">'+
          '<button class="icon-btn tiny" data-act="rename-board" data-id="'+b.id+T('" title="Переименовать">')+iconSvg('edit')+'</button>'+
          '<button class="icon-btn tiny" data-act="clone-board" data-id="'+b.id+T('" title="Клонировать">')+iconSvg('copy')+'</button>'+
          (state.boards.length>1 ? '<button class="icon-btn tiny" data-act="delete-board" data-id="'+b.id+T('" title="Удалить доску">')+iconSvg('x')+'</button>' : '')+
        '</span>'+
      '</div>';
    }).join('');

    var typePickerOptions = '';
    if(state.boardTypePickerOpen){
      typePickerOptions = '<div class="board-type-options">'+
        BOARD_TYPES.map(function(t){
          return '<button type="button" class="toggle-btn'+(state.newBoardType===t?' active':'')+'" data-boardtype="'+t+'">'+BOARD_TYPE_LABELS[t]+'</button>';
        }).join('')+
      '</div>';
    }

    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow" data-stop="1">'+
        '<button class="close-x" data-act="close-menu">✕</button>'+
        T('<h3 class="display">Доски</h3>')+
        T('<div class="sub">Переключайтесь между календарями или создайте новый</div>')+
        '<div class="board-list">'+boardsHtml+'</div>'+
        '<div class="drawer-hr"></div>'+
        '<div class="field">'+
          T('<label>Новая доска</label>')+
          '<button type="button" class="btn" style="width:100%;justify-content:space-between;display:flex;" data-act="toggle-boardtype-picker">'+
            T('<span>Выбрать тип доски: ')+BOARD_TYPE_LABELS[state.newBoardType]+'</span><span>'+(state.boardTypePickerOpen?'▲':'▼')+'</span>'+
          '</button>'+
          typePickerOptions+
          T('<div class="field-row" style="margin-top:10px;"><input type="text" id="new-board-name" placeholder="Название доски"><button class="btn primary" data-act="create-board">+</button></div>')+
        '</div>'+
        '<div class="drawer-hr"></div>'+
        T('<button type="button" class="btn" style="width:100%;" data-act="open-settings">⚙ Настройки</button>')+
      '</div>'+
    '</div>';
  }

  function renderConfirmDeleteCardModal(){
    var c = state.confirmCard;
    if(!c) return '';
    var ab = activeBoard();
    var byId = function(list){ return list.find(function(x){ return x.id===c.id; }); };
    var item = null, title = T('Удалить?'), extra = '';
    if(c.kind==='subject'){ item = byId(ab.subjects); title = T('Удалить курс?'); }
    else if(c.kind==='event'){ item = byId(ab.events); title = T('Удалить событие?'); }
    else if(c.kind==='income'){
      item = byId(ab.income); title = T('Удалить доход?');
      if(item && item.history && item.history.length) extra = T(' История транзакций карточки тоже удалится, баланс при этом не изменится.');
    }
    else if(c.kind==='expense'){
      item = byId(ab.expenses); title = T('Удалить расход?');
      if(item && item.history && item.history.length) extra = T(' История транзакций карточки тоже удалится, баланс при этом не изменится.');
    }
    else if(c.kind==='schedule'){ item = byId(ab.scheduleItems); title = ab.type==='planner' ? T('Удалить задачу?') : T('Удалить урок?'); }
    if(!item) return '';
    return ''+
    '<div class="overlay">'+
      '<div class="modal alert" data-stop="1">'+
        '<h3 class="display">'+title+'</h3>'+
        T('<div class="sub">Вы точно хотите удалить «')+escapeHtml(item.name)+T('»? Это действие нельзя отменить.')+extra+'</div>'+
        '<div class="modal-actions">'+
          T('<button type="button" class="btn" data-act="cancel-dialog">Нет</button>')+
          T('<button type="button" class="btn danger" data-act="confirm-delete-card">Да</button>')+
        '</div>'+
      '</div>'+
    '</div>';
  }

  function renderConfirmDeleteBoardModal(){
    var b = state.boards.find(function(x){ return x.id===state.confirmDeleteId; });
    if(!b) return '';
    return ''+
    '<div class="overlay">'+
      '<div class="modal alert" data-stop="1">'+
        T('<h3 class="display">Удалить доску?</h3>')+
        T('<div class="sub">Вы точно хотите удалить эту доску? «')+escapeHtml(b.name)+T('» и все её данные будут удалены без возможности восстановления.</div>')+
        '<div class="modal-actions">'+
          T('<button type="button" class="btn" data-act="cancel-dialog">Нет</button>')+
          T('<button type="button" class="btn danger" data-act="confirm-delete-board">Да</button>')+
        '</div>'+
      '</div>'+
    '</div>';
  }
  function renderRenameBoardModal(){
    var b = state.boards.find(function(x){ return x.id===state.renameBoardId; });
    if(!b) return '';
    return ''+
    '<div class="overlay">'+
      '<div class="modal alert" data-stop="1">'+
        '<button class="close-x" data-act="cancel-dialog">✕</button>'+
        T('<h3 class="display">Название доски</h3>')+
        T('<div class="sub">Введите новое название</div>')+
        '<form id="rename-board-form">'+
          '<div class="field"><input type="text" name="name" value="'+escapeHtml(b.name)+'" required></div>'+
          '<div class="modal-actions">'+
            T('<button type="button" class="btn" data-act="cancel-dialog">Отмена</button>')+
            T('<button type="submit" class="btn primary">Сохранить</button>')+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function renderSettingsModal(){
    var th = state.theme;
    var privStartOn = (function(){ try{ return localStorage.getItem(PRIV_START_KEY)==='1'; }catch(e){ return false; } })();
    var group = function(title, inner){ return '<div class="set-group"><div class="set-title">'+title+'</div><div class="set-box">'+inner+'</div></div>'; };
    var row = function(label, control, hint){ return '<div class="set-row"><div class="set-label">'+label+'</div>'+control+(hint ? '<div class="field-hint">'+hint+'</div>' : '')+'</div>'; };
    var seg = function(items, cur, act, key){
      return '<div class="toggle-row">'+items.map(function(o){
        return '<button type="button" class="toggle-btn'+(cur===o[0]?' active':'')+'" data-act="'+act+'" data-'+key+'="'+o[0]+'">'+o[1]+'</button>';
      }).join('')+'</div>';
    };
    return ''+
    '<div class="overlay">'+
      '<div class="modal narrow settings-modal" data-stop="1">'+
        '<button class="close-x" data-act="close-modal">✕</button>'+
        T('<h3 class="display">Настройки</h3>')+

        group(T('Оформление'),
          row(T('Тема'), seg([['dark', T('Тёмная')], ['light', T('Светлая')], ['auto', T('Как в системе')]], th, 'set-theme', 'theme'))+
          row(T('Язык'),
            '<select id="lang-select">'+
              [['auto', T('Как в системе')], ['ru','Русский'], ['uk','Українська'], ['en','English']].map(function(o){
                return '<option value="'+o[0]+'"'+(LANG_PREF===o[0]?' selected':'')+'>'+o[1]+'</option>';
              }).join('')+
            '</select>', T('После смены языка страница перезагрузится.'))+
          row(T('Анимации'), seg([['full', T('Все')], ['lite', T('Упрощённые')], ['off', T('Выключены')]], animMode(), 'set-anim', 'anim'),
            T('«Упрощённые» убирают размытие фона и анимации появления — меньше нагрузки на слабых телефонах. «Выключены» — всё меняется мгновенно.'))
        )+

        group(T('При запуске'),
          '<label class="set-switch"><span>'+T('Скрывать суммы при запуске')+'<small>'+T('Все суммы заменяются на «••••». Кнопка с глазом в шапке включает и выключает это в любой момент.')+'</small></span>'+
            '<input type="checkbox" class="switch" id="privacy-start"'+(privStartOn?' checked':'')+'></label>'+
          '<label class="set-switch"><span>'+T('Показывать сводку дня')+'<small>'+T('Всё важное на сегодня со всех досок сразу после открытия.')+'</small></span>'+
            '<input type="checkbox" class="switch" id="summary-start"'+(getSummaryOnStart()?' checked':'')+'></label>'
        )+

        group(T('Данные'),
          '<button type="button" class="set-btn" data-act="download-backup"><span class="set-ico">⬇</span><span>'+T('Скачать копию всех досок')+'<small>'+T('Если браузер очистит данные, из этого файла можно всё восстановить.')+'</small></span></button>'+
          '<button type="button" class="set-btn" data-act="download-board"><span class="set-ico">↗</span><span>'+T('Поделиться текущей доской')+'<small>'+T('Файл можно отправить в мессенджере или по почте.')+'</small></span></button>'+
          '<div id="board-file-drop" class="drop-zone set-drop">'+
            '<input type="file" id="board-file-input" accept="application/json,.json,.txt" style="display:none;">'+
            '<button type="button" class="set-btn" data-act="pick-board-file"><span class="set-ico">⬆</span><span>'+T('Загрузить доску или копию')+'<small>'+T('Выберите файл или перетащите его сюда.')+'</small></span></button>'+
          '</div>'
        )+

        group(T('О приложении'),
          '<button type="button" class="set-btn" data-act="show-onboarding"><span class="set-ico">👋</span><span>'+T('Показать приветствие')+'<small>'+T('Ещё раз пройти первый запуск и добавить доски.')+'</small></span></button>'+
          (isAdmin() ? '<button type="button" class="set-btn" data-act="open-admin"><span class="set-ico">🛠</span><span>Админ-панель<small>Тестовая дата, огонёк, шаблоны</small></span></button>' : '')
        )+
        '<div class="app-version" data-act="version-tap">'+T('Версия')+' '+APP_VERSION+' · '+T('бета')+'</div>'+
      '</div>'+
    '</div>';
  }


  // ---------- event handling ----------
  // заполняет списки «категория» и «счёт» по выбранной доске финансов и валюте формы
  function wireFinanceFields(form){
    var finBox = form.querySelector('.fin-box[data-fin]');
    if(!finBox) return;
    var finInfo = null;
    try{ finInfo = JSON.parse(finBox.dataset.fin); }catch(e){ return; }
    var rebuildFin = function(){
      var bSel = form.querySelector('select[name=finBoard]');
      var eSel = form.querySelector('select[name=finExpense]');
      var aSel = form.querySelector('select[name=finBalance]');
      var cur = form.querySelector('[name=currency]').value;
        var bd = finInfo.boards.find(function(b){ return b.id===bSel.value; });
        finBox.querySelectorAll('[data-fin-dep]').forEach(function(el){ el.style.display = bd ? '' : 'none'; });
        if(!bd) return;
        var link = finInfo.link || {};
        var prevE = eSel.value || (link.boardId===bd.id ? link.expenseId : '');
        var prevA = aSel.value || (link.boardId===bd.id ? link.balanceId : '');
        var exps = bd.expenses.filter(function(e){ return e.currency===cur; });
        var byName = exps.find(function(e){ return e.name.trim().toLowerCase()===String(finInfo.subjName||'').trim().toLowerCase(); });
        eSel.innerHTML = exps.map(function(e){ return '<option value="'+e.id+'">'+escapeHtml(e.name)+'</option>'; }).join('')+
          T('<option value="new">+ Новая категория «')+escapeHtml(finInfo.subjName||'')+'»</option>';
        eSel.value = exps.some(function(e){ return e.id===prevE; }) ? prevE : (byName ? byName.id : 'new');
        var bals = bd.balances.filter(function(x){ return x.currency===cur; });
        var others = bd.balances.filter(function(x){ return x.currency!==cur; });
        aSel.innerHTML = bals.map(function(x){ return '<option value="'+x.id+'">'+escapeHtml(x.label)+'</option>'; }).join('')+
          (others.length ? '<optgroup label="'+escapeHtml(T('Другая валюта — по курсу'))+'">'+others.map(function(x){
            var r = x.rates && x.rates[cur];
            return '<option value="'+x.id+'"'+(r?'':' disabled')+'>'+escapeHtml(x.label+(r ? ' · '+rateText(cur, x.currency, r) : ' · '+T('нужен курс')))+'</option>';
          }).join('')+'</optgroup>' : '')+
          T('<option value="">Не списывать со счёта</option>');
        bals = bals.concat(others.filter(function(x){ return x.rates && x.rates[cur]; }));
        aSel.value = bals.some(function(x){ return x.id===prevA; }) ? prevA : (prevA==='' && link.boardId===bd.id && link.balanceId==='' ? '' : (bals[0] ? bals[0].id : ''));
    };
    form.querySelector('select[name=finBoard]').addEventListener('change', function(){
      form.querySelector('select[name=finExpense]').value = '';
      form.querySelector('select[name=finBalance]').value = '';
      rebuildFin();
    });
    var curEl = form.querySelector('[name=currency]');
    if(curEl && curEl.tagName==='SELECT') curEl.addEventListener('change', rebuildFin);
    rebuildFin();
  }
  function finFromForm(fd){
    return fd.get('finBoard') ? {boardId: fd.get('finBoard'), expenseId: fd.get('finExpense') || 'new', balanceId: fd.get('finBalance') || ''} : null;
  }
  // записать трату в доску финансов; возвращает ссылку, чтобы потом её можно было откатить
  function recordExpense(fin, amount, currency, date, name, color, note){
    if(!fin || !fin.boardId || !(amount>0)) return null;
    var fb = state.boards.find(function(x){ return x.id===fin.boardId && x.type==='finance'; });
    if(!fb) return null;
    var exp = fb.expenses.find(function(x){ return x.id===fin.expenseId && x.currency===currency; });
    if(!exp){
      exp = {id: uid(), name: name, color: color, amount: 0, currency: currency, budget: 0, subs: [], history: []};
      fb.expenses.push(exp);
    }
    addTransactionOn(fb, 'expense', exp.id, amount, fin.balanceId || null, date, null, note);
    return {boardId: fb.id, expenseId: exp.id, histId: lastHistoryId, boardName: fb.name, balanceId: fin.balanceId || ''};
  }
  function undoExpense(ref){
    if(!ref) return;
    var fb = state.boards.find(function(x){ return x.id===ref.boardId; });
    if(fb) deleteTransactionOn(fb, 'expense', ref.expenseId, ref.histId);
  }

  function attachHandlers(){
    app.querySelectorAll('[data-act]').forEach(function(el){
      el.addEventListener('click', function(ev){ handleAction(el, ev); });
    });
    app.querySelectorAll('[data-stop]').forEach(function(el){
      el.addEventListener('click', function(ev){ ev.stopPropagation(); });
    });
    var overlays = app.querySelectorAll('.overlay');
    overlays.forEach(function(overlay){
      if(overlay.classList.contains('center')) return;
      var modal = overlay.querySelector('.modal');
      if(!modal) return;
      attachSheetDrag(modal, function(){
        overlay.classList.add('dragged');
        var btn = modal.querySelector('.close-x[data-act]');
        var fake = {stopPropagation: function(){}, preventDefault: function(){}};
        if(btn) handleAction(btn, fake); else closeAllModals();
      }, {setFade: function(f, dur){
        overlay.style.transition = dur ? 'background-color '+dur+'ms ease' : 'none';
        overlay.style.setProperty('--bd', f.toFixed(3));
      }});
    });
    overlays.forEach(function(overlay, idx){
      var downOnBackdrop = false;
      overlay.addEventListener('pointerdown', function(ev){ downOnBackdrop = (ev.target===overlay); });
      overlay.addEventListener('click', function(ev){
        if(ev.target!==overlay || !downOnBackdrop) return;
        downOnBackdrop = false;
        if(idx!==overlays.length-1) return;
        if(anyDialog()){ closeDialogs(); return; }
        closeTopModal();
      });
    });

    var renameForm = document.getElementById('rename-board-form');
    if(renameForm){
      var renameInput = renameForm.querySelector('input[name=name]');
      renameInput.focus(); renameInput.select();
      renameForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var name = renameInput.value.trim();
        if(!name){ showToast(T('Введите название')); return; }
        var id = state.renameBoardId;
        state.renameBoardId = null;
        renameBoard(id, name);
      });
    }

    var searchEl = document.getElementById('card-search');
    if(searchEl){
      searchEl.addEventListener('input', function(){
        state.search = searchEl.value;
        applySearch();
      });
    }

    var addForm = document.getElementById('add-form');
    if(addForm){
      var editingSubjId = (addForm.querySelector('input[name=editId]')||{}).value;
      var editingSubj = editingSubjId ? activeBoard().subjects.find(function(x){ return x.id===editingSubjId; }) : null;
      var selectedDays = editingSubj ? editingSubj.days.slice() : [];
      var colorInput = addForm.querySelector('input[name=color]');
      var planInput = addForm.querySelector('input[name=planType]');
      addForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          colorInput.value = sw.dataset.color;
        });
      });
      addForm.querySelectorAll('.day-toggle').forEach(function(btn){
        btn.addEventListener('click', function(){
          var v = Number(btn.dataset.day);
          var idx = selectedDays.indexOf(v);
          if(idx===-1){ selectedDays.push(v); btn.classList.add('active'); }
          else { selectedDays.splice(idx,1); btn.classList.remove('active'); }
        });
      });
      addForm.querySelectorAll('[data-plan]').forEach(function(btn){
        btn.addEventListener('click', function(){
          addForm.querySelectorAll('[data-plan]').forEach(function(x){ x.classList.remove('active'); });
          btn.classList.add('active');
          planInput.value = btn.dataset.plan;
          addForm.querySelectorAll('[data-plan-field]').forEach(function(f){
            f.style.display = (f.dataset.planField===btn.dataset.plan) ? '' : 'none';
          });
        });
      });
      addForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        if(selectedDays.length===0){ showToast(T('Выберите хотя бы один день недели')); return; }
        var fd = new FormData(addForm);
        var planType = fd.get('planType') || 'dynamic';
        var tStart = normalizeTime(fd.get('timeStart')), tEnd = normalizeTime(fd.get('timeEnd'));
        if(tStart===null || tEnd===null){ showToast(T('Неверное время — введите, например, 14:30')); return; }
        var payload = {
          name: (fd.get('name')||'').toString().trim() || T('Без названия'),
          color: fd.get('color'),
          days: selectedDays.slice(),
          startDate: fd.get('startDate'),
          planType: planType,
          timeStart: tStart,
          timeEnd: tEnd
        };
        if(planType==='static'){
          var paidUntil = fd.get('paidUntil');
          if(!paidUntil){ showToast(T('Укажите дату, до которой оплачено')); return; }
          payload.paidUntil = paidUntil;
        } else {
          payload.total = Math.max(1, parseInt(fd.get('total'),10) || 1);
        }
        var editSubjId = fd.get('editId');
        state.modal = null;
        state.editing = null;
        if(editSubjId){ updateSubject(editSubjId, payload); } else { addSubject(payload); }
      });
    }

    var addEventForm = document.getElementById('add-event-form');
    if(addEventForm){
      var colorInput2 = addEventForm.querySelector('input[name=color]');
      addEventForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addEventForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          colorInput2.value = sw.dataset.color;
        });
      });
      addEventForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(addEventForm);
        var payload = {
          name: (fd.get('name')||'').toString().trim() || T('Без названия'),
          color: fd.get('color'),
          date: fd.get('date'),
          yearly: !!fd.get('yearly')
        };
        var editId = fd.get('editId');
        state.modal = null;
        state.editing = null;
        if(editId){ updateEvent(editId, payload); } else { addEvent(payload); }
      });
    }

    var addScheduleForm = document.getElementById('add-schedule-form');
    if(addScheduleForm){
      var colorInputS = addScheduleForm.querySelector('input[name=color]');
      addScheduleForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addScheduleForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          colorInputS.value = sw.dataset.color;
        });
      });
      addScheduleForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(addScheduleForm);
        var payload = {
          name: (fd.get('name')||'').toString().trim() || T('Без названия'),
          color: fd.get('color'),
          notes: (fd.get('notes')||'').toString().trim()
        };
        var editId = fd.get('editId');
        state.modal = null;
        state.editing = null;
        if(editId){ updateScheduleItem(editId, payload); } else { addScheduleItem(payload); }
      });
    }

    var scheduleTimeForm = document.getElementById('schedule-time-form');
    if(scheduleTimeForm){
      var dayInputT = scheduleTimeForm.querySelector('input[name=day]');
      var repeatInput = scheduleTimeForm.querySelector('input[name=repeat]');
      scheduleTimeForm.querySelectorAll('[data-repeat]').forEach(function(btn){
        btn.addEventListener('click', function(){
          scheduleTimeForm.querySelectorAll('[data-repeat]').forEach(function(x){ x.classList.remove('active'); });
          btn.classList.add('active');
          repeatInput.value = btn.dataset.repeat;
          scheduleTimeForm.querySelectorAll('[data-repeat-field]').forEach(function(f){
            f.style.display = (f.dataset.repeatField===btn.dataset.repeat) ? '' : 'none';
          });
        });
      });
      scheduleTimeForm.querySelectorAll('.day-toggle').forEach(function(btn){
        btn.addEventListener('click', function(){
          scheduleTimeForm.querySelectorAll('.day-toggle').forEach(function(x){ x.classList.remove('active'); });
          btn.classList.add('active');
          dayInputT.value = btn.dataset.day;
        });
      });
      scheduleTimeForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(scheduleTimeForm);
        var tStartS = normalizeTime(fd.get('timeStart')), tEndS = normalizeTime(fd.get('timeEnd'));
        if(tStartS===null || tEndS===null){ showToast(T('Неверное время — введите, например, 14:30')); return; }
        var payload = {
          day: Number(fd.get('day')),
          date: '',
          timeStart: tStartS,
          timeEnd: tEndS
        };
        if(fd.get('repeat')==='once'){
          var onceDate = fd.get('date');
          if(!isValidDs(onceDate)){ showToast(T('Укажите дату')); return; }
          payload.date = onceDate;
          payload.day = parseD(onceDate).getDay();
        }
        var itemId = fd.get('itemId');
        var timeId = fd.get('timeId');
        state.modal = null;
        state.editing = null;
        state.scheduleTimeTarget = null;
        if(timeId){ updateScheduleTime(itemId, timeId, payload); } else { addScheduleTime(itemId, payload); }
      });
    }

    var addIncomeForm = document.getElementById('add-income-form');
    if(addIncomeForm){
      var colorInput3 = addIncomeForm.querySelector('input[name=color]');
      var scheduleInput = addIncomeForm.querySelector('input[name=scheduleType]');
      addIncomeForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addIncomeForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          colorInput3.value = sw.dataset.color;
        });
      });
      addIncomeForm.querySelectorAll('[data-schedule]').forEach(function(btn){
        btn.addEventListener('click', function(){
          addIncomeForm.querySelectorAll('[data-schedule]').forEach(function(x){ x.classList.remove('active'); });
          btn.classList.add('active');
          scheduleInput.value = btn.dataset.schedule;
          addIncomeForm.querySelectorAll('[data-schedule-field]').forEach(function(f){
            f.style.display = (f.dataset.scheduleField===btn.dataset.schedule) ? '' : 'none';
          });
        });
      });
      addIncomeForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(addIncomeForm);
        var amount = parseFloat(fd.get('amount'));
        if(isNaN(amount) || amount<0){ showToast(T('Укажите сумму')); return; }
        var scheduleType = fd.get('scheduleType') || 'once';
        var payload = {
          name: (fd.get('name')||'').toString().trim() || T('Без названия'),
          color: fd.get('color'),
          amount: amount,
          currency: fd.get('currency') || DEFAULT_CURRENCY,
          scheduleType: scheduleType
        };
        if(scheduleType==='monthly'){
          payload.dayOfMonth = Math.min(28, Math.max(1, parseInt(fd.get('dayOfMonth'),10) || 1));
        } else {
          if(!fd.get('date')){ showToast(T('Укажите дату')); return; }
          payload.date = fd.get('date');
        }
        var editId = fd.get('editId');
        state.modal = null;
        state.editing = null;
        if(editId){ updateIncome(editId, payload); } else { addIncome(payload); }
      });
    }

    var addExpenseForm = document.getElementById('add-expense-form');
    if(addExpenseForm){
      var colorInput4 = addExpenseForm.querySelector('input[name=color]');
      addExpenseForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addExpenseForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          colorInput4.value = sw.dataset.color;
        });
      });
      var recSwitch = addExpenseForm.querySelector('input[name=isRecurring]');
      if(recSwitch){
        recSwitch.addEventListener('change', function(){
          addExpenseForm.querySelector('.recur-fields').style.display = recSwitch.checked ? '' : 'none';
          if(recSwitch.checked) addExpenseForm.querySelector('input[name=recAmount]').focus();
        });
      }
      var subRowsEl = addExpenseForm.querySelector('#sub-form-rows');
      var wireSubRow = function(row){
        row.querySelector('[data-remove-sub]').addEventListener('click', function(){ row.remove(); });
      };
      subRowsEl.querySelectorAll('.sub-form-row').forEach(wireSubRow);
      addExpenseForm.querySelector('#sub-add-btn').addEventListener('click', function(){
        var tmp = document.createElement('div');
        tmp.innerHTML = subFormRowHtml(null);
        var row = tmp.firstChild;
        subRowsEl.appendChild(row);
        wireSubRow(row);
        row.querySelector('.sf-name').focus();
      });
      addExpenseForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(addExpenseForm);
        var amount = parseFloat(fd.get('amount'));
        if(isNaN(amount) || amount<0){ showToast(T('Укажите сумму')); return; }
        var payload = {
          name: (fd.get('name')||'').toString().trim() || T('Без названия'),
          color: fd.get('color'),
          amount: amount,
          currency: fd.get('currency') || DEFAULT_CURRENCY
        };
        payload.budget = Math.max(0, parseFloat(fd.get('budget')) || 0);
        payload.recurring = null;
        if(fd.get('isRecurring')){
          var recAmount = parseFloat(fd.get('recAmount'));
          var recDay = parseInt(fd.get('recDay'), 10);
          if(!(recAmount>0)){ showToast(T('Укажите сумму платежа')); return; }
          if(!(recDay>=1 && recDay<=31)){ showToast(T('Число месяца — от 1 до 31')); return; }
          payload.recurring = {amount: r2(recAmount), dayOfMonth: recDay};
        }
        payload.subs = [];
        addExpenseForm.querySelectorAll('.sub-form-row').forEach(function(row){
          var nm = row.querySelector('.sf-name').value.trim();
          var am = row.querySelector('.sf-amount').value;
          if(!nm && am==='') return;
          var amv = parseFloat(am);
          if(isNaN(amv) || amv<0) amv = 0;
          payload.subs.push({id: row.getAttribute('data-sub-id') || null, name: nm || T('Без названия'), amount: amv});
        });
        var editId = fd.get('editId');
        state.modal = null;
        state.editing = null;
        if(editId){ updateExpense(editId, payload); } else { addExpense(payload); }
      });
    }

    var balanceForm = document.getElementById('balance-form');
    if(balanceForm){
      var kindInput = balanceForm.querySelector('input[name=kind]');
      balanceForm.querySelectorAll('[data-balkind]').forEach(function(btn){
        btn.addEventListener('click', function(){
          balanceForm.querySelectorAll('[data-balkind]').forEach(function(x){ x.classList.remove('active'); });
          btn.classList.add('active');
          kindInput.value = btn.dataset.balkind;
        });
      });
      balanceForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(balanceForm);
        var amount = parseFloat(fd.get('amount'));
        if(!isFinite(amount) || amount<0){ showToast(T('Укажите сумму')); return; }
        var payload = {
          label: (fd.get('label')||'').toString().trim(),
          amount: amount,
          currency: fd.get('currency') || DEFAULT_CURRENCY,
          kind: fd.get('kind')==='secondary' ? 'secondary' : 'main'
        };
        var editId = fd.get('editId');
        if(payload.kind==='main'){
          var otherMain = activeBoard().balances.filter(function(x){ return x.kind==='main' && x.id!==editId; }).length;

        }
        state.editing = null;
        if(editId){ updateBalance(editId, payload); } else { addBalance(payload); }
      });
    }

    var transactionForm = document.getElementById('transaction-form');
    if(transactionForm){
      transactionForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(transactionForm);
        var amount = parseFloat(fd.get('amount'));
        if(!(amount>0)){ showToast(T('Укажите сумму')); return; }
        var balanceId = fd.get('balanceId') || null;
        var date = fd.get('date') || fmt(todayD());
        var t = state.transactionTarget;
        state.modal = null;
        state.transactionTarget = null;
        var balanceFound = addTransaction(t.kind, t.id, amount, balanceId, date, t.subId || null);
        if(balanceId && balanceFound===false){ showToast(T('Добавлено, но счёт не найден — баланс не изменён.')); }
      });
    }

    var renewForm = document.getElementById('renew-form');
    if(renewForm){
      wireFinanceFields(renewForm);
      renewForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(renewForm);
        var data = {
          date: fd.get('date') || fmt(todayD()),
          amount: Math.max(0, parseFloat(fd.get('amount')) || 0),
          currency: fd.get('currency') || DEFAULT_CURRENCY,
          fin: fd.get('finBoard') ? {boardId: fd.get('finBoard'), expenseId: fd.get('finExpense') || 'new', balanceId: fd.get('finBalance') || ''} : null
        };
        if(fd.has('until')){
          if(!isValidDs(fd.get('until'))){ showToast(T('Укажите дату')); return; }
          data.until = fd.get('until');
        } else {
          var n = parseInt(fd.get('lessons'), 10);
          if(!(n>0)){ showToast(T('Укажите количество уроков')); return; }
          data.lessons = n;
        }
        var id = state.renewTarget;
        state.modal = null; state.renewTarget = null;
        renewSubject(id, data);
      });
    }

    var addSubForm = document.getElementById('add-sub-form');
    if(addSubForm){
      var subColor = addSubForm.querySelector('input[name=color]');
      addSubForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addSubForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          subColor.value = sw.dataset.color;
        });
      });
      var perInput = addSubForm.querySelector('input[name=period]');
      addSubForm.querySelectorAll('[data-period]').forEach(function(btn){
        btn.addEventListener('click', function(){
          addSubForm.querySelectorAll('[data-period]').forEach(function(x){ x.classList.remove('active'); });
          btn.classList.add('active');
          perInput.value = btn.dataset.period;
        });
      });
      addSubForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(addSubForm);
        var amount = parseFloat(fd.get('amount'));
        if(isNaN(amount) || amount<0){ showToast(T('Укажите сумму')); return; }
        if(!isValidDs(fd.get('startDate'))){ showToast(T('Укажите дату')); return; }
        var payload = {
          name: (fd.get('name')||'').toString().trim() || T('Без названия'),
          color: fd.get('color'), amount: r2(amount), currency: fd.get('currency') || DEFAULT_CURRENCY,
          period: fd.get('period') || 'month', startDate: fd.get('startDate')
        };
        var editId = fd.get('editId');
        state.modal = null; state.editing = null;
        if(editId) updateSub(editId, payload); else addSub(payload);
      });
    }

    var subPayForm = document.getElementById('sub-pay-form');
    if(subPayForm){
      wireFinanceFields(subPayForm);
      subPayForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(subPayForm);
        var amount = parseFloat(fd.get('amount'));
        if(!(amount>0)){ showToast(T('Укажите сумму')); return; }
        var tg = state.subTarget;
        state.modal = null; state.subTarget = null;
        if(fd.get('updatePrice')){ var sx = findSub(tg.id); if(sx) sx.amount = r2(amount); }
        paySub(tg.id, tg.date, r2(amount), fd.get('date') || fmt(todayD()), finFromForm(fd));
      });
    }

    var addHabitForm = document.getElementById('add-habit-form');
    if(addHabitForm){
      var hbColor = addHabitForm.querySelector('input[name=color]');
      addHabitForm.querySelectorAll('.swatch').forEach(function(sw){
        sw.addEventListener('click', function(){
          addHabitForm.querySelectorAll('.swatch').forEach(function(x){ x.classList.remove('active'); });
          sw.classList.add('active');
          hbColor.value = sw.dataset.color;
        });
      });
      var hbKindInput = addHabitForm.querySelector('input[name=kind]');
      addHabitForm.querySelectorAll('[data-kind]').forEach(function(btn){
        btn.addEventListener('click', function(){
          addHabitForm.querySelectorAll('[data-kind]').forEach(function(x){ x.classList.remove('active'); });
          btn.classList.add('active');
          hbKindInput.value = btn.dataset.kind;
          addHabitForm.querySelector('[data-kind-field]').style.display = btn.dataset.kind==='count' ? '' : 'none';
        });
      });
      addHabitForm.querySelectorAll('.day-toggle').forEach(function(btn){
        btn.addEventListener('click', function(){ btn.classList.toggle('active'); });
      });
      addHabitForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(addHabitForm);
        var days = Array.prototype.slice.call(addHabitForm.querySelectorAll('.day-toggle.active')).map(function(b){ return Number(b.dataset.day); });
        if(!days.length){ showToast(T('Выберите хотя бы один день недели')); return; }
        var kind = fd.get('kind')==='count' ? 'count' : 'check';
        var payload = {
          name: (fd.get('name')||'').toString().trim() || T('Без названия'),
          color: fd.get('color'), kind: kind,
          target: kind==='count' ? Math.max(1, parseInt(fd.get('target'),10) || 1) : 1,
          unit: kind==='count' ? (fd.get('unit')||'').toString().trim() : '',
          days: days
        };
        var editId = fd.get('editId');
        state.modal = null; state.editing = null;
        if(editId) updateHabit(editId, payload); else addHabit(payload);
      });
    }

    var incomeConfirmForm = document.getElementById('income-confirm-form');
    if(incomeConfirmForm){
      incomeConfirmForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(incomeConfirmForm);
        var amount = parseFloat(fd.get('amount'));
        if(!(amount>0)){ showToast(T('Укажите сумму')); return; }
        var tg = state.incomeTarget;
        state.modal = null; state.incomeTarget = null;
        confirmIncome(tg.id, tg.orig, r2(amount), fd.get('balanceId') || null, fd.get('date') || fmt(todayD()));
      });
    }

    wireStreakSwipe();
    var admFree = document.getElementById('adm-streak-free');
    if(admFree){
      admFree.addEventListener('change', function(){
        try{ localStorage.setItem(STREAK_FREE_KEY, admFree.checked ? '1' : '0'); }catch(e){}
        showToast(admFree.checked ? 'Свободный режим огонька включён' : 'Свободный режим выключен');
      });
    }

    var balanceOpForm = document.getElementById('balance-op-form');
    if(balanceOpForm){
      balanceOpForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(balanceOpForm);
        var amount = r2(parseFloat(fd.get('amount')));
        if(!(amount>0)){ showToast(T('Укажите сумму')); return; }
        var tg = state.balanceTarget, b = activeBoard();
        var date = fd.get('date') || fmt(todayD());
        var back = tg.from==='balance' ? 'balance' : null;
        if(balanceOpForm.dataset.mode==='transfer'){
          if(!transferBalance(b, tg.id, fd.get('to'), amount, date)){ showToast(T('Для перевода в другую валюту нужен курс')); return; }
          state.modal = back; state.balanceTarget = null;
          showToast(T('Перевод выполнен'));
          render();
        } else {
          state.modal = back; state.balanceTarget = null;
          topUpBalance(b, tg.id, amount, date, (fd.get('note')||'').toString().trim());
          showToast(T('Баланс пополнен'));
        }
      });
    }

    var expensePayForm = document.getElementById('expense-pay-form');
    if(expensePayForm){
      expensePayForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(expensePayForm);
        var amount = parseFloat(fd.get('amount'));
        if(!(amount>0)){ showToast(T('Укажите сумму')); return; }
        var tg = state.incomeTarget;
        state.modal = null; state.incomeTarget = null;
        payExpense(tg.id, tg.orig, r2(amount), fd.get('balanceId') || '', fd.get('date') || fmt(todayD()));
      });
    }

    var incomePostponeForm = document.getElementById('income-postpone-form');
    if(incomePostponeForm){
      var ppDate = incomePostponeForm.querySelector('input[name=date]');
      incomePostponeForm.querySelectorAll('[data-quick-days]').forEach(function(btn){
        btn.addEventListener('click', function(){
          ppDate.value = fmt(addDays(todayD(), Number(btn.dataset.quickDays)));
        });
      });
      incomePostponeForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var nd = ppDate.value;
        if(!isValidDs(nd)){ showToast(T('Укажите дату')); return; }
        var tg = state.incomeTarget;
        state.modal = null; state.incomeTarget = null;
        postponeIncome(tg.id, tg.orig, nd, tg.kind);
      });
    }

    var langSelect = document.getElementById('lang-select');
    if(langSelect){
      langSelect.addEventListener('change', function(){
        try{ localStorage.setItem(LANG_KEY, langSelect.value); }catch(e){}
        location.reload();
      });
    }

    var privStart = document.getElementById('privacy-start');
    if(privStart){
      privStart.addEventListener('change', function(){
        try{ localStorage.setItem(PRIV_START_KEY, privStart.checked ? '1' : '0'); }catch(e){}
      });
    }

    var summaryStart = document.getElementById('summary-start');
    if(summaryStart){
      summaryStart.addEventListener('change', function(){
        try{ localStorage.setItem(SUMMARY_KEY, summaryStart.checked ? '1' : '0'); }catch(e){}
      });
    }

    // свайп по календарю листает месяцы
    var calWrap = app.querySelector('.cal-wrap');
    if(calWrap){
      var sx = 0, sy = 0, tracking = false;
      calWrap.addEventListener('touchstart', function(e){
        if(e.touches.length!==1){ tracking = false; return; }
        tracking = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
      }, {passive: true});
      calWrap.addEventListener('touchend', function(e){
        if(!tracking) return;
        tracking = false;
        var tch = e.changedTouches[0];
        var dx = tch.clientX - sx, dy = tch.clientY - sy;
        if(Math.abs(dx) > 50 && Math.abs(dy) < Math.abs(dx)*0.6){
          changeMonth(dx < 0 ? 1 : -1);
        }
      }, {passive: true});
    }

    var rateForm = document.getElementById('rate-form');
    if(rateForm){
      rateForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        var fd = new FormData(rateForm);
        var from = fd.get('from'), to = fd.get('to');
        var val = parseFloat(fd.get('value'));
        if(!(val>0)){ showToast(T('Укажите курс')); return; }
        if(from===to){ showToast(T('Валюты должны различаться')); return; }
        var oldKey = fd.get('oldKey');
        var b = activeBoard();
        if(oldKey && oldKey!==(from+'_'+to)) delete b.rates[oldKey];
        b.rates[from+'_'+to] = val;
        state.editing = null;
        saveData();
      });
    }

    app.querySelectorAll('[data-boardtype]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var nameVal = (document.getElementById('new-board-name')||{}).value || '';
        state.newBoardType = btn.dataset.boardtype;
        state.boardTypePickerOpen = false;
        render();
        var nameInput2 = document.getElementById('new-board-name');
        if(nameInput2) nameInput2.value = nameVal;
      });
    });

    var boardFileInput = document.getElementById('board-file-input');
    if(boardFileInput){
      boardFileInput.addEventListener('change', function(){
        if(boardFileInput.files && boardFileInput.files[0]) handleBoardFile(boardFileInput.files[0]);
        boardFileInput.value = '';
      });
    }
    var boardFileDrop = document.getElementById('board-file-drop');
    if(boardFileDrop){
      ['dragenter','dragover'].forEach(function(evName){
        boardFileDrop.addEventListener(evName, function(ev){
          ev.preventDefault(); ev.stopPropagation();
          boardFileDrop.style.borderColor = 'var(--accent)';
        });
      });
      ['dragleave','drop'].forEach(function(evName){
        boardFileDrop.addEventListener(evName, function(ev){
          ev.preventDefault(); ev.stopPropagation();
          boardFileDrop.style.borderColor = '';
        });
      });
      boardFileDrop.addEventListener('drop', function(ev){
        var files = ev.dataTransfer && ev.dataTransfer.files;
        if(files && files[0]) handleBoardFile(files[0]);
      });
    }
  }

  var toastTimer = null;
  function showToast(msg, opts){
    opts = opts || {};
    var t = document.getElementById('app-toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'app-toast';
      t.className = 'toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.classList.remove('hide');
    t.innerHTML = '';
    var span = document.createElement('span');
    span.textContent = msg;
    t.appendChild(span);
    t.classList.toggle('has-action', !!opts.action);
    if(opts.action){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toast-btn';
      btn.textContent = opts.action;
      btn.addEventListener('click', function(){ hideToast(); if(opts.onAction) opts.onAction(); });
      t.appendChild(btn);
    }
    // перезапуск анимации появления
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, opts.duration || 2400);
  }
  function hideToast(){
    var t = document.getElementById('app-toast');
    if(!t) return;
    clearTimeout(toastTimer);
    t.classList.add('hide');
    toastTimer = setTimeout(function(){
      if(t && t.parentNode) t.parentNode.removeChild(t);
    }, 300);
  }
  function dropToastAction(){
    var t = document.getElementById('app-toast');
    if(!t) return;
    var b = t.querySelector('.toast-btn');
    if(b){ b.remove(); t.classList.remove('has-action'); }
  }

  function curWeekStart(){
    if(!state.weekStart){
      var t = todayD();
      var vd = state.viewDate;
      // неделя с сегодняшним днём, если смотрим текущий месяц, иначе — первая неделя месяца
      state.weekStart = (vd.getFullYear()===t.getFullYear() && vd.getMonth()===t.getMonth()) ? weekKey(t) : weekKey(vd);
    }
    return state.weekStart;
  }
  function periodLabel(short){
    var vd = state.viewDate;
    if(short && state.calView==='week'){
      var a0 = parseD(curWeekStart()), b0 = addDays(a0, 6);
      return a0.getMonth()===b0.getMonth()
        ? a0.getDate()+'–'+b0.getDate()+' '+MONTH_SHORT[b0.getMonth()]
        : a0.getDate()+' '+MONTH_SHORT[a0.getMonth()]+' – '+b0.getDate()+' '+MONTH_SHORT[b0.getMonth()];
    }
    if(state.calView!=='week') return MONTH_NAMES[vd.getMonth()]+' '+vd.getFullYear();
    var a = parseD(curWeekStart()), b = addDays(a, 6);
    if(a.getMonth()===b.getMonth()) return a.getDate()+'–'+fmtHumanNoYear(fmt(b));
    return fmtHumanNoYear(fmt(a))+' – '+fmtHumanNoYear(fmt(b));
  }
  function setCalView(v){
    v = v==='week' ? 'week' : 'month';
    if(v===state.calView) return;
    if(v==='week'){ state.weekStart = null; curWeekStart(); }
    else state.viewDate = startOfMonth(addDays(parseD(curWeekStart()), 3));
    state.calView = v;
    try{ localStorage.setItem('lessoncal_calview', v); }catch(e){}
    pendingAnim = '';
    render();
  }
  // тянуть шторку вниз — закрыть (как в iOS)
  function attachSheetDrag(panel, onClose, opts){
    opts = opts || {};
    var sy = 0, sx = 0, dy = 0, t0 = 0, decided = false, dragging = false, fromGrip = false;
    var setFade = opts.setFade || function(){};
    panel.addEventListener('touchstart', function(e){
      if(e.touches.length!==1 || window.innerWidth>640 || (e.target.closest && e.target.closest('[data-nodrag]'))) { decided = true; dragging = false; return; }
      var r = panel.getBoundingClientRect();
      sy = e.touches[0].clientY; sx = e.touches[0].clientX;
      fromGrip = (sy - r.top) < (opts.gripHeight || 56);
      dy = 0; t0 = Date.now(); decided = false; dragging = false;
    }, {passive: true});
    panel.addEventListener('touchmove', function(e){
      if(decided && !dragging) return;
      var cy = e.touches[0].clientY, cx = e.touches[0].clientX;
      dy = cy - sy;
      if(!decided){
        if(Math.abs(dy)<6 && Math.abs(cx-sx)<6) return;
        decided = true;
        var tag = (e.target && e.target.tagName) || '';
        var scroller = opts.scroller || panel;
        var atTop = scroller.scrollTop <= 0;
        dragging = dy>0 && Math.abs(dy)>Math.abs(cx-sx) &&
          (fromGrip || (!opts.gripOnly && atTop && !/^(INPUT|TEXTAREA|SELECT)$/.test(tag)));
        if(!dragging) return;
        // анимация появления «держит» окно на месте — на время жеста выключаем её
        panel.classList.add('sheet-dragging');
        panel.classList.remove('sheet-dismiss');
        panel.style.transition = 'none';
        if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
      }
      e.preventDefault();
      var d = Math.max(0, dy);
      panel.style.transform = 'translateY('+d+'px)';
      setFade(1 - Math.min(1, d / Math.max(200, panel.offsetHeight)));
    }, {passive: false});
    var end = function(){
      if(!dragging) return;
      dragging = false;
      var h = panel.offsetHeight;
      var v = dy / Math.max(1, Date.now()-t0);
      if(dy > Math.min(140, h*0.3) || (v > 0.55 && dy > 40)){
        // окно улетает вниз той же пружинистой анимацией, что и при открытии, и только потом закрывается
        var dur = v > 1.2 ? 300 : 380;
        panel.style.transition = 'none';
        panel.style.setProperty('--drag-y', Math.max(0, dy)+'px');
        panel.style.setProperty('--dismiss-dur', dur+'ms');
        panel.style.transform = 'translateY(calc(100% + 40px))';
        panel.classList.add('sheet-dismiss');
        setFade(0, dur);
        var done = false;
        var finish = function(){ if(done) return; done = true; onClose(); };
        panel.addEventListener('animationend', function ae(ev){ if(ev.target===panel){ panel.removeEventListener('animationend', ae); finish(); } });
        setTimeout(finish, dur + 80);
      } else {
        panel.style.transition = 'transform .38s cubic-bezier(.32,.72,0,1)';
        panel.style.transform = '';
        setFade(1, 380);
      }
    };
    panel.addEventListener('touchend', end);
    panel.addEventListener('touchcancel', end);
  }

  // «Сегодня»: листаем к текущему периоду в нужную сторону, а если он уже открыт — подсвечиваем сегодняшний день
  function goToday(){
    var t = todayD();
    var curKey = state.calView==='week' ? curWeekStart() : fmt(startOfMonth(state.viewDate));
    var newKey = state.calView==='week' ? weekKey(t) : fmt(startOfMonth(t));
    if(curKey===newKey){
      var cell = app.querySelector('.cal-cell.today');
      if(cell){
        cell.classList.remove('flash'); void cell.offsetWidth; cell.classList.add('flash');
        if(window.innerWidth<=820 && cell.getBoundingClientRect().top > window.innerHeight - 80) cell.scrollIntoView({behavior: animMode()==='full' ? 'smooth' : 'auto', block: 'center'});
      }
      return;
    }
    state.viewDate = startOfMonth(t);
    state.weekStart = weekKey(t);
    pendingAnim = newKey > curKey ? 'slide-next' : 'slide-prev';
    render();
  }

  function changeMonth(delta){
    if(state.calView==='week'){
      state.weekStart = fmt(addDays(parseD(curWeekStart()), 7*delta));
      state.viewDate = startOfMonth(addDays(parseD(state.weekStart), 3));
    } else {
      state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth()+delta, 1);
    }
    pendingAnim = delta>0 ? 'slide-next' : 'slide-prev';
    render();
  }
  function anyDialog(){ return !!(state.confirmDeleteId || state.renameBoardId || state.confirmCard || state.pendingBackup); }
  function closeDialogs(){
    state.confirmDeleteId = null; state.renameBoardId = null; state.confirmCard = null; state.pendingBackup = null;
    render();
  }
  function closeTopModal(){
    var tops = app.querySelectorAll('.overlay');
    var top = tops[tops.length-1];
    var btn = top && top.querySelector('.modal > .close-x[data-act="close-modal"]');
    if(btn) handleAction(btn, {stopPropagation: function(){}, preventDefault: function(){}});
    else closeAllModals();
  }
  function closeAllModals(){
    state.modal = null; state.menuOpen = false; state.editing = null;
    state.transactionTarget = null; state.scheduleTimeTarget = null; state.detailTarget = null;
    state.renewTarget = null; state.incomeTarget = null; state.subTarget = null; state.balanceTarget = null;
    state.boardTypePickerOpen = false;
    render();
  }

  function handleAction(el, ev){
    var act = el.dataset.act;
    if(el.dataset.board && ['toggle-done','habit-toggle','habit-inc','habit-dec'].indexOf(act)===-1 && el.dataset.board!==state.activeBoardId && state.boards.some(function(b){ return b.id===el.dataset.board; })){
      state.activeBoardId = el.dataset.board;
      state.search = ''; state.financeView = 'income'; state.editing = null;
      pendingAnim = 'enter';
    }
    switch(act){
      case 'prev-month':
        changeMonth(-1); break;
      case 'next-month':
        changeMonth(1); break;
      case 'cal-view':
        setCalView(el.dataset.view);
        break;
      case 'today':
        goToday();
        break;
      case 'finance-view':
        state.financeView = el.dataset.view === 'expenses' ? 'expenses' : 'income';
        state.search = '';
        pendingAnim = 'enter';
        render(); break;
      case 'set-theme':
        setTheme(el.dataset.theme);
        break;
      case 'refresh-rates':
        refreshRatesFromApi(el.dataset.to);
        break;
      case 'open-add':
        state.modal = 'add'; state.menuOpen = false; state.editing = null; state.scheduleTimeTarget = null; render(); break;
      case 'close-modal':
        if(state.modal==='onboarding'){ markOnboarded(); state.onb = null; }
        // окно пополнения, открытое из «Баланса», возвращает обратно в «Баланс»
        var backTo = (state.modal==='balance-op' && state.balanceTarget && state.balanceTarget.from==='balance') ? 'balance' : null;
        state.detailTarget = null; state.modal = null; state.editing = null; state.transactionTarget = null; state.scheduleTimeTarget = null;
        state.renewTarget = null; state.incomeTarget = null; state.subTarget = null; state.balanceTarget = null;
        state.modal = backTo;
        render(); break;
      case 'open-menu':
        state.menuOpen = true; state.modal = null; state.newBoardType = 'lessons'; state.boardTypePickerOpen = false; render(); break;
      case 'close-menu':
        state.menuOpen = false; render(); break;
      case 'toggle-boardtype-picker':
        (function(){
          var nameVal = (document.getElementById('new-board-name')||{}).value || '';
          state.boardTypePickerOpen = !state.boardTypePickerOpen;
          render();
          var nameInput3 = document.getElementById('new-board-name');
          if(nameInput3) nameInput3.value = nameVal;
        })();
        break;
      case 'open-settings':
        state.modal = 'settings'; state.menuOpen = false; render(); break;
      case 'open-day':
        state.selectedDate = el.dataset.date; state.modal = 'day'; state.menuOpen = false; render(); break;
      case 'delete-subject':
        ev.stopPropagation();
        askDelete('subject', el.dataset.id);
        break;
      case 'edit-subject':
        ev.stopPropagation();
        state.editing = {kind:'subject', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'delete-event':
        ev.stopPropagation();
        askDelete('event', el.dataset.id);
        break;
      case 'edit-event':
        ev.stopPropagation();
        state.editing = {kind:'event', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'delete-income':
        ev.stopPropagation();
        askDelete('income', el.dataset.id);
        break;
      case 'delete-expense':
        ev.stopPropagation();
        askDelete('expense', el.dataset.id);
        break;
      case 'edit-schedule-item':
        ev.stopPropagation();
        state.editing = {kind:'schedule', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'delete-schedule-item':
        ev.stopPropagation();
        askDelete('schedule', el.dataset.id);
        break;
      case 'add-schedule-time':
        ev.stopPropagation();
        state.scheduleTimeTarget = el.dataset.item;
        state.editing = null;
        state.modal = 'schedule-time';
        render();
        break;
      case 'edit-schedule-time':
        ev.stopPropagation();
        state.editing = {kind:'scheduletime', itemId: el.dataset.item, timeId: el.dataset.time};
        state.scheduleTimeTarget = null;
        state.modal = 'schedule-time';
        render();
        break;
      case 'delete-schedule-time':
        ev.stopPropagation();
        withUndo(T('Время удалено'), function(){ deleteScheduleTime(el.dataset.item, el.dataset.time); });
        break;
      case 'toggle-done':
        ev.stopPropagation();
        toggleTaskDone(el.dataset.item, el.dataset.time, el.dataset.date, el.dataset.board);
        break;
      case 'pick-schedule-day':
        state.scheduleDay = Number(el.dataset.day);
        render();
        break;
      case 'delete-transaction':
        ev.stopPropagation();
        withUndo(T('Запись удалена'), function(){ deleteTransaction(el.dataset.kind, el.dataset.item, el.dataset.hist); });
        break;
      case 'edit-income':
        ev.stopPropagation();
        state.editing = {kind:'income', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'edit-expense':
        ev.stopPropagation();
        state.editing = {kind:'expense', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'add-transaction':
        ev.stopPropagation();
        state.transactionTarget = {kind: el.dataset.kind, id: el.dataset.id, subId: el.dataset.sub || null};
        state.modal = 'transaction';
        render();
        break;
      case 'balance-op':
        ev.stopPropagation();
        state.balanceTarget = {id: el.dataset.id, mode: 'topup', from: state.modal};
        state.modal = 'balance-op';
        render();
        break;
      case 'balance-mode':
        if(state.balanceTarget){ state.balanceTarget.mode = el.dataset.mode; render(); }
        break;
      case 'delete-balance-entry':
        (function(balId, hid){ withUndo(T('Операция удалена'), function(){ deleteBalanceEntry(activeBoard(), balId, hid); }); })(el.dataset.bal, el.dataset.id);
        break;
      case 'open-balance':
        state.modal = 'balance'; state.menuOpen = false; state.editing = null; render(); break;
      case 'edit-balance':
        state.editing = {kind:'balance', id: el.dataset.id};
        render();
        focusBalanceForm();
        break;
      case 'cancel-edit-balance':
        state.editing = null;
        render();
        break;
      case 'delete-balance':
        ev.stopPropagation();
        if(state.editing && state.editing.kind==='balance' && state.editing.id===el.dataset.id) state.editing = null;
        withUndo(T('Баланс удалён'), function(){ deleteBalance(el.dataset.id); });
        break;
      case 'open-rates':
        state.modal = 'rates'; state.menuOpen = false; state.editing = null; render(); break;
      case 'edit-rate':
        state.editing = {kind:'rate', key: el.dataset.key};
        render();
        break;
      case 'cancel-edit-rate':
        state.editing = null;
        render();
        break;
      case 'delete-rate':
        ev.stopPropagation();
        if(state.editing && state.editing.kind==='rate' && state.editing.key===el.dataset.key) state.editing = null;
        withUndo(T('Курс удалён'), function(){
          var b = activeBoard();
          delete b.rates[el.dataset.key];
          saveData();
        });
        break;
      case 'open-history':
        state.modal = 'history'; state.menuOpen = false; state.editing = null; render(); break;
      case 'cancel':
        cancelOccurrence(el.dataset.subj, el.dataset.date);
        break;
      case 'restore':
        restoreOccurrence(el.dataset.subj, el.dataset.date);
        break;
      case 'show-resched':
        var box = app.querySelector('.resched-box[data-subj-box="'+el.dataset.subj+'"][data-date-box="'+el.dataset.date+'"]');
        if(box) box.style.display = 'block';
        break;
      case 'confirm-resched':
        var box2 = el.closest('.resched-box');
        var inp = box2.querySelector('input[type=date]');
        if(inp && inp.value){
          rescheduleOccurrence(el.dataset.subj, el.dataset.date, inp.value);
        }
        break;
      case 'confirm-delete-card':
        (function(){
          var c = state.confirmCard;
          state.confirmCard = null;
          if(c) performCardDelete(c); else render();
        })();
        break;
      case 'show-task':
        ev.stopPropagation();
        state.detailTarget = {itemId: el.dataset.item, timeId: el.dataset.time, ds: el.dataset.date || ''};
        state.modal = 'task-detail';
        render();
        break;
      case 'switch-board':
        switchBoard(el.dataset.id);
        break;
      case 'delete-board':
        ev.stopPropagation();
        state.confirmDeleteId = el.dataset.id;
        render();
        break;
      case 'confirm-delete-board':
        (function(){
          var id = state.confirmDeleteId;
          state.confirmDeleteId = null;
          if(state.boards.length<=1){ showToast(T('Нельзя удалить последнюю доску')); render(); return; }
          withUndo(T('Доска удалена'), function(){ deleteBoard(id); });
        })();
        break;
      case 'rename-board':
        ev.stopPropagation();
        state.renameBoardId = el.dataset.id;
        render();
        break;
      case 'clone-board':
        ev.stopPropagation();
        cloneBoard(el.dataset.id);
        break;
      case 'cancel-dialog':
        closeDialogs();
        break;
      case 'create-board':
        var nameInput = document.getElementById('new-board-name');
        createBoard(nameInput ? nameInput.value : '', state.newBoardType);
        break;
      case 'download-board':
        downloadBoardFile(activeBoard());
        break;
      case 'download-backup':
        downloadBackup();
        break;
      case 'backup-add':
        applyBackup('add');
        break;
      case 'backup-replace':
        applyBackup('replace');
        break;
      case 'set-anim':
        try{ localStorage.setItem(ANIM_KEY, el.dataset.anim); }catch(e){}
        applyAnimMode();
        render();
        break;
      case 'onb-next':
        if(state.onb){
          var stp = onbSteps()[state.onb.i];
          if(stp==='types' && !state.onb.types.length) break;
          if(stp==='account'){ onbReadAccount(); state.onb.acc.useAccount = true; }
          state.onb.i++; state.onb.back = false; render();
        }
        break;
      case 'onb-skip-acc':
        if(state.onb){ onbReadAccount(); state.onb.acc.useAccount = false; state.onb.i++; state.onb.back = false; render(); }
        break;
      case 'onb-back':
        if(state.onb && state.onb.i>0){ if(onbSteps()[state.onb.i]==='account') onbReadAccount(); state.onb.i--; state.onb.back = true; render(); }
        break;
      case 'onb-type':
        (function(){
          // выбор без перерисовки окна, чтобы анимация шага не повторялась
          var t = el.dataset.type, list = state.onb.types, k = list.indexOf(t);
          if(k===-1) list.push(t); else list.splice(k, 1);
          el.classList.toggle('on', k===-1);
          el.setAttribute('aria-pressed', String(k===-1));
          var nx = document.getElementById('onb-types-next');
          if(nx) nx.disabled = !list.length;
          var dotsEl = el.closest('.onb-modal').querySelector('.onb-dots');
          if(dotsEl) dotsEl.innerHTML = onbSteps().map(function(_, j){ return '<i class="'+(j===state.onb.i?'on':(j<state.onb.i?'done':''))+'"></i>'; }).join('');
        })();
        break;
      case 'onb-lang':
        try{ localStorage.setItem(LANG_KEY, el.dataset.lang); }catch(e){}
        location.reload();
        break;
      case 'onb-finish':
        finishOnboarding();
        break;
      case 'show-onboarding':
        startOnboarding();
        break;
      case 'version-tap':
        versionTap(el);
        break;
      case 'open-admin':
        if(isAdmin()){ state.modal = 'admin'; state.menuOpen = false; render(); }
        break;
      case 'admin-date-set':
        (function(){ var v = document.getElementById('adm-date').value; if(isValidDs(v)){ setFakeToday(v); showToast('Тестовая дата: '+fmtHuman(v)); } })();
        break;
      case 'admin-date-shift':
        setFakeToday(fmt(addDays(todayD(), Number(el.dataset.days))));
        showToast('Тестовая дата: '+fmtHuman(FAKE_TODAY));
        break;
      case 'admin-date-reset':
        setFakeToday('');
        showToast('Вернулась настоящая дата');
        break;
      case 'admin-streak-set':
        (function(){
          var v = Math.max(0, Math.min(3650, parseInt(document.getElementById('adm-streak').value, 10) || 0));
          setStreakTo(v, document.getElementById('adm-streak-today').checked, loadStreak().best);
          showToast('Огонёк: '+v); render();
        })();
        break;
      case 'admin-streak-reset':
        saveStreak({days: [], best: 0}); showToast('Огонёк сброшен'); render();
        break;
      case 'admin-tpl':
        addTemplate(el.dataset.kind);
        break;
      case 'admin-tpl-remove':
        state.modal = null;
        removeTestBoards();
        break;
      case 'admin-exit':
        try{ localStorage.removeItem(ADMIN_KEY); localStorage.removeItem(STREAK_FREE_KEY); }catch(e){}
        state.modal = null;
        setFakeToday('');
        showToast('Админ-режим выключен');
        break;
      case 'open-streak':
        state.modal = 'streak'; state.menuOpen = false; render(); break;
      case 'toggle-privacy':
        togglePrivacy();
        break;
      case 'open-summary':
        state.modal = 'summary'; state.menuOpen = false; state.editing = null; render(); break;
      case 'summary-open-board':
        state.modal = null;
        switchBoard(el.dataset.id);
        break;
      case 'renew-subject':
        ev.stopPropagation();
        state.renewTarget = el.dataset.id;
        state.modal = 'renew';
        render();
        break;
      case 'delete-payment':
        withUndo(T('Оплата удалена'), function(){ deletePayment(el.dataset.subj, el.dataset.id); });
        break;
      case 'income-arrived':
        ev.stopPropagation();
        state.incomeTarget = {id: el.dataset.id, orig: el.dataset.orig};
        state.modal = 'income-confirm';
        render();
        break;
      case 'expense-paid':
        ev.stopPropagation();
        state.incomeTarget = {id: el.dataset.id, orig: el.dataset.orig, kind: 'expense'};
        state.modal = 'expense-pay';
        render();
        break;
      case 'income-postpone':
        ev.stopPropagation();
        state.incomeTarget = {id: el.dataset.id, orig: el.dataset.orig, kind: el.dataset.kind || 'income'};
        state.modal = 'income-postpone';
        render();
        break;
      case 'income-skip':
        (function(){
          var tg = state.incomeTarget;
          state.modal = null; state.incomeTarget = null;
          if(tg) withUndo(tg.kind==='expense' ? T('Отмечено: в этот раз не платим') : T('Отмечено: в этот раз выплаты не будет'), function(){ skipIncome(tg.id, tg.orig, tg.kind); });
          else render();
        })();
        break;
      case 'edit-sub':
        ev.stopPropagation();
        state.editing = {kind:'sub', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'delete-sub':
        ev.stopPropagation();
        askDelete('sub', el.dataset.id);
        break;
      case 'sub-toggle':
        ev.stopPropagation();
        toggleSubActive(el.dataset.id);
        break;
      case 'sub-pay':
        ev.stopPropagation();
        state.subTarget = {id: el.dataset.id, date: el.dataset.date};
        state.modal = 'sub-pay';
        render();
        break;
      case 'sub-skip':
        ev.stopPropagation();
        (function(id, ds){ withUndo(T('Списание пропущено'), function(){ skipSub(id, ds); }); })(el.dataset.id, el.dataset.date);
        break;
      case 'sub-unskip':
        unskipSub(el.dataset.id, el.dataset.date);
        break;
      case 'delete-sub-payment':
        (function(id, hid){ withUndo(T('Оплата удалена'), function(){ deleteSubPayment(id, hid); }); })(el.dataset.id, el.dataset.hist);
        break;
      case 'edit-habit':
        ev.stopPropagation();
        state.editing = {kind:'habit', id: el.dataset.id};
        state.modal = 'add';
        render();
        break;
      case 'delete-habit':
        ev.stopPropagation();
        askDelete('habit', el.dataset.id);
        break;
      case 'habit-toggle':
      case 'habit-inc':
      case 'habit-dec':
        ev.stopPropagation();
        habitAct(el.dataset.board, el.dataset.id, el.dataset.date, act.replace('habit-',''));
        break;
      case 'income-unskip':
        unskipIncome(el.dataset.id, el.dataset.orig, el.dataset.kind || 'income');
        break;
      case 'pick-board-file':
        var boardFileInputEl = document.getElementById('board-file-input');
        if(boardFileInputEl) boardFileInputEl.click();
        break;
    }
  }

  app.addEventListener('change', function(ev){
    var t = ev.target;
    if(t && t.dataset && t.dataset.act==='edit-total'){
      var v = Math.max(0, parseInt(t.value,10) || 0);
      updateTotal(t.dataset.id, v);
    }
    if(t && t.dataset && t.dataset.act==='edit-paiduntil'){
      updatePaidUntil(t.dataset.id, t.value);
    }
    if(t && t.dataset && t.dataset.act==='set-wheel-currency'){
      var b = activeBoard();
      b.wheelCurrency = t.value;
      saveData();
    }
    if(t && t.dataset && t.dataset.act==='set-rate'){
      var rateVal = parseFloat(t.value);
      if(rateVal>0){
        var b2 = activeBoard();
        b2.rates[t.dataset.from+'_'+t.dataset.to] = rateVal;
        saveData();
      }
    }
  });

  // ---------- время: поля «чч : мм», после часов курсор сам переходит на минуты ----------
  var skipTimeSelect = false;
  function isTP(t){ return !!(t && t.classList && (t.classList.contains('tp-h') || t.classList.contains('tp-m'))); }
  function syncTimePair(pair){
    var h = pair.querySelector('.tp-h').value, m = pair.querySelector('.tp-m').value;
    var hid = pair.querySelector('input[type=hidden]');
    if(!h && !m){ hid.value = ''; return; }
    hid.value = h + ':' + (m || (h ? '00' : ''));
  }
  app.addEventListener('focusin', function(ev){
    var t = ev.target;
    if(!isTP(t)) return;
    if(skipTimeSelect){ skipTimeSelect = false; return; }
    setTimeout(function(){ try{ t.select(); }catch(e){} }, 0);
  });
  app.addEventListener('input', function(ev){
    var t = ev.target;
    if(!isTP(t)) return;
    var isH = t.classList.contains('tp-h');
    var pair = t.closest('.time-pair');
    var raw = t.value;
    var sepTyped = /\D/.test(raw);
    var digits = raw.replace(/\D/g, '').slice(0, 2);
    // первая цифра точно не может начинать двузначное число: 3–9 для часов, 6–9 для минут
    if(digits.length===1 && parseInt(digits,10) > (isH ? 2 : 5)) digits = '0' + digits;
    if(digits.length===2){
      var lim = isH ? 23 : 59;
      if(parseInt(digits,10) > lim) digits = String(lim);
    }
    // набрали разделитель (":" . , пробел) после одной цифры — это час с нулём впереди
    if(isH && sepTyped && digits.length===1) digits = '0' + digits;
    t.value = digits;
    syncTimePair(pair);
    if(isH && digits.length===2){
      var m = pair.querySelector('.tp-m');
      m.focus();
      m.select();
    } else if(!isH && digits.length===2){
      // минуты введены — переходим на часы следующего времени (конец)
      var form = pair.closest('form');
      var pairs = form ? Array.prototype.slice.call(form.querySelectorAll('.time-pair')) : [];
      var nx = pairs[pairs.indexOf(pair)+1];
      if(nx){
        var nh = nx.querySelector('.tp-h');
        nh.focus();
        nh.select();
      }
    }
  });
  app.addEventListener('keydown', function(ev){
    var t = ev.target;
    if(!isTP(t)) return;
    if(ev.key==='Backspace' && t.value===''){
      var curPair = t.closest('.time-pair');
      var target = null;
      if(t.classList.contains('tp-m')){
        target = curPair.querySelector('.tp-h');
      } else {
        // пустые часы конца -> назад к минутам начала
        var frm = curPair.closest('form');
        var prs = frm ? Array.prototype.slice.call(frm.querySelectorAll('.time-pair')) : [];
        var pv = prs[prs.indexOf(curPair)-1];
        if(pv) target = pv.querySelector('.tp-m');
      }
      if(target){
        ev.preventDefault();
        skipTimeSelect = true;
        target.focus();
        var len = target.value.length;
        try{ target.setSelectionRange(len, len); }catch(e){}
      }
    }
  });
  app.addEventListener('focusout', function(ev){
    var t = ev.target;
    if(!isTP(t)) return;
    var pair = t.closest('.time-pair');
    if(!pair) return;
    if(t.value.length===1) t.value = '0' + t.value;
    var next = ev.relatedTarget;
    if(!(next && pair.contains(next))){
      var h = pair.querySelector('.tp-h'), m = pair.querySelector('.tp-m');
      if(h.value && !m.value) m.value = '00';
      pair.classList.toggle('bad', !h.value && !!m.value);
    }
    syncTimePair(pair);
  });

  // ---------- мини-шапка (узкие экраны): появляется, когда основная шапка ушла вверх ----------
  var miniBar = null, miniShown = false, miniHideTimer = null;
  function ensureMiniBar(){
    if(miniBar) return miniBar;
    miniBar = document.createElement('div');
    miniBar.id = 'mini-bar';
    document.body.appendChild(miniBar);
    miniBar.addEventListener('click', function(ev){
      var el = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if(el && miniBar.contains(el)) handleAction(el, ev);
    });
    return miniBar;
  }
  function privBtnHtml(where){
    var on = state.privacy;
    var eye = on
      ? '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c5 0 8.6 4.2 9.7 6.2.2.5.2.9 0 1.3-.5.9-1.4 2.2-2.7 3.4M6.4 6.5C4.5 7.8 3.1 9.6 2.3 11c-.2.5-.2.9 0 1.3C3.4 14.3 7 18.5 12 18.5c1.8 0 3.4-.5 4.8-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M2.3 12.7c-.2-.5-.2-.9 0-1.4C3.4 9.2 7 5 12 5s8.6 4.2 9.7 6.3c.2.5.2.9 0 1.4C20.6 14.8 17 19 12 19s-8.6-4.2-9.7-6.3z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>';
    var label = on ? T('Показать суммы') : T('Скрыть суммы');
    return '<button class="icon-btn priv-btn '+(where||'')+(on?' on':'')+'" data-act="toggle-privacy" title="'+label+'" aria-label="'+label+'" aria-pressed="'+(on?'true':'false')+'">'+eye+'</button>';
  }
  function togglePrivacy(){
    state.privacy = !state.privacy;
    try{ localStorage.setItem(PRIV_KEY, state.privacy ? '1' : '0'); }catch(e){}
    var go = function(){ render(); };
    // плавная смена, как в iOS (если браузер умеет)
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(document.startViewTransition && !reduce && animMode()==='full') document.startViewTransition(go); else go();
    showToast(state.privacy ? T('Суммы скрыты') : T('Суммы показаны'));
  }
  function todayBtnHtml(){
    return '<button class="btn small today-btn" data-act="today" title="'+T('Сегодня')+'">'+
      '<span class="tb-full">'+T('Сегодня')+'</span><span class="tb-short">'+todayD().getDate()+'</span></button>';
  }
  function renderMiniBar(){
    var bar = ensureMiniBar();
    var vd = state.viewDate;
    bar.innerHTML =
      '<button class="icon-btn" data-act="open-menu" aria-label="'+T('Доски')+'">☰</button>'+
      T('<button class="icon-btn" data-act="prev-month" aria-label="Предыдущий месяц">‹</button>')+
      '<div class="label mono">'+periodLabel(true)+'</div>'+
      T('<button class="icon-btn" data-act="next-month" aria-label="Следующий месяц">›</button>')+
      todayBtnHtml();
    checkMiniBar();
  }
  function checkMiniBar(){
    if(!miniBar) return;
    var hdr = app.querySelector('header.top');
    var want = !!hdr && window.innerWidth <= 820 && hdr.getBoundingClientRect().bottom <= 0;
    if(want && !miniShown){
      miniShown = true;
      clearTimeout(miniHideTimer);
      miniBar.classList.remove('hiding');
      miniBar.classList.add('show');
    } else if(!want && miniShown){
      miniShown = false;
      miniBar.classList.remove('show');
      miniBar.classList.add('hiding');
      clearTimeout(miniHideTimer);
      miniHideTimer = setTimeout(function(){ miniBar.classList.remove('hiding'); }, 280);
    }
  }
  window.addEventListener('scroll', checkMiniBar, {passive: true});
  window.addEventListener('resize', function(){ checkMiniBar(); updateTruncation(); });
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(updateTruncation); }

  // Escape закрывает верхнее окно
  document.addEventListener('keydown', function(ev){
    // стрелки ← → листают месяцы, когда не открыто окно и курсор не в поле ввода
    if((ev.key==='ArrowLeft' || ev.key==='ArrowRight') && !ev.altKey && !ev.ctrlKey && !ev.metaKey){
      var tg = ev.target, tag = tg && tg.tagName;
      var typing = tag==='INPUT' || tag==='TEXTAREA' || tag==='SELECT' || (tg && tg.isContentEditable);
      if(!typing && !state.modal && !state.menuOpen && !anyDialog()){
        ev.preventDefault();
        changeMonth(ev.key==='ArrowRight' ? 1 : -1);
      }
      return;
    }
    if(ev.key!=='Escape') return;
    if(quick.open){ closeQuick(); return; }
    if(anyDialog()){ closeDialogs(); return; }
    if(state.modal || state.menuOpen){ closeTopModal(); }
  });

  applyTheme();
  applyAnimMode();
  ensureQuick();
  setInterval(updateNowHighlight, 15000);
  loadData();
}

// ---------- запуск: сначала подгружаем словарь выбранного языка из languages/ ----------
(function(){
  var lang = 'ru';
  try{
    var v = localStorage.getItem('lessoncal_lang');
    if(v==='ru' || v==='uk' || v==='en') lang = v;
    else {
      var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'en'];
      lang = 'en';
      for(var i=0;i<list.length;i++){
        var c = String(list[i]||'').toLowerCase().slice(0,2);
        if(c==='uk'){ lang = 'uk'; break; }
        if(c==='ru' || c==='be'){ lang = 'ru'; break; }
        if(c==='en'){ lang = 'en'; break; }
      }
    }
  }catch(e){}
  var loaded = window.LESSONCAL_I18N && window.LESSONCAL_I18N[lang];
  if(lang==='ru' || loaded){ lessoncalBoot(); return; }
  var started = false;
  var go = function(){ if(started) return; started = true; lessoncalBoot(); };
  var sc = document.createElement('script');
  sc.src = 'languages/' + lang + '.js';
  sc.onload = go;
  sc.onerror = go;           // нет файла (например, офлайн без кэша) — запускаемся по-русски
  setTimeout(go, 4000);      // на всякий случай не ждём вечно
  document.head.appendChild(sc);
})();
