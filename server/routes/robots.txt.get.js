export default defineEventHandler((event) => {
  const site = useRuntimeConfig().public.siteUrl.replace(/\/$/, '');

  setHeader(event, 'content-type', 'text/plain; charset=utf-8');
  setHeader(event, 'cache-control', 'public, max-age=86400');

  // Search and account pages carry no content worth indexing and would spend
  // crawl budget that belongs to song pages.
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /pretraga',
    'Disallow: /prijava',
    'Disallow: /registracija',
    'Disallow: /sacuvano',
    '',
    `Sitemap: ${site}/sitemap.xml`
  ].join('\n');
});
