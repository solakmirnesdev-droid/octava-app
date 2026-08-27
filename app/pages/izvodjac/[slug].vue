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

useSeoMeta({
  title: () => `${artist.value?.name} — akordi | Octava`,
  description: () => `Svi akordi za pjesme izvođača ${artist.value?.name}.`
});
</script>

<template>
  <div v-if="artist" class="lg:grid lg:grid-cols-[236px_1fr] lg:gap-10">
    <!-- The profile stays put while the list scrolls: on an artist with fifty
         songs the name and picture would otherwise leave the screen at once. -->
    <aside class="mb-8 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
      <div class="flex items-center gap-4 lg:block">
        <img
          v-if="artist.hasImage"
          :src="`${config.public.apiBase}/artists/${artist._id}/image`"
          :alt="artist.name"
          class="size-20 shrink-0 rounded-full object-cover ring-1 ring-line lg:size-32"
        >
        <div
          v-else
          :style="avatarStyle(artist.name)"
          class="flex size-20 shrink-0 items-center justify-center rounded-full font-semibold tracking-tight ring-1 ring-line-soft lg:size-32"
        >
          <span class="text-2xl lg:text-4xl">{{ initials(artist.name) }}</span>
        </div>

        <div class="lg:mt-4">
          <h1 class="text-2xl font-semibold tracking-tight">
            <span v-if="artist.flag" class="mr-1.5">{{ artist.flag }}</span>{{ artist.name }}
          </h1>
          <p class="mt-1 text-sm text-faint">
            {{ $t('common.songCount', { n: artist.songs?.length || 0 }, artist.songs?.length || 0) }}
          </p>

          <!-- AI-TRAP: both icon names are written out as literals and toggled
               with v-show, never bound as one expression. @nuxt/icon builds its
               client bundle by scanning source for literal names; a computed
               name renders a correctly sized SVG with no paths in it. -->
          <button
            v-if="auth.isAuthenticated"
            class="mt-2 flex items-center gap-1.5 rounded border border-line-strong px-2.5 py-1 text-sm transition-colors"
            :class="favorites.hasArtist(artist._id)
              ? 'border-accent text-accent'
              : 'text-muted hover:border-accent hover:text-accent'"
            @click="favorites.toggleArtist(artist._id)"
          >
            <Icon v-show="favorites.hasArtist(artist._id)" name="material-symbols:favorite-rounded" />
            <Icon v-show="!favorites.hasArtist(artist._id)" name="material-symbols:favorite-outline-rounded" />
            {{ favorites.hasArtist(artist._id) ? $t('artist.saved') : $t('artist.save') }}
          </button>

          <NuxtLink
            v-else
            :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
            class="mt-2 flex items-center gap-1.5 text-sm text-faint hover:text-accent"
          >
            <Icon name="material-symbols:favorite-outline-rounded" />
            {{ $t('artist.save') }}
          </NuxtLink>
        </div>
      </div>

      <ul v-if="artist.genres?.length" class="mt-4 flex flex-wrap gap-1.5">
        <li v-for="genre in artist.genres" :key="genre._id">
          <NuxtLink
            :to="localePath(`/zanr/${genre.slug}`)"
            class="rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-muted hover:border-accent hover:text-accent"
          >{{ genre.name }}</NuxtLink>
        </li>
      </ul>

      <!-- The three facts a reader actually wants beside a name on a songbook.
           Each one is optional, and the block disappears entirely when none is
           set rather than showing a list of dashes. -->
      <dl v-if="artist.origin || artist.activeFrom || artist.website" class="mt-4 space-y-1.5 text-sm">
        <div v-if="artist.origin" class="flex gap-2">
          <dt class="w-20 shrink-0 text-faint">{{ $t('artist.origin') }}</dt>
          <dd class="text-muted">{{ artist.origin }}</dd>
        </div>

        <div v-if="artist.activeFrom" class="flex gap-2">
          <dt class="w-20 shrink-0 text-faint">{{ $t('artist.active') }}</dt>
          <dd class="font-mono text-muted">
            {{ artist.activeFrom }}<span v-if="artist.activeTo">–{{ artist.activeTo }}</span>
            <span v-else class="text-faint">–</span>
          </dd>
        </div>

        <div v-if="artist.website" class="flex gap-2">
          <dt class="w-20 shrink-0 text-faint">{{ $t('artist.website') }}</dt>
          <dd class="min-w-0">
            <!-- noopener because it is a link somebody typed into the dashboard,
                 and nofollow because we are not vouching for wherever it goes. -->
            <a
              :href="artist.website" target="_blank" rel="noopener nofollow"
              class="block truncate text-accent hover:underline"
            >{{ artist.website.replace(/^https?:\/\//, '') }}</a>
          </dd>
        </div>
      </dl>

      <p v-if="artist.bio" class="mt-4 text-sm leading-relaxed text-muted">{{ artist.bio }}</p>
    </aside>

    <!-- showArtist off: the name is already at the top of this page. -->
    <SongList
      :songs="artist.songs || []"
      :show-artist="false"
      :empty="$t('page.noArtistSongs')"
    />
  </div>
</template>
