import { defineStore } from 'pinia';
import { ref } from 'vue';
import client from '../api/client';

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref(new Set());
  const songs = ref([]);

  async function load() {
    try {
      const { data } = await client.get('/me/favorites');
      songs.value = data.songs || [];
      ids.value = new Set(songs.value.map((s) => s._id));
    } catch {
      // Browsing works signed out; a failed load just means no favourites yet.
    }
  }

  async function toggle(songId) {
    const wasFavorite = ids.value.has(songId);

    // Optimistic: the heart should respond immediately, not after a round trip.
    if (wasFavorite) ids.value.delete(songId);
    else ids.value.add(songId);
    ids.value = new Set(ids.value);

    try {
      if (wasFavorite) await client.delete(`/me/favorites/${songId}`);
      else await client.post(`/me/favorites/${songId}`);
    } catch (err) {
      if (wasFavorite) ids.value.add(songId);
      else ids.value.delete(songId);
      ids.value = new Set(ids.value);
      throw err;
    }
  }

  const has = (songId) => ids.value.has(songId);

  return { ids, songs, load, toggle, has };
});
