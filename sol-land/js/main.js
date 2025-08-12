(()=>{
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

$('#year')?.textContent=new Date().getFullYear();

const menuBtn=$('#menuBtn');
const mobileMenu=$('#mobileMenu');
if(menuBtn && mobileMenu){
  menuBtn.addEventListener('click',()=>{
    const open=mobileMenu.classList.toggle('open');
    if(open) mobileMenu.classList.remove('hidden');
    else setTimeout(()=>mobileMenu.classList.add('hidden'),300);
    menuBtn.setAttribute('aria-expanded',open);
  });
}

const reveals=$$('[data-reveal]');
if(reduceMotion){reveals.forEach(el=>el.classList.add('revealed'));}else{
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const idx=Number(e.target.dataset.idx)||0;
        e.target.style.setProperty('--delay',`${idx*100}`);
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  },{threshold:.15});
  reveals.forEach((el,i)=>{el.dataset.idx=i;io.observe(el);});
}

function bindShine(el){
  el.addEventListener('pointermove',e=>{
    const rect=el.getBoundingClientRect();
    const x=((e.clientX-rect.left)/rect.width)*100;
    const y=((e.clientY-rect.top)/rect.height)*100;
    el.style.setProperty('--mx',x+'%');
    el.style.setProperty('--my',y+'%');
  });
}
$$('.btn-primary, .btn-ghost, .card').forEach(bindShine);

function bindTilt(card){
  if(reduceMotion) return;
  card.addEventListener('pointermove',e=>{
    const rect=card.getBoundingClientRect();
    const x=(e.clientX-rect.left-rect.width/2)/rect.width;
    const y=(e.clientY-rect.top-rect.height/2)/rect.height;
    card.style.setProperty('--rx',`${-y*6}deg`);
    card.style.setProperty('--ry',`${x*6}deg`);
  });
  card.addEventListener('pointerleave',()=>{
    card.style.setProperty('--rx','0deg');
    card.style.setProperty('--ry','0deg');
  });
}
$$('.card').forEach(bindTilt);

const heroMedia=$('.hero-media');
if(heroMedia && !reduceMotion){
  const max=40;let ticking=false;
  const handle=()=>{heroMedia.style.transform=`translateY(${Math.min(window.scrollY*0.1,max)}px)`;ticking=false;};
  window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(handle);ticking=true;}});
}

function animateCounter(el,to){
  const dur=1000,start=performance.now();
  const from=Number(el.textContent)||0,diff=to-from;
  function frame(now){
    const p=Math.min(1,(now-start)/dur);
    const eased=1-Math.pow(1-p,3);
    el.textContent=Math.round(from+diff*eased).toLocaleString();
    if(p<1)requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

async function loadStats(){
  try{
    const r=await fetch(window.SOL_DATA?.STATS_URL,{cache:'no-store'});
    if(!r.ok) throw 0;
    const s=await r.json();
    const map={
      live:s.live??s.active??s.opportunities??3,
      claim:s.claim??s.claims??1200,
      upcoming:s.upcoming??4,
      users:s.online??s.users??128
    };
    animateCounter($('#stat-live'),Number(map.live)||0);
    animateCounter($('#stat-claim'),Number(map.claim)||0);
    animateCounter($('#stat-upcoming'),Number(map.upcoming)||0);
    animateCounter($('#stat-users'),Number(map.users)||0);
  }catch(e){
    animateCounter($('#stat-live'),3);
    animateCounter($('#stat-claim'),1200);
    animateCounter($('#stat-upcoming'),4);
    animateCounter($('#stat-users'),128);
  }
}

const OPPS=[
  {
    title:"Rotate stake to low-MEV, high-uptime validators",
    desc:"Rebalance into validators with low MEV leakage and stable uptime; monthly auto-compound enabled.",
    cat:"staking",
    tags:["MEV","uptime","autocompound"],
    ctaLabel:"Open allocation",
    image:window.SOL_DATA?.RAW_ASSETS?.OP_01
  },
  {
    title:"Hivemapper: EU routes with boosted rewards",
    desc:"Reserved Bee-cam routes with weekly HONEY payouts; limited driver slots across key metros.",
    cat:"depin",
    tags:["Hivemapper","routes","HONEY"],
    ctaLabel:"Get a slot",
    image:window.SOL_DATA?.RAW_ASSETS?.OP_02
  },
  {
    title:"Jito DAO vote on Block Engine fee routing",
    desc:"Coordinate stance on JIP-24 to route 100% Block Engine and BAM fees to the DAO treasury.",
    cat:"governance",
    tags:["Jito","JIP-24","DAO"],
    ctaLabel:"Join discussion",
    image:window.SOL_DATA?.RAW_ASSETS?.OP_03
  }
];
function oppCard(o){
  const card=document.createElement('article');
  card.className='card';
  card.dataset.cat=o.cat;
  card.innerHTML=`
    <img class="card-img" src="${o.image}" alt="${o.title}" loading="lazy" decoding="async">
    <div class="card-body">
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-semibold">${o.title}</h3>
        <span class="chip text-white/70 capitalize">${o.cat}</span>
      </div>
      <p class="text-white/70 mt-2">${o.desc}</p>
      <div class="mt-3 flex flex-wrap gap-2">${o.tags.map(t=>`<span class="chip">${t}</span>`).join('')}</div>
      <div class="mt-4 flex items-center gap-2">
        <a class="btn-ghost" href="#">${o.ctaLabel}</a>
        <button class="btn-primary" data-open-modal>Details</button>
      </div>
    </div>`;
  bindShine(card);bindTilt(card);
  card.querySelectorAll('.btn-primary,.btn-ghost').forEach(bindShine);
  return card;
}
function renderOpps(list){
  const grid=$('#oppsGrid');if(!grid) return;
  grid.innerHTML='';list.forEach(o=>grid.appendChild(oppCard(o)));
}

function bindFilters(){
  const tabs=$$('.tab-btn');
  const grid=$('#oppsGrid');
  tabs.forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(btn.classList.contains('active')) return;
      tabs.forEach(t=>{t.classList.remove('active');t.setAttribute('aria-selected','false');});
      btn.classList.add('active');btn.setAttribute('aria-selected','true');
      const f=btn.dataset.filter;
      grid.classList.add('fade');
      setTimeout(()=>{
        const list=f==='all'?OPPS:OPPS.filter(o=>o.cat===f);
        renderOpps(list);
        grid.classList.remove('fade');
      },200);
    });
  });
}

