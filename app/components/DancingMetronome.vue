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
  <div class="fixed right-4 sm:right-6 bottom-20 sm:bottom-24 z-40 flex flex-col items-end" data-dancing-metronome data-print="hide">
    <!-- Popover Mini Metronome Player -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-3 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-3 scale-95"
    >
      <div
        v-if="isOpen"
        class="mb-3 w-72 sm:w-80 rounded-3xl border border-line bg-panel/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 space-y-4"
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
            class="flex size-6 items-center justify-center rounded-lg text-faint hover:bg-surface hover:text-ink transition-colors outline-none"
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
              class="flex size-8 items-center justify-center rounded-xl bg-raised hover:bg-line text-ink font-bold text-xs transition-colors shadow-2xs outline-none"
              title="-5 BPM"
              @click="setBpm(bpm - 5)"
            >
              -5
            </button>
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-xl bg-raised hover:bg-line text-ink font-bold text-xs transition-colors shadow-2xs outline-none"
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
              class="flex size-8 items-center justify-center rounded-xl bg-raised hover:bg-line text-ink font-bold text-xs transition-colors shadow-2xs outline-none"
              title="+1 BPM"
              @click="setBpm(bpm + 1)"
            >
              +1
            </button>
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-xl bg-raised hover:bg-line text-ink font-bold text-xs transition-colors shadow-2xs outline-none"
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
      <span
        class="inline-flex items-center justify-center transition-transform pointer-events-none"
        :class="running ? 'dancing-metronome-active' : 'dancing-metronome-idle'"
        :style="{ animationDuration: swingDuration }"
      >
        <MetronomeIcon size="1.65em" />
      </span>

      <!-- Active Pulsing Beat Ring Badge -->
      <span
        v-if="running"
        class="absolute -top-1 -right-1 flex size-4 items-center justify-center"
      >
        <span class="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
        <span class="relative inline-flex size-2.5 rounded-full bg-accent" />
      </span>
    </button>
  </div>
</template>

<style scoped>
/* Idle Gentle Playful Dance Animation */
.dancing-metronome-idle {
  animation: metronomeIdleDance 1.8s ease-in-out infinite alternate;
  transform-origin: 50% 85%;
}

@keyframes metronomeIdleDance {
  0% {
    transform: rotate(-10deg) translateY(0);
  }
  50% {
    transform: rotate(0deg) translateY(-2.5px) scale(1.03);
  }
  100% {
    transform: rotate(10deg) translateY(0);
  }
}

/* Active Real-time BPM Tempo Dance Animation */
.dancing-metronome-active {
  animation: metronomeActiveDance infinite alternate ease-in-out;
  transform-origin: 50% 85%;
}

@keyframes metronomeActiveDance {
  0% {
    transform: rotate(-18deg) scale(1.05);
  }
  100% {
    transform: rotate(18deg) scale(1.05);
  }
}
</style>
