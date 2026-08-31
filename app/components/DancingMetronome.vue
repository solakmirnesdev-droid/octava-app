<script setup>
import { useMetronome, MIN_BPM, MAX_BPM } from '~/composables/useMetronome';

const { running, bpm, beatsPerBar, beat, toggle, setBpm, tap } = useMetronome();
const isOpen = ref(false);
const localePath = useLocalePath();

const swingDuration = computed(() => {
  if (running.value) {
    return `${(60 / bpm.value).toFixed(3)}s`;
  }
  return '1.2s';
});

// Close popover when clicking outside
function onClickOutside(e) {
  if (isOpen.value && !e.target.closest('[data-dancing-metronome]')) {
    isOpen.value = false;
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
  <div
    class="relative flex flex-col items-end"
    data-dancing-metronome
  >
    <!-- Popover Mini Metronome Player (Positioned to the left of floating buttons) -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-3 sm:translate-x-3 scale-95"
      enter-to-class="opacity-100 translate-y-0 sm:translate-x-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 sm:translate-x-0 scale-100"
      leave-to-class="opacity-0 translate-y-3 sm:translate-x-3 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed right-3 sm:right-20 bottom-18 sm:bottom-6 z-50 w-72 sm:w-80 max-h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100dvh-6.5rem)] overflow-y-auto rounded-3xl border border-line bg-panel/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 space-y-4 pointer-events-auto"
        role="dialog"
        aria-label="Mini metronom"
      >
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="flex size-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <MetronomeIcon size="1.2em" />
            </span>
            <div>
              <h3 class="text-xs font-bold text-ink uppercase tracking-wider">Metronom</h3>
              <p class="text-[10.5px] text-muted">Drži ritam tokom sviranja</p>
            </div>
          </div>

          <button
            type="button"
            class="flex size-6 items-center justify-center rounded-lg text-faint hover:bg-surface hover:text-ink transition-colors outline-none cursor-pointer"
            @click="isOpen = false"
          >
            <Icon name="material-symbols:close-rounded" class="text-base" />
          </button>
        </div>

        <!-- Beat Pulse Visualizer Dots -->
        <div class="flex items-center justify-center gap-2.5 py-1">
          <span
            v-for="b in beatsPerBar"
            :key="b"
            class="h-2.5 rounded-full transition-all duration-100"
            :class="[
              beat === b - 1
                ? (b === 1 ? 'w-6 bg-warn shadow-md shadow-warn/40' : 'w-6 bg-accent shadow-md shadow-accent/40')
                : 'w-2.5 bg-line-strong opacity-40'
            ]"
          />
        </div>

        <!-- BPM Display & Direct Step Controls -->
        <div class="flex items-center justify-between rounded-2xl border border-line bg-surface/80 p-2.5 shadow-2xs">
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-xl bg-raised hover:bg-line text-ink font-bold text-xs transition-colors shadow-2xs outline-none cursor-pointer"
              title="-5 BPM"
              @click="setBpm(bpm - 5)"
            >
              -5
            </button>
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-xl bg-raised hover:bg-line text-ink font-bold text-xs transition-colors shadow-2xs outline-none cursor-pointer"
              title="-1 BPM"
              @click="setBpm(bpm - 1)"
            >
              -1
            </button>
          </div>

          <!-- Central BPM number -->
          <div class="text-center px-2">
            <div class="font-mono text-2xl font-black text-ink leading-none">{{ bpm }}</div>
            <div class="text-[10px] font-mono text-faint font-semibold uppercase tracking-wider mt-0.5">BPM</div>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-xl bg-raised hover:bg-line text-ink font-bold text-xs transition-colors shadow-2xs outline-none cursor-pointer"
              title="+1 BPM"
              @click="setBpm(bpm + 1)"
            >
              +1
            </button>
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-xl bg-raised hover:bg-line text-ink font-bold text-xs transition-colors shadow-2xs outline-none cursor-pointer"
              title="+5 BPM"
              @click="setBpm(bpm + 5)"
            >
              +5
            </button>
          </div>
        </div>

        <!-- Range Slider -->
        <div>
          <input
            type="range"
            :min="MIN_BPM"
            :max="MAX_BPM"
            :value="bpm"
            class="w-full accent-accent cursor-pointer h-1.5 bg-line rounded-lg"
            @input="setBpm(Number($event.target.value))"
          >
        </div>

        <!-- Primary Action Controls: Big Play/Pause + Tap Tempo -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 font-bold text-xs sm:text-sm text-on-accent transition-all duration-200 shadow-lg cursor-pointer outline-none"
            :class="running
              ? 'bg-danger shadow-danger/25 hover:bg-danger/90'
              : 'bg-accent shadow-accent/25 hover:bg-accent/90'"
            @click="toggle"
          >
            <Icon :name="running ? 'material-symbols:pause-rounded' : 'material-symbols:play-arrow-rounded'" class="text-lg" />
            <span>{{ running ? 'Zaustavi' : 'Pokreni' }}</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface hover:bg-raised text-ink font-bold text-xs py-2.5 px-3 transition-colors shadow-2xs outline-none cursor-pointer"
            title="Tap Tempo"
            @click="tap"
          >
            <Icon name="material-symbols:touch-app-rounded" class="text-sm text-accent" />
            <span>Tap</span>
          </button>
        </div>

        <!-- Footer link to full metronome page -->
        <div class="border-t border-line-soft/80 pt-2 flex items-center justify-between text-[11px]">
          <NuxtLink
            :to="localePath('/metronom')"
            class="text-accent hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <span>Otvori puni metronom</span>
            <Icon name="material-symbols:arrow-forward-rounded" class="text-xs" />
          </NuxtLink>

          <span class="text-faint font-mono">Razmak za start</span>
        </div>
      </div>
    </Transition>

    <!-- Floating Dancing Metronome Button Trigger -->
    <button
      type="button"
      class="group relative flex size-12 sm:size-13 items-center justify-center rounded-2xl border transition-all duration-200 shadow-xl backdrop-blur-xl outline-none cursor-pointer"
      :class="[
        running
          ? 'border-accent bg-accent-soft text-accent ring-2 ring-accent/40 shadow-accent/20 scale-105'
          : isOpen
            ? 'border-accent bg-panel text-accent shadow-md'
            : 'border-line/80 bg-panel/90 text-accent hover:border-accent hover:bg-panel hover:scale-105'
      ]"
      :title="running ? `Metronom radi (${bpm} BPM)` : 'Otvori metronom'"
      @click="isOpen = !isOpen"
    >
      <!-- Dancing / Swinging Animated Metronome Icon -->
      <span class="inline-flex items-center justify-center pointer-events-none">
        <MetronomeIcon
          size="1.65em"
          :running="running"
          :duration="swingDuration"
        />
      </span>

      <!-- Active Pulsing Beat Ring Badge (Synchronized with metronome beep audio clock) -->
      <span
        v-if="running"
        class="absolute -top-1 -right-1 flex size-4.5 items-center justify-center pointer-events-none"
      >
        <span
          :key="beat"
          class="absolute inline-flex size-full beat-pulse-ring rounded-full"
          :class="beat === 0 ? 'bg-warn' : 'bg-accent'"
        />
        <span
          class="relative inline-flex rounded-full transition-all duration-75"
          :class="[
            beat === 0
              ? 'size-3 bg-warn shadow-xs shadow-warn/80 scale-125'
              : 'size-2.5 bg-accent shadow-xs shadow-accent/80'
          ]"
        />
      </span>
    </button>
  </div>
</template>

<style scoped>
/* Audio-synchronized beat pulse ring expansion */
.beat-pulse-ring {
  animation: beatPulseRing 0.35s cubic-bezier(0, 0, 0.2, 1) forwards;
}

@keyframes beatPulseRing {
  0% {
    transform: scale(0.9);
    opacity: 0.9;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}
</style>
