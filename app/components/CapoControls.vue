<script setup>
import { suggestions, MAX_CAPO } from '~/utils/capo';

const props = defineProps({
  capo: { type: Number, default: 0 },
  semitones: { type: Number, default: 0 },
  originalKey: { type: String, default: '' },
  content: { type: String, default: '' }
});
const emit = defineEmits(['update:capo']);

const open = ref(false);

const value = ref(props.capo);
watch(() => props.capo, (next) => { value.value = next; });

function set(next) {
  value.value = Math.min(MAX_CAPO, Math.max(0, next));
  emit('update:capo', value.value);
}

const step = (delta) => set(value.value + delta);

const ranked = computed(() => suggestions(props.content, props.semitones));

function pick(fret) {
  set(fret);
  open.value = false;
}

function onClickOutside(e) {
  if (open.value && !e.target.closest('[data-capo-menu]')) {
    open.value = false;
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', onClickOutside);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', onClickOutside);
  }
});
</script>

<template>
  <div class="relative inline-flex items-center" data-capo-menu>
    <div class="flex items-center gap-1.5">
      <span class="hidden text-[11px] font-bold uppercase tracking-wider text-muted/70 lg:inline select-none">
        {{ $t('song.capo') }}
      </span>

      <div class="inline-flex items-center rounded-xl border border-line-soft bg-surface/80 p-0.5 shadow-2xs hover:border-line transition-colors">
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 active:scale-95 transition-all cursor-pointer"
          :disabled="value <= 0"
          :title="$t('capo.down')"
          @click="step(-1)"
        >
          <Icon name="material-symbols:remove-rounded" class="text-sm" />
        </button>

        <button
          type="button"
          class="min-w-[3.75rem] sm:min-w-[4.25rem] rounded-lg px-2 py-0.5 text-center transition-all cursor-pointer"
          :class="open ? 'bg-panel text-accent shadow-xs' : 'text-ink hover:bg-panel'"
          :title="$t('capo.choose')"
          :aria-expanded="open"
          @click="open = !open"
        >
          <span class="block font-mono text-xs sm:text-sm font-extrabold leading-tight">
            {{ value === 0 ? '—' : value }}
          </span>
          <span class="block text-[9px] font-semibold leading-tight" :class="value !== 0 ? 'text-accent' : 'text-muted/70'">
            {{ value === 0 ? $t('capo.none') : $t('capo.fret') }}
          </span>
        </button>

        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-muted hover:bg-panel hover:text-accent disabled:opacity-25 active:scale-95 transition-all cursor-pointer"
          :disabled="value >= MAX_CAPO"
          :title="$t('capo.up')"
          @click="step(1)"
        >
          <Icon name="material-symbols:add-rounded" class="text-sm" />
        </button>
      </div>

      <button
        v-if="value !== 0"
        type="button"
        class="flex size-7 items-center justify-center rounded-lg border border-line-soft bg-surface/80 text-accent transition hover:border-accent hover:bg-panel hover:scale-105 shadow-2xs cursor-pointer"
        :title="$t('capo.remove')"
        :aria-label="$t('capo.remove')"
        @click="set(0)"
      >
        <Icon name="material-symbols:restart-alt-rounded" class="text-sm" />
      </button>
    </div>

    <!-- Floating Dropdown overlay for capo recommendations -->
    <div
      v-if="open"
      class="absolute left-0 top-full mt-2 z-40 flex flex-col gap-1 rounded-2xl border border-line bg-panel/95 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 min-w-[210px]"
    >
      <button
        v-for="row in ranked" :key="row.fret"
        type="button"
        class="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-all cursor-pointer"
        :class="row.fret === value ? 'bg-accent text-on-accent font-bold shadow-xs' : 'hover:bg-surface text-muted hover:text-ink'"
        @click="pick(row.fret)"
      >
        <span class="font-mono text-xs font-semibold">
          {{ row.fret === 0 ? $t('capo.none') : $t('song.capoFret', { n: row.fret }) }}
        </span>
        <span class="font-mono text-xs opacity-75">{{ row.shapes.join(' ') }}</span>
        <span class="font-mono text-[10px] opacity-60">{{ row.ease }}%</span>
      </button>
    </div>
  </div>
</template>
