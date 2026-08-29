<script setup>
import { transposeKey } from '~/utils/chordpro';

const props = defineProps({
  semitones: { type: Number, default: 0 },
  originalKey: { type: String, default: '' }
});
const emit = defineEmits(['update:semitones']);

const open = ref(false);

const value = ref(props.semitones);
watch(() => props.semitones, (next) => { value.value = next; });

const SHIFTS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

const keys = computed(() =>
  SHIFTS.map((shift) => ({
    shift,
    offset: (shift + 12) % 12,
    name: transposeKey(props.originalKey, shift)
  }))
);

const currentKey = computed(() => transposeKey(props.originalKey, value.value));

const offsetLabel = computed(() =>
  value.value === 0 ? 'orig' : (value.value > 0 ? '+' : '') + value.value
);

function set(next) {
  value.value = next > 6 ? next - 12 : next < -5 ? next + 12 : next;
  emit('update:semitones', value.value);
}

const shift = (delta) => set(value.value + delta);

function pick(shiftVal) {
  set(shiftVal);
  open.value = false;
}

const ribbonRef = ref(null);

watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    const activeEl = ribbonRef.value?.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }
});

function onClickOutside(e) {
  if (open.value && !e.target.closest('[data-transpose-menu]')) {
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
  <div class="relative inline-flex items-center" data-transpose-menu>
    <div class="flex items-center gap-1.5">
      <span class="hidden text-[11px] font-bold uppercase tracking-wider text-muted/70 lg:inline select-none">
        {{ $t('song.key') }}
      </span>

      <div class="inline-flex items-center rounded-xl border border-line-soft bg-surface/80 p-0.5 shadow-2xs hover:border-line transition-colors">
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-muted hover:bg-panel hover:text-accent active:scale-95 transition-all cursor-pointer"
          :title="$t('song.semitonesDown', { n: 1 }, 1)"
          @click="shift(-1)"
        >
          <Icon name="material-symbols:remove-rounded" class="text-sm" />
        </button>

        <button
          type="button"
          class="min-w-[3.75rem] sm:min-w-[4.25rem] rounded-lg px-2 py-0.5 text-center transition-all cursor-pointer"
          :class="open ? 'bg-panel text-accent shadow-xs' : 'text-ink hover:bg-panel'"
          :title="$t('song.chooseKey')"
          :aria-expanded="open"
          @click="open = !open"
        >
          <span class="block font-mono text-xs sm:text-sm font-extrabold leading-tight text-ink">
            {{ currentKey || '—' }}
          </span>
          <span class="block font-mono text-[9px] font-semibold leading-tight" :class="value !== 0 ? 'text-accent' : 'text-muted/70'">
            {{ offsetLabel }}
          </span>
        </button>

        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-lg text-xs font-bold text-muted hover:bg-panel hover:text-accent active:scale-95 transition-all cursor-pointer"
          :title="$t('song.semitonesUp', { n: 1 }, 1)"
          @click="shift(1)"
        >
          <Icon name="material-symbols:add-rounded" class="text-sm" />
        </button>
      </div>

      <button
        v-if="value !== 0"
        type="button"
        class="flex size-7 items-center justify-center rounded-lg border border-line-soft bg-surface/80 text-accent transition hover:border-accent hover:bg-panel hover:scale-105 shadow-2xs cursor-pointer"
        :title="$t('song.backToOriginal', { key: originalKey })"
        :aria-label="$t('song.backToOriginal', { key: originalKey })"
        @click="set(0)"
      >
        <Icon name="material-symbols:restart-alt-rounded" class="text-sm" />
      </button>
    </div>

    <!-- Single-row Horizontal Ribbon ("Lenta") Dropdown Overlay -->
    <div
      v-if="open"
      ref="ribbonRef"
      class="absolute left-0 top-full mt-2 z-40 flex items-center gap-1 sm:gap-1.5 rounded-2xl border border-line bg-panel/95 p-1.5 sm:p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 overflow-x-auto max-w-[calc(100vw-2rem)] sm:max-w-none scroll-smooth [mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)] sm:[mask-image:none]"
    >
      <button
        v-for="key in keys" :key="key.shift"
        type="button"
        :data-active="key.shift === value"
        class="flex flex-col items-center justify-center min-w-[2.6rem] sm:min-w-[3rem] px-1.5 sm:px-2 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
        :class="key.shift === value
          ? 'bg-accent text-on-accent font-bold shadow-xs scale-105 ring-1 ring-accent/60'
          : 'hover:bg-surface text-muted hover:text-ink hover:scale-105'"
        @click="pick(key.shift)"
      >
        <span class="block font-mono text-xs font-bold leading-tight">{{ key.name }}</span>
        <span class="block text-[9px] font-mono leading-tight opacity-75 mt-0.5">
          {{ key.shift === 0 ? 'orig' : (key.shift > 0 ? '+' : '') + key.shift }}
        </span>
      </button>
    </div>
  </div>
</template>
