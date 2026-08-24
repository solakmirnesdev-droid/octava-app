export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref(new Set());
  const songs = ref([]);

  async function load() {
    const { $api } = useNuxtApp();
    try {
      const data = await $api('/me/favorites');
      songs.value = data.songs || [];
      ids.value = new Set(songs.value.map((s) => s._id));
    } catch {
      // Browsing works signed out; a failed load just means nothing saved yet.
      songs.value = [];
      ids.value = new Set();
    }
    return songs.value;
  }

  async function toggle(songId) {
    const { $api } = useNuxtApp();
    const wasFavorite = ids.value.has(songId);

    // Optimistic: the heart should respond to the tap, not to the round trip.
    const next = new Set(ids.value);
    wasFavorite ? next.delete(songId) : next.add(songId);
    ids.value = next;

    try {
      await $api(`/me/favorites/${songId}`, { method: wasFavorite ? 'DELETE' : 'POST' });
    } catch (err) {
      const reverted = new Set(ids.value);
      wasFavorite ? reverted.add(songId) : reverted.delete(songId);
      ids.value = reverted;
      throw err;
    }
  }

  const has = (songId) => ids.value.has(songId);

  return { ids, songs, load, toggle, has };
});
