<script setup>
import { initials, avatarStyle } from '~/utils/avatar';

const config = useRuntimeConfig();
const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const { $api } = useNuxtApp();

const { data, error } = await useAsyncData(
  () => `artist-${route.params.slug}`,
  () => $api(`/artists/${route.params.slug}`)
);

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: t('meta.artistNotFound'), fatal: true });
}

const auth = useAuthStore();
const favorites = useFavoritesStore();

// Only the signed-in case needs the list; a visitor sees a link to sign in.
if (auth.isAuthenticated) await useAsyncData('favorites-artist', () => favorites.load());

const artist = computed(() => data.value?.artist);
const toast = useToast();

async function toggleArtistFavorite() {
  if (!artist.value) return;
  const wasSaved = favorites.hasArtist(artist.value._id);
  await favorites.toggleArtist(artist.value._id);
  if (!wasSaved) {
    toast.show({
      title: artist.value.name,
      artistName: artist.value.name,
      artistId: artist.value._id,
      hasImage: Boolean(artist.value.hasImage || artist.value.imageBytes),
      message: t('artist.artistSaved'),
      type: 'artist'
    });
  }
}

useSeoMeta({
  title: () => `${artist.value?.name} — akordi | Octava`,
  description: () => `Svi akordi za pjesme izvođača ${artist.value?.name}.`
});
</script>

<template>
  <div v-if="artist" class="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10 items-start">
    <!-- The profile stays put while the list scrolls: on an artist with fifty
         songs the name and picture would otherwise leave the screen at once. -->
    <aside class="mb-8 flex flex-col items-center text-center rounded-2xl border border-line bg-panel/60 p-6 backdrop-blur-xs shadow-xs lg:sticky lg:top-24 lg:mb-0 lg:self-start">
      <!-- Avatar: Image or Initials -->
      <div class="relative">
        <img
          v-if="artist.hasImage"
          :src="`${config.public.apiBase}/artists/${artist._id}/image`"
          :alt="artist.name"
          class="size-24 lg:size-32 rounded-full object-cover ring-2 ring-line/80 shadow-md"
        >
        <div
          v-else
          :style="avatarStyle(artist.name)"
          class="flex size-24 lg:size-32 select-none items-center justify-center rounded-full font-bold tracking-tight ring-2 ring-line-soft shadow-md"
        >
          <span class="text-3xl lg:text-4xl">{{ initials(artist.name) }}</span>
        </div>
      </div>

      <!-- Artist Name & Song Count -->
      <h1 class="mt-4 text-2xl font-bold tracking-tight text-ink">
        <span v-if="artist.flag" class="mr-1.5">{{ artist.flag }}</span>{{ artist.name }}
      </h1>

      <p class="mt-1 text-sm text-faint font-mono">
        {{ $t('common.songCount', { n: artist.songs?.length || 0 }, artist.songs?.length || 0) }}
      </p>

      <!-- Favorite / Save Button -->
      <!-- AI-TRAP: both icon names are written out as literals and toggled
           with v-show, never bound as one expression. @nuxt/icon builds its
           client bundle by scanning source for literal names; a computed
           name renders a correctly sized SVG with no paths in it. -->
      <button
        v-if="auth.isAuthenticated"
        class="mt-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-line-strong px-3.5 py-1.5 text-xs font-medium transition-colors"
        :class="favorites.hasArtist(artist._id)
          ? 'border-accent bg-accent-soft text-accent'
          : 'text-muted hover:border-accent hover:text-accent hover:bg-surface'"
        @click="toggleArtistFavorite"
      >
        <Icon v-show="favorites.hasArtist(artist._id)" name="material-symbols:favorite-rounded" />
        <Icon v-show="!favorites.hasArtist(artist._id)" name="material-symbols:favorite-outline-rounded" />
        {{ favorites.hasArtist(artist._id) ? $t('artist.saved') : $t('artist.save') }}
      </button>

      <NuxtLink
        v-else
        :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
        class="mt-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-line-strong px-3.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent hover:bg-surface transition-colors"
      >
        <Icon name="material-symbols:favorite-outline-rounded" />
        {{ $t('artist.save') }}
      </NuxtLink>

      <!-- Genres -->
      <ul v-if="artist.genres?.length" class="mt-4 flex flex-wrap justify-center gap-1.5">
        <li v-for="genre in artist.genres" :key="genre._id">
          <NuxtLink
            :to="localePath(`/zanr/${genre.slug}`)"
            class="rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
          >{{ genre.name }}</NuxtLink>
        </li>
      </ul>

      <!-- The three facts a reader actually wants beside a name on a songbook. -->
      <dl v-if="artist.origin || artist.activeFrom || artist.website" class="mt-5 w-full space-y-2 border-t border-line-soft pt-4 text-xs">
        <div v-if="artist.origin" class="flex items-center justify-between gap-2">
          <dt class="text-faint">{{ $t('artist.origin') }}</dt>
          <dd class="font-medium text-muted">{{ artist.origin }}</dd>
        </div>

        <div v-if="artist.activeFrom" class="flex items-center justify-between gap-2">
          <dt class="text-faint">{{ $t('artist.active') }}</dt>
          <dd class="font-mono text-muted">
            {{ artist.activeFrom }}<span v-if="artist.activeTo">–{{ artist.activeTo }}</span>
            <span v-else class="text-faint">–</span>
          </dd>
        </div>

        <div v-if="artist.website" class="flex items-center justify-between gap-2">
          <dt class="text-faint">{{ $t('artist.website') }}</dt>
          <dd class="min-w-0">
            <a
              :href="artist.website" target="_blank" rel="noopener nofollow"
              class="block truncate text-accent hover:underline"
            >{{ artist.website.replace(/^https?:\/\//, '') }}</a>
          </dd>
        </div>
      </dl>

      <p v-if="artist.bio" class="mt-4 border-t border-line-soft pt-3 text-xs leading-relaxed text-muted text-center">
        {{ artist.bio }}
      </p>
    </aside>

    <!-- showArtist off: the name is already at the top of this page. -->
    <SongList
      :songs="artist.songs || []"
      :show-artist="false"
      :empty="$t('page.noArtistSongs')"
    />
  </div>
</template>
