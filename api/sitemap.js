'use strict';
const { SUPABASE_URL, SUPABASE_KEY, SITE_URL } = require('./_cms-config');
function xmlEsc(v=''){return String(v).replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]));}
module.exports = async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).send('');}
  if(!SUPABASE_URL||SUPABASE_URL.startsWith('PASTE_')||!SUPABASE_KEY||SUPABASE_KEY.startsWith('PASTE_'))return res.status(503).send('');
  try{
    const r=await fetch(`${SUPABASE_URL}/rest/v1/posts?status=eq.published&select=slug,updated_at,published_at&order=published_at.desc&limit=50000`,{headers:{apikey:SUPABASE_KEY,Accept:'application/json'}});
    const text=await r.text();
    if(!r.ok){console.error('Sitemap upstream error:',r.status,text.slice(0,500));return res.status(502).send('');}
    let posts=[];try{posts=JSON.parse(text);}catch{}
    const urls=(Array.isArray(posts)?posts:[]).map(p=>`<url><loc>${xmlEsc(SITE_URL+'/insights/'+p.slug)}</loc><lastmod>${xmlEsc((p.updated_at||p.published_at||'').slice(0,10))}</lastmod></url>`).join('');
    const xml=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
    res.setHeader('Content-Type','application/xml; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
    res.setHeader('Vercel-CDN-Cache-Control','public, s-maxage=600, stale-while-revalidate=3600, stale-if-error=86400');
    return res.status(200).send(xml);
  }catch(e){console.error('Sitemap API error:',e);return res.status(500).send('');}
};
