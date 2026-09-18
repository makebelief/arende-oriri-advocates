'use strict';
const { SUPABASE_URL, SUPABASE_KEY } = require('./_cms-config');

function publicCache(res, seconds = 60) {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=300, stale-if-error=86400`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!SUPABASE_URL || SUPABASE_URL.startsWith('PASTE_') || !SUPABASE_KEY || SUPABASE_KEY.startsWith('PASTE_')) {
    return res.status(503).json({ error: 'CMS not configured' });
  }

  const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '12', 10) || 12, 1), 24);
  const page = Math.min(Math.max(Number.parseInt(req.query.page || '1', 10) || 1, 1), 10000);
  const offset = (page - 1) * limit;
  const fetchLimit = limit + 1;
  const type = ['article', 'news', 'video'].includes(req.query.type) ? req.query.type : '';
  const typeFilter = type ? `&type=eq.${encodeURIComponent(type)}` : '';
  const url = `${SUPABASE_URL}/rest/v1/posts?status=eq.published${typeFilter}` +
    `&select=id,title,slug,excerpt,type,cover_image,video_url,author,tags,featured,published_at,updated_at` +
    `&order=featured.desc,published_at.desc&offset=${offset}&limit=${fetchLimit}`;

  try {
    const upstream = await fetch(url, { headers: { apikey: SUPABASE_KEY, Accept: 'application/json' } });
    const text = await upstream.text();
    if (!upstream.ok) {
      console.error('Supabase posts error:', upstream.status, text.slice(0, 500));
      return res.status(502).json({ error: 'Unable to load publications' });
    }
    let rows;
    try { rows = JSON.parse(text); } catch { rows = []; }
    const items = Array.isArray(rows) ? rows.slice(0, limit) : [];
    publicCache(res, 60);
    return res.status(200).json({ items, page, hasMore: Array.isArray(rows) && rows.length > limit });
  } catch (error) {
    console.error('Posts API error:', error);
    return res.status(500).json({ error: 'Unable to load publications' });
  }
};
