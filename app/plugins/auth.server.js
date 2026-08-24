/**
 * Resolves the signed-in user during SSR, before any page renders.
 * Pinia state is serialised into the payload, so the client hydrates with the
 * same answer rather than re-fetching and flickering.
 */
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore();
  const cookie = useRequestHeaders(['cookie']).cookie;

  // No cookie means anonymous; skip the round trip entirely.
  if (cookie?.includes('octava_session')) {
    await auth.fetchMe();
  }
});
