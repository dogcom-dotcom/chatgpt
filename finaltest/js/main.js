// js/main.js — версия с авто‑фоллбеком форматов для OP/HERO
(function(){
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  // ========= НАСТРОЙКИ =========
  // порядок попыток форматов для локальных картинок
  const EXT_ORDER = ['svg','webp','png','jpg','jpeg'];

  // ======= STATIC (редко меняется): OP =======
  // <-- ВАЖНО: теперь указываем basename без расширения -->
  const OPPS = [
    {
      id:'op1',
      title:'Rotate stake to low-MEV, high-uptime validators',
      cat:'staking',
      imgBase:'op-01',
      desc:'Rebalance into validators with low MEV leakage and stable uptime; monthly auto-compound enabled.',
      tags:['MEV','uptime','autocompound'],
      cta:{label:'Open allocation', href:'#'}
    },
    {
      id:'op2',
      title:'Hivemapper: EU routes with boosted rewards',
      cat:'depin',
      imgBase:'op-02',
      desc:'Reserved Bee-cam routes with weekly HONEY payouts; limited driver slots across key metros.',
      tags:['Hivemapper','routes','HONEY'],
      cta:{label:'Get a slot', href:'#'}
    },
    {
      id:'op3',
      title:'Jito DAO vote on Block Engine fee routing',
      cat:'governance',
      imgBase:'op-03',
      desc:'Coordinate stance on JIP-24 to route 100% Block Engine and BAM fees to the DAO treasury.',
      tags:['Jito','JIP-24','DAO'],
      cta:{label:'Join discussion', href:'#'}
    }
  ];

  // ======= CONTENT (меняешь руками в /data/*.json) =======
  async function loadJSON(path) {
    const res = await fetch(path, { cache:"no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
    return res.json();
  }

  // Footer year
  $('#year') && ($('#year').textContent = new Date().getFullYear());

  // Mobile menu
  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('hidden');
      menuBtn.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  // Reveal-on-scroll
  const revealEls = $$('[data-reveal]');
  if (revealEls.length && !prefersReduce) {
    const io = new IntersectionObserver((entries)=>{
      entries.forEach((e)=>{
        if(e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, {threshold:.12});
    revealEls.forEach(el=>io.observe(el));
  } else {
    revealEls.forEach(el=>el.classList.add('in'));
  }

  // Hover FX
  function attachMouseFX(el){
    el.addEventListener('pointermove', (e)=>{
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((e.clientX-r.left)/r.width)*100}%`);
      el.style.setProperty('--my', `${((e.clientY-r.top)/r.height)*100}%`);
    });
    el.addEventListener('pointerleave', ()=>{
      el.style.removeProperty('--mx'); el.style.removeProperty('--my');
    });
  }
  function tilt(el){
    let raf=0;
    el.addEventListener('pointermove', (e)=>{
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        el.style.transform = `perspective(800px) rotateX(${(-py*4).toFixed(2)}deg) rotateY(${(px*6).toFixed(2)}deg) translateY(-4px)`;
      });
    });
    el.addEventListener('pointerleave', ()=>{ el.style.transform=''; });
  }

  // Counters
  function animateCounter(el, to){
    if(!el || typeof to!=='number') return;
    const dur = prefersReduce ? 0 : 900;
    const start = performance.now();
    const from = Number(el.textContent)||0;
    const diff = to - from;
    function frame(now){
      const p = dur ? Math.min(1, (now-start)/dur) : 1;
      const eased = 1 - Math.pow(1-p, 3);
      el.textContent = Math.round(from + diff * eased).toLocaleString();
      if(p<1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ====== IMAGE FALLBACKS (svg -> webp -> png -> jpg) ======
  function setWithFallback(imgEl, baseName, folder='assets'){
    let i = 0;
    function tryNext(){
      if(i >= EXT_ORDER.length) return;
      imgEl.src = `${folder}/${baseName}.${EXT_ORDER[i]}`;
    }
    imgEl.addEventListener('error', ()=>{
      i++;
      if(i < EXT_ORDER.length) tryNext();
    }, { once:false });
    tryNext();
  }

  // Render OP
  function oppCard(o){
    const tagHtml = o.tags.map(t=>`<span class="chip">${esc(t)}</span>`).join(' ');
    // ставим data-base, чтобы навесить фоллбеки после вставки
    return `
      <article class="card" data-cat="${esc(o.cat)}" data-reveal>
        <img class="card-img" data-base="${esc(o.imgBase)}" alt="${esc(o.title)}" loading="lazy" decoding="async">
        <div class="card-body">
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-semibold">${esc(o.title)}</h3>
            <span class="chip text-white/70 capitalize">${esc(o.cat)}</span>
          </div>
          <p class="text-white/70 mt-2">${esc(o.desc)}</p>
          <div class="mt-3 flex flex-wrap gap-2">${tagHtml}</div>
          <div class="mt-4 flex items-center gap-2">
            <a class="btn-ghost" href="${o.cta.href}">${esc(o.cta.label)}</a>
            <button class="btn-primary" data-open-modal>Details</button>
          </div>
        </div>
      </article>`;
  }
  function renderOpps(list=OPPS){
    const grid = $('#oppsGrid');
    if(!grid) return;
    grid.innerHTML = list.map(oppCard).join('');
    // подключаем эффекты
    $$('.card', grid).forEach(attachMouseFX);
    if(!prefersReduce) $$('.card', grid).forEach(tilt);
    $$('.card[data-reveal]', grid).forEach(el=>el.classList.add('in'));
    // ставим картинки с фоллбэком
    $$('.card-img[data-base]', grid).forEach(img=>{
      setWithFallback(img, img.dataset.base, 'assets');
    });
  }

  // Filters
  function bindFilters(){
    const tabs = $$('.tab-btn');
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

  // News
  const NEWS_PLACEHOLDERS = [
    'assets/news-default-1.webp',
    'assets/news-default-2.webp',
    'assets/news-default-3.webp'
  ];
  function pickNewsPlaceholder(){
    return NEWS_PLACEHOLDERS[Math.floor(Math.random()*NEWS_PLACEHOLDERS.length)] || '';
  }
  function newsCard(n){
    const img = n.image || pickNewsPlaceholder();
    const date = n.date ? new Date(n.date).toLocaleDateString(undefined,{month:'short', day:'numeric'}) : '';
    const safeTitle = esc(n.title);
    const source = esc(n.source || '');
    const href = n.url || '#';
    return `
      <article class="card" data-reveal>
        <img class="card-img" src="${esc(img)}" alt="${safeTitle}" loading="lazy" decoding="async">
        <div class="card-body">
          <div class="flex items-center justify-between text-xs text-white/50">
            <span>${source}</span><span>${esc(date)}</span>
          </div>
          <h3 class="font-semibold mt-2">${safeTitle}</h3>
          ${href !== '#' ? `<a class="btn-ghost mt-3 inline-block" href="${esc(href)}" target="_blank" rel="noopener">Read</a>` : ''}
        </div>
      </article>`;
  }
  function renderNews(items){
    const grid = $('#newsGrid');
    if(!grid) return;
    grid.innerHTML = (items||[]).slice(0,9).map(newsCard).join('');
    $$('.card[data-reveal]', grid).forEach(el=>el.classList.add('in'));
  }

  // Bootstrap
  (async function init(){
    renderOpps(OPPS); bindFilters();

    // STATS & NEWS from local /data
    try{
      const stats = await loadJSON('data/stats.json');
      animateCounter($('#stat-live'), stats.live ?? stats.active ?? stats.opportunities ?? 0);
      animateCounter($('#stat-claim'), stats.claim ?? stats.claims ?? 0);
      animateCounter($('#stat-upcoming'), stats.upcoming ?? 0);
      animateCounter($('#stat-users'), stats.online ?? stats.users ?? 0);
    }catch(e){
      console.warn('Failed to load stats.json', e);
    }

    try{
      const news = await loadJSON('data/news.json');
      renderNews(news);
    }catch(e){
      console.warn('Failed to load news.json', e);
      renderNews([]); // пусто — просто скелетоны исчезнут
    }
  })();

  // Modal hook delegation (оставляем фичу)
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-open-modal]');
    if(btn && typeof window.openModal === 'function') window.openModal();
  });
})();
