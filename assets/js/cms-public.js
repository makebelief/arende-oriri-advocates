(() => {
'use strict';
const cfg = window.ARENDE_CMS || {};
const configured = cfg.supabaseUrl && !cfg.supabaseUrl.startsWith('PASTE_') && cfg.supabaseKey && !cfg.supabaseKey.startsWith('PASTE_');
const grid = document.querySelector('#cms-post-grid');
const homeGrid = document.querySelector('.insights .insight-grid');
const filters = [...document.querySelectorAll('[data-cms-filter]')];
const moreBtn = document.querySelector('#cms-load-more');
let activeType = 'all';
let page = 1;
let loading = false;
let currentItems = [];

function esc(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function fmtDate(v){if(!v)return '';try{return new Intl.DateTimeFormat('en-KE',{day:'numeric',month:'short',year:'numeric'}).format(new Date(v));}catch{return '';}}
function typeLabel(t){return ({article:'Article',news:'News & Update',video:'Video / Vlog'})[t]||'Insight';}
function placeholder(post){return post.type==='video' ? 'assets/media/insight-meeting.webp' : 'assets/media/desk-detail.webp';}
function card(post){const image=post.cover_image||placeholder(post);return `<a class="cms-post-card" href="/insights/${encodeURIComponent(post.slug)}" data-type="${esc(post.type)}"><div class="cms-card-media ${post.type==='video'?'is-video':''}"><img loading="lazy" decoding="async" src="${esc(image)}" alt="${esc(post.title)}"></div><div class="cms-card-body"><div class="cms-card-meta"><i></i>${esc(typeLabel(post.type))}</div><h3>${esc(post.title)}</h3><p>${esc(post.excerpt||'')}</p><div class="cms-card-footer"><span>${esc(fmtDate(post.published_at))}</span><strong>${post.type==='video'?'Watch':'Read'} →</strong></div></div></a>`;}
function render(){if(!grid)return;grid.innerHTML=currentItems.length?currentItems.map(card).join(''):'<div class="cms-empty">No published items in this category yet.</div>';}
async function fetchPage({reset=false}={}){
  if(!grid||loading)return;
  loading=true;
  if(reset){page=1;currentItems=[];grid.innerHTML='<div class="cms-empty">Loading publications…</div>';}
  if(moreBtn){moreBtn.disabled=true;moreBtn.textContent='Loading…';}
  try{
    const type=activeType==='all'?'':`&type=${encodeURIComponent(activeType)}`;
    const res=await fetch(`/api/posts?limit=9&page=${page}${type}`,{headers:{Accept:'application/json'}});
    if(!res.ok)throw new Error('Unable to load posts');
    const payload=await res.json();
    const items=Array.isArray(payload.items)?payload.items:[];
    currentItems=reset?items:currentItems.concat(items);
    render();
    if(moreBtn){moreBtn.hidden=!payload.hasMore;moreBtn.disabled=false;moreBtn.textContent='Load more';}
    if(payload.hasMore)page+=1;
  }catch(err){console.error('CMS:',err);if(!currentItems.length)grid.innerHTML='<div class="cms-empty">Latest publications are temporarily unavailable. Please try again shortly.</div>';if(moreBtn)moreBtn.hidden=true;}
  finally{loading=false;}
}
async function renderHome(){
  if(!homeGrid)return;
  try{
    const res=await fetch('/api/posts?limit=3&page=1',{headers:{Accept:'application/json'}});
    if(!res.ok)return;
    const payload=await res.json();
    const items=Array.isArray(payload.items)?payload.items:[];
    if(!items.length)return;
    homeGrid.innerHTML=items.map(post=>{const img=post.cover_image||placeholder(post);return `<article class="insight-card"><div class="insight-image"><img loading="lazy" decoding="async" alt="${esc(post.title)}" src="${esc(img)}"></div><span class="insight-type">${esc(typeLabel(post.type))}</span><h3>${esc(post.title)}</h3><a class="card-link" href="/insights/${encodeURIComponent(post.slug)}">${post.type==='video'?'Watch':'Read'} →</a></article>`;}).join('');
  }catch(err){console.error('CMS home:',err);}
}
if(!configured){if(grid)grid.innerHTML='<div class="cms-empty">Insights & Media publishing is being prepared. Existing resources remain available below.</div>';return;}
filters.forEach(btn=>btn.addEventListener('click',()=>{filters.forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');activeType=btn.dataset.cmsFilter;fetchPage({reset:true});}));
moreBtn?.addEventListener('click',()=>fetchPage());
fetchPage({reset:true});
renderHome();
})();
