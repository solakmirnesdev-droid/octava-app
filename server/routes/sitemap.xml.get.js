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

  /**
   * Both catalogues, not just the Bosnian one.
   *
   * The English half is a separate set of URLs with its own translated paths;
   * listing only the Bosnian side left every /en page to be found by chance,
   * which for a site split this way means largely not found at all.
   *
   * Paths are written out rather than derived, because they are translated —
   * /akordi is /en/chords, not /en/akordi — and the mapping lives in
   * nuxt.config. Anything added there belongs here too.
   */
  const STATIC_PAGES = [
    { bs: '/',            en: '/en',           changefreq: 'daily',   priority: '1.0' },
    { bs: '/izvodjaci',   en: '/en/artists',   changefreq: 'weekly',  priority: '0.8' },
    { bs: '/akordi',      en: '/en/chords',    changefreq: 'monthly', priority: '0.7' },
    { bs: '/stimer',      en: '/en/tuner',     changefreq: 'monthly', priority: '0.6' },
    { bs: '/zatrazi',     en: '/en/request',   changefreq: 'weekly',  priority: '0.5' },
    { bs: '/o-nama',      en: '/en/about',     changefreq: 'yearly',  priority: '0.4' },
    { bs: '/privatnost',  en: '/en/privacy',   changefreq: 'yearly',  priority: '0.3' },
    { bs: '/uslovi',      en: '/en/terms',     changefreq: 'yearly',  priority: '0.3' }
  ];

  /** Dynamic paths differ per locale in the same way. */
  const SECTIONS = {
    song:   { bs: 'pjesma',    en: 'en/song' },
    artist: { bs: 'izvodjac',  en: 'en/artist' },
    genre:  { bs: 'zanr',      en: 'en/genre' }
  };

  const urls = [];
  for (const page of STATIC_PAGES) {
    const { changefreq, priority } = page;
    urls.push(entry(`${site}${page.bs}`, { changefreq, priority }));
    urls.push(entry(`${site}${page.en}`, { changefreq, priority }));
  }

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
      const opts = { lastmod: song.updatedAt, changefreq: 'monthly', priority: '0.9' };
      urls.push(entry(`${site}/${SECTIONS.song.bs}/${song.slug}`, opts));
      urls.push(entry(`${site}/${SECTIONS.song.en}/${song.slug}`, opts));
    }

    for (const artist of artists.artists || []) {
      const opts = { changefreq: 'weekly', priority: '0.7' };
      urls.push(entry(`${site}/${SECTIONS.artist.bs}/${artist.slug}`, opts));
      urls.push(entry(`${site}/${SECTIONS.artist.en}/${artist.slug}`, opts));
    }

    for (const genre of genres.genres || []) {
      const opts = { changefreq: 'weekly', priority: '0.7' };
      urls.push(entry(`${site}/${SECTIONS.genre.bs}/${genre.slug}`, opts));
      urls.push(entry(`${site}/${SECTIONS.genre.en}/${genre.slug}`, opts));
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