function pickNewsPlaceholder(){
  const arr=window.SOL_DATA?.RAW_ASSETS?.NEWS_DEFAULTS||[];
  return arr[Math.floor(Math.random()*arr.length)]||'';
}
function newsCard(n){
  const img=n.image||pickNewsPlaceholder();
  const date=n.date?new Date(n.date).toLocaleDateString(undefined,{month:'short',day:'numeric'}):'';
  const safeTitle=(n.title||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const source=n.source||'';const href=n.url||'#';
  const el=document.createElement('article');
  el.className='card';
  el.innerHTML=`
    <img class="card-img" src="${img}" alt="${safeTitle}" loading="lazy" decoding="async">
    <div class="card-body">
      <div class="flex items-center justify-between text-xs text-white/50">
        <span>${source}</span><span>${date}</span>
      </div>
      <h3 class="font-semibold mt-2">${safeTitle}</h3>
      ${href!=='#'?`<a class="btn-ghost mt-3 inline-block" href="${href}" target="_blank" rel="noopener">Read</a>`:''}
    </div>`;
  el.querySelectorAll('.btn-ghost').forEach(bindShine);bindShine(el);bindTilt(el);
  return el;
}
async function loadNews(){
  const grid=$('#newsGrid');if(!grid) return;
  try{
    const r=await fetch(window.SOL_DATA?.NEWS_URL,{cache:'no-store'});
    if(!r.ok) throw 0;
    const items=await r.json();
    const sliced=Array.isArray(items)?items.slice(0,9):[];if(!sliced.length) throw 0;
    grid.innerHTML='';sliced.forEach(n=>grid.appendChild(newsCard(n)));
  }catch(e){
    const fallback=[
      {title:'Validator fee markets deepen on Solana',source:'Ecosystem',date:new Date().toISOString()},
      {title:'DePIN projects expand edge coverage',source:'Community',date:new Date().toISOString()},
      {title:'Governance power leasing heats up',source:'Research',date:new Date().toISOString()}
    ];
    grid.innerHTML='';fallback.forEach(n=>grid.appendChild(newsCard(n)));
  }
}

const modal=$('#joinModal');
const modalClose=$('#modalClose');
let lastFocus=null,focusables=[];
function cacheFocusables(){
  focusables=$$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"] )',modal).filter(el=>!el.disabled);
}
function trapTab(e){
  if(!modal.classList.contains('open')) return;
  if(e.key==='Escape'){closeModal();return;}
  if(e.key!=='Tab') return;
  const first=focusables[0],last=focusables[focusables.length-1];
  if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
}
function openModal(){
  if(!modal) return;
  lastFocus=document.activeElement;modal.classList.add('open');modal.removeAttribute('aria-hidden');
  cacheFocusables();document.addEventListener('keydown',trapTab);setTimeout(()=>focusables[0]?.focus(),0);
}
function closeModal(){
  if(!modal) return;
  modal.classList.remove('open');modal.setAttribute('aria-hidden','true');
  document.removeEventListener('keydown',trapTab);lastFocus?.focus();focusables=[];
}
window.openModal=openModal;
modal?.addEventListener('click',e=>{if(e.target===modal)closeModal();});
modalClose?.addEventListener('click',closeModal);
document.addEventListener('click',e=>{const btn=e.target.closest('[data-open-modal]');if(btn)openModal();});
$('#connectWalletBtn')?.addEventListener('click',()=>{alert('Wallet connect placeholder — plug in your wallet SDK here.');});
$('#inviteForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  const email=$('#email').value.trim();
  const note=$('#inviteNote');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    note.textContent='Please enter a valid email.';
    note.classList.remove('text-white/50');note.classList.add('text-red-300');
    return;
  }
  note.classList.remove('text-red-300');note.classList.add('text-white/50');
  note.textContent='Thanks! We have received your request.';
  e.target.reset();
});

renderOpps(OPPS);
bindFilters();
loadStats();
loadNews();
})();
