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
  <footer class="mt-14 border-t border-line/70 bg-panel/75 backdrop-blur-md">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
      <div class="grid gap-8 grid-cols-2 sm:grid-cols-2 lg:grid-cols-5">
        <!-- 1. Brand -->
        <div class="col-span-2 sm:col-span-2 lg:col-span-1 space-y-2.5">
          <NuxtLink :to="localePath('/')" class="inline-flex items-center gap-2 text-base font-black tracking-tight text-ink group">
            <span class="flex size-7 items-center justify-center rounded-lg bg-accent text-on-accent text-xs">
              <Icon name="material-symbols:graphic-eq-rounded" />
            </span>
            <span>Octava</span>
          </NuxtLink>
          <p class="text-xs leading-relaxed text-muted max-w-xs">
            Akordi i tekstovi za gitaru — domaća i regionalna muzika sa transponovanjem.
          </p>
          <div v-if="data?.counts?.songs" class="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-2.5 py-0.5 font-mono text-[11px] text-faint">
            <span>{{ data.counts.songs }} pjesama</span>
            <span>·</span>
            <span>{{ data.counts.artists }} izvođača</span>
          </div>
        </div>

        <!-- 2. Rubrike / Žanrovi -->
        <nav aria-labelledby="footer-rubrike" class="space-y-2">
          <h2 id="footer-rubrike" class="text-[11px] font-bold uppercase tracking-wider text-faint">
            {{ $t('footer.rubrics') }}
          </h2>
          <ul class="space-y-1 text-xs">
            <li v-for="genre in (data?.genres || []).slice(0, 6)" :key="genre._id">
              <NuxtLink :to="localePath(`/zanr/${genre.slug}`)" class="text-muted hover:text-accent transition-colors">
                {{ genre.name }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- 3. Izvođači -->
        <nav aria-labelledby="footer-izvodjaci" class="space-y-2">
          <h2 id="footer-izvodjaci" class="text-[11px] font-bold uppercase tracking-wider text-faint">
            {{ $t('footer.artists') }}
          </h2>
          <ul class="space-y-1 text-xs">
            <li v-for="artist in (data?.artists || []).slice(0, 5)" :key="artist._id">
              <NuxtLink :to="localePath(`/izvodjac/${artist.slug}`)" class="text-muted hover:text-accent transition-colors truncate block max-w-[140px]">
                {{ artist.name }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/izvodjaci')" class="font-semibold text-accent hover:underline">
                {{ $t('footer.allArtists') }} →
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- 4. Najtraženije -->
        <nav aria-labelledby="footer-pjesme" class="space-y-2">
          <h2 id="footer-pjesme" class="text-[11px] font-bold uppercase tracking-wider text-faint">
            {{ $t('footer.popular') }}
          </h2>
          <ul class="space-y-1 text-xs">
            <li v-for="song in (data?.songs || []).slice(0, 5)" :key="song.slug">
              <NuxtLink :to="localePath(`/pjesma/${song.slug}`)" class="text-muted hover:text-accent transition-colors truncate block max-w-[160px]">
                {{ song.title }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- 5. Alati -->
        <nav aria-labelledby="footer-alati" class="space-y-2">
          <h2 id="footer-alati" class="text-[11px] font-bold uppercase tracking-wider text-faint">
            {{ $t('footer.tools') }}
          </h2>
          <ul class="space-y-1 text-xs">
            <li>
              <NuxtLink :to="localePath('/stimer')" class="text-muted hover:text-accent transition-colors">{{ $t('footer.tuner') }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/metronom')" class="text-muted hover:text-accent transition-colors">{{ $t('footer.metronome') }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/akordi')" class="text-muted hover:text-accent transition-colors">{{ $t('footer.chords') }}</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/zatrazi')" class="text-muted hover:text-accent transition-colors">{{ $t('footer.request') }}</NuxtLink>
            </li>
          </ul>
        </nav>
      </div>

      <!-- Bottom copyright & legal bar -->
      <div class="mt-7 flex flex-col gap-2.5 border-t border-line/60 pt-4 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ year }} Octava. Sva prava zadržana.</p>

        <nav class="flex flex-wrap gap-x-4 gap-y-1">
          <NuxtLink :to="localePath('/o-nama')" class="hover:text-accent transition-colors">{{ $t('footer.about') }}</NuxtLink>
          <NuxtLink :to="localePath('/privatnost')" class="hover:text-accent transition-colors">{{ $t('footer.privacy') }}</NuxtLink>
          <NuxtLink :to="localePath('/uslovi')" class="hover:text-accent transition-colors">{{ $t('footer.terms') }}</NuxtLink>
        </nav>
      </div>
    </div>
  </footer>
</template>
