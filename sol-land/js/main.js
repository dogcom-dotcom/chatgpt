(function(){
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

  // Год в футере
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Мобильное меню
  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const hidden = mobileMenu.classList.toggle('hidden');
      menuBtn.setAttribute('aria-expanded', String(!hidden));
    });
  }

  // Появление блоков при скролле
  const obs = new IntersectionObserver(entries=>{
    for(const e of entries){
      if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); }
    }
  }, {threshold: .12});
  $$('[data-reveal]').forEach(el=>obs.observe(el));

  // -------- Modal
  const modal = $('#joinModal');
  const modalClose = $('#modalClose');
  let lastFocus = null;

  function trapTab(e){
    if(!modal.classList.contains('open')) return;
    if(e.key === 'Escape'){ closeModal(); return; }
    if(e.key !== 'Tab') return;
    const focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal)
      .filter(el=>!el.hasAttribute('disabled'));
    const first = focusables[0], last = focusables[focusables.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  function openModal(){
    if(!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.removeAttribute('aria-hidden');
    document.addEventListener('keydown', trapTab);
    // фокус на первую кнопку
    setTimeout(()=>$('#connectWalletBtn')?.focus(), 0);
  }
  function closeModal(){
    if(!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.removeEventListener('keydown', trapTab);
    lastFocus?.focus();
  }

  // Экспортируем для поддержки существующих onclick в HTML
  window.openModal = openModal;

  modal?.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
  modalClose?.addEventListener('click', closeModal);

  // Кнопки в hero/header с inline onclick уже есть; добавим и делегаты на карточках
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-open-modal]');
    if(btn) openModal();
  });

  // Плейсхолдер подключения кошелька
  $('#connectWalletBtn')?.addEventListener('click', ()=>{
    alert('Wallet connect placeholder — plug in your wallet SDK here.');
  });

  // Форма инвайта
  $('#inviteForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = $('#email').value.trim();
    const note = $('#inviteNote');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      note.textContent = 'Please enter a valid email.';
      note.classList.remove('text-white/50'); note.classList.add('text-red-300');
      return;
    }
    note.classList.remove('text-red-300'); note.classList.add('text-white/50');
    note.textContent = 'Thanks! We have received your request.';
    e.target.reset();
  });

  // -------- Данные / счётчики
  function animateCounter(el, to){
    const dur = 800, start = performance.now();
    const from = Number(el.textContent)||0;
    const diff = to - from;
    function frame(now){
      const p = Math.min(1, (now-start)/dur);
      el.textContent = Math.round(from + diff * (1 - Math.pow(1-p, 3))).toLocaleString();
      if(p<1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  async function loadStats(){
    try{
      const r = await fetch(window.SOL_DATA?.STATS_URL, {cache:'no-store'});
      if(!r?.ok) throw new Error('Stats fetch failed');
      const s = await r.json();
      const map = {
        live: s.live ?? s.active ?? s.opportunities ?? 3,
        claim: s.claim ?? s.claims ?? 1200,
        upcoming: s.upcoming ?? 4,
        users: s.online ?? s.users ?? 128
      };
      animateCounter($('#stat-live'), Number(map.live)||0);
      animateCounter($('#stat-claim'), Number(map.claim)||0);
      animateCounter($('#stat-upcoming'), Number(map.upcoming)||0);
      animateCounter($('#stat-users'), Number(map.users)||0);
    }catch(e){
      // дефолтные значения
      animateCounter($('#stat-live'), 3);
      animateCounter($('#stat-claim'), 1200);
      animateCounter($('#stat-upcoming'), 4);
      animateCounter($('#stat-users'), 128);
    }
  }

  // -------- Opportunities
  const OPPS = [
    {
      id:'op1', title:'Validator Syndicate: Priority Fee Share',
      cat:'staking', img: window.SOL_DATA?.RAW_ASSETS?.OP_01,
      desc:'Access pooled validator slots with negotiated fee share and MEV rebate.',
      tags:['Validator','Yield','Whitelist'],
      cta:{label:'Stake via Syndicate', href:'#'}
    },
    {
      id:'op2', title:'DePIN x Solana: Edge Node Program',
      cat:'depin', img: window.SOL_DATA?.RAW_ASSETS?.OP_02,
      desc:'Bootstrap an edge node with subsidized hardware and liquid rewards.',
      tags:['DePIN','Hardware','Subsidy'],
      cta:{label:'Launch Node', href:'#'}
    },
    {
      id:'op3', title:'Governance Bloc: Voting Power Market',
      cat:'governance', img: window.SOL_DATA?.RAW_ASSETS?.OP_03,
      desc:'Aggregate and lease governance power across strategic protocols.',
      tags:['DAO','Gov','Liquidity'],
      cta:{label:'Join Bloc', href:'#'}
    }
  ];

  function oppCard(o){
    const tagHtml = o.tags.map(t=>`<span class="chip">${t}</span>`).join(' ');
    return `
      <article class="card" data-cat="${o.cat}">
        <img class="card-img" src="${o.img}" alt="${o.title}" loading="lazy" decoding="async">
        <div class="card-body">
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-semibold">${o.title}</h3>
            <span class="chip text-white/70 capitalize">${o.cat}</span>
          </div>
          <p class="text-white/70 mt-2">${o.desc}</p>
          <div class="mt-3 flex flex-wrap gap-2">${tagHtml}</div>
          <div class="mt-4 flex items-center gap-2">
            <a class="btn-ghost" href="${o.cta.href}">${o.cta.label}</a>
            <button class="btn-primary" data-open-modal>Details</button>
          </div>
        </div>
      </article>`;
  }

  function renderOpps(list=OPPS){
    const grid = $('#oppsGrid');
    if(!grid) return;
    grid.innerHTML = list.map(oppCard).join('');
  }

  function bindFilters(){
    const tabs = $$('.tab-btn');
    const grid = $('#oppsGrid');
    if(!grid) return;
    tabs.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        tabs.forEach(t=>{ t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
        btn.classList.add('active'); btn.setAttribute('aria-selected','true');
        const f = btn.dataset.filter;
        if(f==='all'){ renderOpps(OPPS); }
        else{ renderOpps(OPPS.filter(o=>o.cat===f)); }
      });
    });
  }

  // -------- News
  function pickNewsPlaceholder(){
    const arr = window.SOL_DATA?.RAW_ASSETS?.NEWS_DEFAULTS || [];
    return arr[Math.floor(Math.random()*arr.length)] || '';
  }
  function newsCard(n){
    const img = n.image || pickNewsPlaceholder();
    const date = n.date ? new Date(n.date).toLocaleDateString(undefined,{month:'short', day:'numeric'}) : '';
    const safeTitle = (n.title||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const source = n.source || '';
    const href = n.url || '#';
    return `
      <article class="card">
        <img class="card-img" src="${img}" alt="${safeTitle}" loading="lazy" decoding="async">
        <div class="card-body">
          <div class="flex items-center justify-between text-xs text-white/50">
            <span>${source}</span><span>${date}</span>
          </div>
          <h3 class="font-semibold mt-2">${safeTitle}</h3>
          ${href !== '#' ? `<a class="btn-ghost mt-3 inline-block" href="${href}" target="_blank" rel="noopener">Read</a>` : ''}
        </div>
      </article>`;
  }
  async function loadNews(){
    const grid = $('#newsGrid');
    if(!grid) return;
    try{
      const r = await fetch(window.SOL_DATA?.NEWS_URL, {cache:'no-store'});
      if(!r?.ok) throw new Error('News fetch failed');
      const items = await r.json();
      const sliced = Array.isArray(items) ? items.slice(0,9) : [];
      if(!sliced.length) throw new Error('No news');
      grid.innerHTML = sliced.map(newsCard).join('');
    }catch(e){
      const fallback = [
        {title:'Validator fee markets deepen on Solana', source:'Ecosystem', date:new Date().toISOString()},
        {title:'DePIN projects expand edge coverage', source:'Community', date:new Date().toISOString()},
        {title:'Governance power leasing heats up', source:'Research', date:new Date().toISOString()},
      ];
      grid.innerHTML = fallback.map(newsCard).join('');
    }
  }

  // -------- Boot
  renderOpps(OPPS);
  bindFilters();
  loadStats();
  loadNews();

})();
