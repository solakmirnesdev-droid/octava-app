/**
 * Sitemap, generated from the catalogue at request time.
 *
 * With a thousand song pages, discovery is the difference between being
 * indexed and being invisible: nothing on the site links to every song, so a
 * crawler following links alone would never reach most of them.
 *
 * Cached briefly rather than per-request, since building it walks the whole
 * catalogue and the contents change on the order of days, not seconds.
 */
const CACHE_SECONDS = 3600;

const escape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

function entry(loc, { lastmod, changefreq, priority } = {}) {
  return [
    '  <url>',
    `    <loc>${escape(loc)}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>'
  ].filter(Boolean).join('\n');
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const site = config.public.siteUrl.replace(/\/$/, '');

  const urls = [
    entry(`${site}/`, { changefreq: 'daily', priority: '1.0' }),
    entry(`${site}/izvodjaci`, { changefreq: 'weekly', priority: '0.8' }),
    entry(`${site}/akordi`, { changefreq: 'monthly', priority: '0.7' })
  ];

  try {
    const [songs, artists, genres] = await Promise.all([
      $fetch('/songs', { baseURL: config.apiBase, params: { limit: 100, sort: 'recent' } }),
      $fetch('/artists', { baseURL: config.apiBase, params: { limit: 100 } }),
      $fetch('/genres', { baseURL: config.apiBase })
    ]);

    // Paginate through the rest of the catalogue rather than asking for
    // everything at once; the API caps a single page at a hundred.
    const pages = songs.meta?.pages || 1;
    const all = [...(songs.songs || [])];

    for (let page = 2; page <= pages; page++) {
      const next = await $fetch('/songs', {
        baseURL: config.apiBase,
        params: { limit: 100, page, sort: 'recent' }
      });
      all.push(...(next.songs || []));
    }

    for (const song of all) {
      urls.push(entry(`${site}/pjesma/${song.slug}`, {
        lastmod: song.updatedAt,
        changefreq: 'monthly',
        priority: '0.9'
      }));
    }

    for (const artist of artists.artists || []) {
      urls.push(entry(`${site}/izvodjac/${artist.slug}`, { changefreq: 'weekly', priority: '0.7' }));
    }

    for (const genre of genres.genres || []) {
      urls.push(entry(`${site}/zanr/${genre.slug}`, { changefreq: 'weekly', priority: '0.7' }));
    }
  } catch {
    // A sitemap listing only the stable pages beats a 500: a crawler that gets
    // an error may back off from requesting it again for a long time.
  }

  setHeader(event, 'content-type', 'application/xml; charset=utf-8');
  setHeader(event, 'cache-control', `public, max-age=${CACHE_SECONDS}`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
});
