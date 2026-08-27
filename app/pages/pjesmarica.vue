<script setup>
import ChordSheet from '~/components/ChordSheet.vue';

/**
 * The whole public-domain catalogue on one page, meant for paper.
 *
 * AI-DECISION: this exists because the site is useless exactly where the songs
 * get played. People take a guitar to a cottage, a fire, a bus — places with no
 * signal — and the chords stay behind on a server. Everything else here is
 * interactive: transposing, auto-scroll, chord audio. None of that survives
 * losing the network, and none of it is what you need once you are sitting down
 * to play. A sheet of paper needs no battery and no bars. See AI-NOTES.md §5.
 *
 * Only `javno-vlasnistvo` songs are collected. That is not a technical limit —
 * it is the only part of the catalogue that can be handed out as a booklet
 * without asking anybody, and a print button over somebody else's transcription
 * would be the site quietly doing what it declines to do everywhere else.
 */
const { t } = useI18n();
const { $api } = useNuxtApp();

/** Templates have no access to globals; the print button needs it by name. */
const print = () => window.print();

const { data } = await useAsyncData('songbook', () => $api('/songs', {
  params: { tag: 'javno-vlasnistvo', limit: 100, sort: 'title', status: 'published' }
}));

// Only songs that actually carry chords: an empty draft on paper is a wasted
// leaf, and the reader cannot tell it apart from a printing failure.
const songs = computed(() =>
  (data.value?.songs || []).filter((s) => (s.content || '').trim().length > 25));

/** Reconstructed from the oral tradition and not yet read by a person. */
const unchecked = (song) => (song.tags || []).includes('treba-provjeru');

useSeoMeta({ title: t('meta.songbookTitle'), robots: 'noindex, nofollow' });
</script>

<template>
  <div>
    <header class="mb-8" data-print="hide">
      <h1 class="text-xl font-semibold tracking-tight">{{ $t('page.songbook') }}</h1>
      <p class="mt-1.5 max-w-prose text-sm leading-relaxed text-muted">
        {{ $t('songbook.intro') }}
      </p>

      <button
        type="button"
        class="mt-4 rounded bg-ink px-4 py-2 text-sm font-medium text-on-ink hover:bg-accent"
        @click="print"
      >{{ $t('songbook.print') }}</button>
    </header>

    <!-- Contents: on screen it is a jump list, on paper it is the index you
         thumb to at the fire without leafing through everything. -->
    <nav v-if="songs.length" class="mb-10 break-after-page">
      <h2 class="mb-3 text-sm font-medium text-muted">
        {{ $t('songbook.contents') }}
        <span class="ml-1 font-mono text-xs text-faint">{{ songs.length }}</span>
      </h2>
      <ol class="columns-1 gap-8 text-sm sm:columns-2">
        <li v-for="(s, i) in songs" :key="s._id" class="mb-1 break-inside-avoid">
          <a :href="`#p${i + 1}`" class="text-body hover:text-accent">
            <span class="mr-2 font-mono text-xs text-faint">{{ i + 1 }}</span>{{ s.title }}
            <span class="text-faint"> — {{ s.artist?.name }}</span>
          </a>
        </li>
      </ol>
    </nav>

    <p v-if="!songs.length" class="text-sm text-muted">{{ $t('songbook.empty') }}</p>

    <!-- One song per sheet: a chart split across a page turn is a chart you
         cannot play from with both hands on the guitar. -->
    <article
      v-for="(song, i) in songs" :key="song._id" :id="`p${i + 1}`"
      class="mb-12 break-after-page break-inside-avoid"
    >
      <h2 class="text-lg font-semibold tracking-tight">
        <span class="mr-2 font-mono text-sm font-normal text-faint">{{ i + 1 }}</span>{{ song.title }}
      </h2>
      <p class="mt-0.5 text-sm text-muted">
        {{ song.artist?.name }}
        <span v-if="song.originalKey" class="ml-2 font-mono text-xs text-faint">
          {{ song.originalKey }}<template v-if="song.capo"> · capo {{ song.capo }}</template>
        </span>
      </p>

      <p v-if="unchecked(song)" class="mt-2 text-xs text-warn">
        {{ $t('songbook.unchecked') }}
      </p>

      <!-- Static on purpose: transposition and chord audio are screen things,
           and this page is the one that has to work with no screen at all. -->
      <ChordSheet class="mt-4" :content="song.content" :original-key="song.originalKey" />
    </article>
  </div>
</template>
