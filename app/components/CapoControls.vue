<script setup>
import { transposeKey } from '~/utils/chordpro';
import { suggestions, MAX_CAPO } from '~/utils/capo';

/**
 * Where to clamp the capo, and which shapes that leaves you fingering.
 *
 * AI-DECISION: this sits beside TransposeControls and looks like it, but the
 * two do opposite things and the readout has to say so. Transposing moves the
 * sounding pitch — the singer changes key. A capo moves only the shapes; the
 * song sounds exactly the same. Both lines are shown at once ("fingering Am,
 * sounding Cm") because that sentence is the entire theory, and a player who
 * cannot see it has no way to tell the two controls apart. See AI-NOTES.md §5.
 */
const props = defineProps({
  capo: { type: Number, default: 0 },
  semitones: { type: Number, default: 0 },
  originalKey: { type: String, default: '' },
  /** The song body, so the suggestions can score real chords. */
  content: { type: String, default: '' }
});
const emit = defineEmits(['update:capo']);

const open = ref(false);

// Mirrored locally for the same reason TransposeControls does it: two clicks in
// one tick both read the stale prop, so +1 twice would land on +1.
const value = ref(props.capo);
watch(() => props.capo, (next) => { value.value = next; });

function set(next) {
  // Clamped, not wrapped. Transposition wraps because the twelve keys are a
  // circle, but frets are a line with a nut at one end — there is no capo at
  // -1, and past the seventh the frets crowd and the tone goes thin.
  value.value = Math.min(MAX_CAPO, Math.max(0, next));
  emit('update:capo', value.value);
}

const step = (delta) => set(value.value + delta);

/** What the room hears. Deliberately independent of the capo. */
const soundingKey = computed(() => transposeKey(props.originalKey, props.semitones));
/** What the left hand makes. */
const shapeKey = computed(() => transposeKey(props.originalKey, props.semitones - value.value));

const ranked = computed(() => suggestions(props.content, props.semitones));

/** Best position that is not where we already are, for the one-tap hint. */
const best = computed(() => ranked.value.find((r) => r.fret !== value.value && r.ease > current.value?.ease));
const current = computed(() => ranked.value.find((r) => r.fret === value.value));

function pick(fret) {
  set(fret);
  open.value = false;
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex flex-wrap items-center gap-2">
      <span class="hidden text-xs font-medium uppercase tracking-wide text-faint sm:inline">
        {{ $t('song.capo') }}
      </span>

      <div class="flex items-center overflow-hidden rounded border border-line-strong bg-panel">
        <button
          class="px-2.5 py-1.5 text-sm font-medium hover:bg-raised hover:text-accent disabled:opacity-30"
          :disabled="value <= 0" :title="$t('capo.down')" @click="step(-1)"
        >−</button>

        <button
          class="min-w-[4.75rem] border-x border-line px-2 py-1.5 text-center hover:bg-raised"
          :title="$t('capo.choose')" :aria-expanded="open" @click="open = !open"
        >
          <span class="block font-mono text-sm font-semibold leading-none">
            {{ value === 0 ? '—' : value }}
          </span>
          <span class="mt-0.5 block text-[10px] leading-none text-faint">
            {{ value === 0 ? $t('capo.none') : $t('capo.fret') }}
          </span>
        </button>

        <button
          class="px-2.5 py-1.5 text-sm font-medium hover:bg-raised hover:text-accent disabled:opacity-30"
          :disabled="value >= MAX_CAPO" :title="$t('capo.up')" @click="step(1)"
        >+</button>
      </div>

      <button
        v-if="value !== 0"
        type="button"
        class="flex size-8 items-center justify-center rounded-lg border border-line bg-surface/70 text-muted
               transition hover:border-accent hover:bg-panel hover:text-accent"
        :title="$t('capo.remove')" :aria-label="$t('capo.remove')"
        @click="set(0)"
      >
        <Icon name="material-symbols:restart-alt-rounded" class="text-base" />
      </button>
    </div>

    <!-- Every position, scored. The percentage is how much of the shape set
         falls in open position, so the ranking is about the left hand. -->
    <div v-if="open" class="flex flex-col gap-1 rounded border border-line bg-panel p-2">
      <button
        v-for="row in ranked" :key="row.fret"
        class="flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-accent-soft"
        :class="row.fret === value ? 'bg-ink text-on-ink hover:bg-ink' : ''"
        @click="pick(row.fret)"
      >
        <span class="min-w-[3.5rem] font-mono text-xs font-semibold">
          {{ row.fret === 0 ? $t('capo.none') : $t('song.capoFret', { n: row.fret }) }}
        </span>
        <span class="font-mono text-xs opacity-70">{{ row.shapes.join(' ') }}</span>
        <span class="ml-auto font-mono text-[10px] opacity-50">{{ row.ease }}%</span>
      </button>
    </div>

    <!--
      The proof line. A capo changes the shapes and nothing else, and this is
      where the reader can check that for themselves against their own ear.
    -->
    <i18n-t v-if="value > 0" keypath="capo.playingSounding" tag="p" class="text-xs text-faint" scope="global">
      <template #shape><strong class="font-mono">{{ shapeKey }}</strong></template>
      <template #sound><strong class="font-mono">{{ soundingKey }}</strong></template>
    </i18n-t>

    <i18n-t
      v-else-if="best" keypath="capo.easierAt" tag="p" class="text-xs text-faint" scope="global"
    >
      <template #fret><strong>{{ best.fret }}</strong></template>
      <template #shapes><strong class="font-mono">{{ best.shapes.join(' ') }}</strong></template>
    </i18n-t>
  </div>
</template>
