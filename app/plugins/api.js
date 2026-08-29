/**
 * A $fetch instance that behaves correctly on both sides of SSR.
 *
 * In the browser the request is same-origin, so the session cookie rides along
 * automatically. On the server there is no browser to do that, so the incoming
 * request's cookie header is copied onto the outgoing API call — without it,
 * every page would server-render as signed out and then flip once hydrated.
 */
import { readToken } from '~/utils/native';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  // Read the incoming headers here, in the plugin's setup context. Calling a
  // composable from inside onRequest would run outside the Nuxt instance and
  // throw, failing every server-side request.
  const requestCookie = import.meta.server
    ? useRequestHeaders(['cookie']).cookie
    : null;

  const api = $fetch.create({
    baseURL: import.meta.server ? config.apiBase : config.public.apiBase,

    onRequest({ options }) {
      if (import.meta.server && requestCookie) {
        options.headers = new Headers(options.headers);
        options.headers.set('cookie', requestCookie);
      }

      /*
       * A native shell has no usable session cookie, so it carries a token.
       * readToken returns null everywhere else, which leaves the web build
       * exactly as it was — cookie only, nothing in reach of a script.
       */
      const token = readToken();
      if (token) {
        options.headers = new Headers(options.headers);
        options.headers.set('authorization', `Bearer ${token}`);
      }
    },

    onResponseError({ response }) {
      // Only bounce the browser. Redirecting during SSR would abort rendering
      // of pages that are perfectly viewable signed out.
      if (response.status === 401 && import.meta.client) {
        const route = useRoute();
        if (!route.path.startsWith('/prijava')) {
          navigateTo({ path: '/prijava', query: { redirect: route.fullPath } });
        }
      }
    }
  });

  return { provide: { api } };
});
