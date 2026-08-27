<script setup>
const localePath = useLocalePath();
const { $api } = useNuxtApp();

/**
 * Shared key, so the footer is fetched once per render and reused by every
 * page rather than refetched on each client-side navigation.
 */
const { data } = await useAsyncData('footer', () =>
  $api('/footer').catch(() => ({ genres: [], artists: [], songs: [], counts: {} }))
);

const regions = computed(() => (data.value?.genres || []).filter((g) => g.kind === 'region'));
const styles = computed(() => (data.value?.genres || []).filter((g) => g.kind === 'style'));
const year = new Date().getFullYear();
</script>

<template>
  <footer class="mt-16 border-t border-line bg-panel/60">
    <div class="mx-auto max-w-7xl px-5 py-12">
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Brand. The counts are here because they are the honest measure of
             what the site is, and they read as a reason to trust it. -->
        <div>
          <NuxtLink :to="localePath('/')" class="text-lg font-semibold tracking-tight">Octava</NuxtLink>
          <p class="mt-2 text-sm leading-relaxed text-muted">
            Akordi i tekstovi za gitaru — domaća i regionalna muzika, sa
            transponovanjem i dijagramima hvatova.
          </p>
          <p v-if="data?.counts?.songs" class="mt-3 font-mono text-xs text-faint">
            {{ $t('footer.counts', { songs: data.counts.songs, artists: data.counts.artists }) }}
          </p>
        </div>

        <!-- Rubrics. Real anchor text, and the shortest path a crawler has to
             the deep pages: nothing else on the site links to all of them. -->
        <nav aria-labelledby="footer-rubrike">
          <h2 id="footer-rubrike" class="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
            {{ $t('footer.rubrics') }}
          </h2>
          <ul class="space-y-1.5 text-sm">
            <li v-for="genre in regions" :key="genre._id">
              <NuxtLink :to="localePath(`/zanr/${genre.slug}`)" class="text-body hover:text-accent">
                {{ genre.name }}
              </NuxtLink>
            </li>
            <li v-for="genre in styles" :key="genre._id">
              <NuxtLink :to="localePath(`/zanr/${genre.slug}`)" class="text-body hover:text-accent">
                {{ genre.name }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-izvodjaci">
          <h2 id="footer-izvodjaci" class="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
            {{ $t('footer.artists') }}
          </h2>
          <ul class="space-y-1.5 text-sm">
            <li v-for="artist in data?.artists || []" :key="artist._id">
              <NuxtLink :to="localePath(`/izvodjac/${artist.slug}`)" class="text-body hover:text-accent">
                {{ artist.name }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/izvodjaci')" class="font-medium text-accent hover:underline">
                {{ $t('footer.allArtists') }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <div class="space-y-8">
          <nav aria-labelledby="footer-pjesme">
            <h2 id="footer-pjesme" class="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
              {{ $t('footer.popular') }}
            </h2>
            <ul class="space-y-1.5 text-sm">
              <li v-for="song in (data?.songs || []).slice(0, 8)" :key="song.slug">
                <NuxtLink :to="localePath(`/pjesma/${song.slug}`)" class="text-body hover:text-accent">
                  {{ song.title }}
                  <span class="text-faint">— {{ song.artist?.name }}</span>
                </NuxtLink>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-alati">
            <h2 id="footer-alati" class="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
              {{ $t('footer.tools') }}
            </h2>
            <ul class="space-y-1.5 text-sm">
              <li>
                <NuxtLink :to="localePath('/stimer')" class="text-body hover:text-accent">{{ $t('footer.tuner') }}</NuxtLink>
                </li>
              <li>
                <NuxtLink :to="localePath('/metronom')" class="text-body hover:text-accent">{{ $t('footer.metronome') }}</NuxtLink>
              </li>
              <li>
                <NuxtLink :to="localePath('/akordi')" class="text-body hover:text-accent">{{ $t('footer.chords') }}</NuxtLink>
              </li>
              <li>
                <NuxtLink :to="localePath('/zatrazi')" class="text-body hover:text-accent">{{ $t('footer.request') }}</NuxtLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div class="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ year }} Octava</p>

        <nav class="flex flex-wrap gap-x-5 gap-y-2">
          <NuxtLink :to="localePath('/o-nama')" class="hover:text-accent">{{ $t('footer.about') }}</NuxtLink>
          <NuxtLink :to="localePath('/privatnost')" class="hover:text-accent">{{ $t('footer.privacy') }}</NuxtLink>
          <NuxtLink :to="localePath('/uslovi')" class="hover:text-accent">{{ $t('footer.terms') }}</NuxtLink>
          <!-- TODO(Mirnes): replace with a real address once one exists.
               A site carrying song lyrics needs a reachable channel for
               takedown requests; leaving this unset is the gap worth closing
               first. -->
          <span class="text-faint">{{ $t('footer.contact') }}: —</span>
        </nav>
      </div>
    </div>
  </footer>
</template>
