export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref(new Set());
  const songs = ref([]);

  /**
   * Saved artists, kept in their own set.
   *
   * AI-NOTE: separate from songs rather than one map keyed by type. Following an
   * artist and bookmarking a song are different acts, the saved page shows them
   * under separate headings, and a shared set would need every lookup to know
   * which kind it was asking about.
   */
  const artistIds = ref(new Set());
  const artists = ref([]);

  async function load() {
    const { $api } = useNuxtApp();
    try {
      // One await for both, since the saved page needs them together.
      const [saved, followed] = await Promise.all([
        $api('/me/favorites'),
        $api('/me/artists')
      ]);
      songs.value = saved.songs || [];
      ids.value = new Set(songs.value.map((s) => s._id));
      artists.value = followed.artists || [];
      artistIds.value = new Set(artists.value.map((a) => String(a._id)));
    } catch {
      // Browsing works signed out; a failed load just means nothing saved yet.
      songs.value = [];
      ids.value = new Set();
      artists.value = [];
      artistIds.value = new Set();
    }
    return { songs: songs.value, artists: artists.value };
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

  /** Same shape as toggle above, against the artist list. */
  async function toggleArtist(artistId) {
    const { $api } = useNuxtApp();
    const id = String(artistId);
    const wasSaved = artistIds.value.has(id);

    const next = new Set(artistIds.value);
    wasSaved ? next.delete(id) : next.add(id);
    artistIds.value = next;

    try {
      await $api(`/me/artists/${id}`, { method: wasSaved ? 'DELETE' : 'POST' });
    } catch (err) {
      const reverted = new Set(artistIds.value);
      wasSaved ? reverted.add(id) : reverted.delete(id);
      artistIds.value = reverted;
      throw err;
    }
  }

  const has = (songId) => ids.value.has(songId);
  const hasArtist = (artistId) => artistIds.value.has(String(artistId));

  return { ids, songs, artistIds, artists, load, toggle, toggleArtist, has, hasArtist };
});
