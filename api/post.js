'use strict';
const sanitizeHtml = require('sanitize-html');
const { SUPABASE_URL, SUPABASE_KEY, SITE_URL } = require('./_cms-config');

function esc(v = '') {
  return String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function cleanHtml(value = '') {
  return sanitizeHtml(String(value), {
    allowedTags: ['p','br','h2','h3','h4','strong','b','em','i','ul','ol','li','blockquote','a','div'],
    allowedAttributes: { a: ['href','title','target','rel'] },
    allowedSchemes: ['http','https','mailto','tel'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (tagName, attribs) => {
        const out = { ...attribs };
        out.rel = 'noopener noreferrer';
        if (/^https?:/i.test(out.href || '')) out.target = '_blank';
        return { tagName, attribs: out };
      }
    }
  });
}

function videoEmbed(value = '') {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    let id = '';
    if (host === 'youtu.be') {
      id = u.pathname.split('/').filter(Boolean)[0] || '';
    } else if (['youtube.com','www.youtube.com','m.youtube.com'].includes(host)) {
      if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2] || '';
      else if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2] || '';
      else id = u.searchParams.get('v') || '';
    } else if (['vimeo.com','www.vimeo.com'].includes(host)) {
      id = u.pathname.split('/').filter(Boolean).pop() || '';
      if (/^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
      return '';
    }
    if (/^[A-Za-z0-9_-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
  } catch {}
  return '';
}

function fmtDate(v) {
  try { return new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(v)); }
  catch { return ''; }
}

function publicCache(res) {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed');
  }
  if (!SUPABASE_URL || SUPABASE_URL.startsWith('PASTE_') || !SUPABASE_KEY || SUPABASE_KEY.startsWith('PASTE_')) {
    return res.status(503).send('CMS not configured');
  }

  const slug = String(req.query.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 120);
  if (!slug) return res.status(404).send('Not found');

  const url = `${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*&limit=1`;
  try {
    const upstream = await fetch(url, { headers: { apikey: SUPABASE_KEY, Accept: 'application/json' } });
    const text = await upstream.text();
    if (!upstream.ok) {
      console.error('Supabase article error:', upstream.status, text.slice(0, 500));
      return res.status(502).send('Publication is temporarily unavailable.');
    }
    let posts;
    try { posts = JSON.parse(text); } catch { posts = []; }
    const p = Array.isArray(posts) ? posts[0] : null;
    if (!p) return res.status(404).send('<!doctype html><html><head><meta charset="utf-8"><title>Not found</title></head><body><h1>Publication not found.</h1></body></html>');

    const title = p.seo_title || `${p.title} | Arende Oriri & Associates Advocates`;
    const desc = p.seo_description || p.excerpt || '';
    const canonical = `${SITE_URL}/insights/${encodeURIComponent(p.slug)}`;
    const cover = p.cover_image || `${SITE_URL}/images/arende-oriri-social-card.png`;
    const embed = p.type === 'video' ? videoEmbed(p.video_url || '') : '';
    const share = encodeURIComponent(canonical);
    const shareTitle = encodeURIComponent(p.title);
    const articleBody = cleanHtml(p.content || '');
    const jsonld = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': p.type === 'news' ? 'NewsArticle' : (p.type === 'video' ? 'VideoObject' : 'Article'),
      headline: p.title,
      description: desc,
      image: [cover],
      datePublished: p.published_at,
      dateModified: p.updated_at || p.published_at,
      author: { '@type': 'Person', name: p.author || 'Kevin Arende Oriri' },
      publisher: { '@type': 'Organization', name: 'Arende Oriri & Associates Advocates', url: SITE_URL },
      mainEntityOfPage: canonical,
      ...(p.type === 'video' && embed ? { embedUrl: embed } : {})
    });

    const html = `<!doctype html><html lang="en-KE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(cover)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/images/arende-oriri-mark.png"><link rel="stylesheet" href="/assets/css/site.css"><link rel="stylesheet" href="/assets/css/pages.css"><link rel="stylesheet" href="/assets/css/cms.css"><script type="application/ld+json">${jsonld.replace(/</g,'\\u003c')}</script></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><div class="container nav-wrap"><a aria-label="Arende Oriri & Associates Advocates home" class="brand" href="/"><img alt="Arende Oriri & Associates Advocates" class="brand-wordmark" src="/images/arende-oriri-logo.png"></a><nav class="desktop-nav" aria-label="Primary navigation"><a href="/about.html">About</a><a href="/services.html">Services</a><a href="/team.html">Our Advocate</a><a href="/why-us.html">Why Us</a><a href="/insights.html">Insights</a><a href="/contact.html">Contact</a></nav><div class="nav-actions"><a class="button button-primary" href="/contact.html">Book a Consultation <span>↗</span></a><button aria-controls="mobile-menu" aria-expanded="false" aria-label="Open menu" class="menu-toggle" type="button"><span></span><span></span></button></div></div><div class="mobile-menu" hidden id="mobile-menu"><a href="/about.html">About <span>↗</span></a><a href="/services.html">Services <span>↗</span></a><a href="/team.html">Our Advocate <span>↗</span></a><a href="/why-us.html">Why Us <span>↗</span></a><a href="/insights.html">Insights <span>↗</span></a><a href="/contact.html">Contact <span>↗</span></a></div></header><main id="main-content"><section class="cms-article-hero"><div class="cms-article-shell"><div class="cms-article-kicker">${esc(p.type==='video'?'Video / Vlog':p.type==='news'?'News & Update':'Article / Blog')}</div><h1>${esc(p.title)}</h1><p class="cms-article-deck">${esc(p.excerpt||'')}</p><div class="cms-article-meta"><span>${esc(p.author||'Kevin Arende Oriri')}</span><span>${esc(fmtDate(p.published_at))}</span>${(p.tags||[]).slice(0,4).map(t=>`<span>${esc(t)}</span>`).join('')}</div></div>${p.cover_image?`<div class="cms-article-cover"><img src="${esc(p.cover_image)}" alt="${esc(p.title)}"></div>`:''}</section><div class="cms-article-main"><article class="cms-article-body">${embed?`<div class="cms-video"><iframe src="${esc(embed)}" title="${esc(p.title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`:''}${articleBody}<a class="cms-article-back" href="/insights.html">← Back to Insights & Media</a></article><aside class="cms-article-side"><div class="cms-share-title">Share this publication</div><div class="cms-share-links"><a target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${shareTitle}%20${share}">WhatsApp <span>↗</span></a><a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${share}">LinkedIn <span>↗</span></a><a target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?text=${shareTitle}&url=${share}">X <span>↗</span></a></div></aside></div></main><footer class="site-footer"><div class="container footer-top"><a class="brand brand-footer" href="/"><img alt="Arende Oriri & Associates Advocates" class="brand-wordmark" src="/images/arende-oriri-logo.png"></a><div class="footer-links"><div><span>Explore</span><a href="/about.html">About</a><a href="/services.html">Services</a><a href="/team.html">Our Advocate</a><a href="/insights.html">Insights & Media</a></div><div><span>Contact</span><a href="tel:+254722948247">Call +254 722 948 247</a><a href="https://wa.me/254722948247" target="_blank" rel="noopener noreferrer">WhatsApp</a></div><div><span>Legal</span><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms & Disclaimer</a></div></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Arende Oriri & Associates Advocates</span><span>Human rights · Public interest · Access to justice</span></div></footer><script src="/assets/js/site.js" type="module"></script></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    publicCache(res);
    return res.status(200).send(html);
  } catch (error) {
    console.error('Article API error:', error);
    return res.status(500).send('Unable to load publication');
  }
};
