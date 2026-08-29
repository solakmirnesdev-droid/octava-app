<script setup>
const { t } = useI18n();
const localePath = useLocalePath();

const {
  state, error, result, secondsLeft, cachedCount, listen, reset, clearCache, reason
} = useRecognizer();

useSeoMeta({ title: t('meta.recognizeTitle'), description: t('recognize.lead') });

const busy = computed(() => state.value === 'listening' || state.value === 'working');
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-8">
    <!-- Header -->
    <header class="text-center space-y-2">
      <div class="inline-flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent-soft px-3.5 py-1.5 text-xs font-bold text-accent shadow-2xs">
        <Icon name="material-symbols:graphic-eq-rounded" class="text-base animate-pulse" />
        <span>{{ $t('recognize.eyebrow') }}</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-ink">
        {{ $t('recognize.title') }}
      </h1>
      <p class="mx-auto max-w-lg text-xs sm:text-sm text-muted leading-relaxed">
        {{ $t('recognize.lead') }}
      </p>
    </header>

    <!-- Main Audio Recognition Hero Stage -->
    <div class="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-panel/95 via-panel/85 to-surface/90 p-8 sm:p-12 text-center backdrop-blur-xl shadow-xl ring-1 ring-white/5">
      
      <!-- Central Ambient Background Glow -->
      <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-72 sm:size-96 rounded-full bg-accent/10 blur-3xl" />

      <!-- Equalizer Watermark -->
      <div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5 select-none overflow-hidden">
        <Icon name="material-symbols:graphic-eq-rounded" class="text-[280px] text-accent" />
      </div>

      <div class="relative z-10 flex flex-col items-center gap-6">

        <!-- Animated Listening Sphere / Button -->
        <div class="relative flex items-center justify-center py-4">
          
          <!-- Outer Concentric Radar Acoustic Shockwave Rings during Listening -->
          <template v-if="state === 'listening'">
            <span class="pointer-events-none absolute size-60 sm:size-72 rounded-full border border-accent/40 animate-ping opacity-60" />
            <span class="pointer-events-none absolute size-52 sm:size-60 rounded-full border-2 border-accent/70 animate-pulse" />
            <span class="pointer-events-none absolute size-44 sm:size-52 rounded-full bg-accent/25 blur-2xl" />
          </template>

          <!-- Idle gentle ambient acoustic breathing ring -->
          <template v-else-if="state === 'idle'">
            <span class="pointer-events-none absolute size-48 sm:size-56 rounded-full border border-accent/25 bg-accent/5 blur-xs animate-pulse duration-1000" />
          </template>

          <!-- Core Microphone Button -->
          <button
            type="button"
            :disabled="busy"
            class="group relative flex size-36 sm:size-44 items-center justify-center rounded-full transition-all duration-300 outline-none cursor-pointer select-none disabled:cursor-default overflow-hidden"
            :class="[
              state === 'listening'
                ? 'bg-accent text-on-accent scale-105 ring-8 ring-accent/30 shadow-[0_0_60px_rgba(224,90,58,0.6)]'
                : state === 'working'
                  ? 'bg-accent text-on-accent ring-6 ring-accent/30 animate-pulse shadow-[0_0_40px_rgba(224,90,58,0.45)]'
                  : 'bg-surface border-2 border-accent/40 text-accent ring-4 ring-accent/10 shadow-[0_0_30px_rgba(224,90,58,0.2)] hover:border-accent hover:ring-8 hover:ring-accent/25 hover:shadow-[0_0_50px_rgba(224,90,58,0.45)] hover:scale-105 active:scale-95'
            ]"
            :aria-label="$t('recognize.listen')"
            @click="listen()"
          >
            <!-- Inner ambient radial sheen & glass reflection -->
            <span
              class="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/15 via-transparent to-black/25 opacity-70 group-hover:opacity-100 transition-opacity duration-300"
            />

            <!-- Spinning Icon when analyzing -->
            <div v-if="state === 'working'" class="relative z-10 flex flex-col items-center justify-center gap-1.5">
              <Icon
                name="material-symbols:autorenew-rounded"
                class="text-4xl sm:text-5xl animate-spin text-on-accent"
              />
              <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-on-accent/90">Analiza...</span>
            </div>

            <!-- Equalizer / Countdown when listening -->
            <div v-else-if="state === 'listening'" class="relative z-10 flex flex-col items-center justify-center gap-1">
              <Icon name="material-symbols:mic-rounded" class="text-4xl sm:text-5xl animate-bounce text-on-accent" />
              <div class="flex items-center gap-1">
                <span class="font-mono text-base sm:text-lg font-black tracking-wider text-on-accent">{{ secondsLeft }}s</span>
              </div>
            </div>

            <!-- Standard Microphone when idle / ready -->
            <div v-else class="relative z-10 flex flex-col items-center justify-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
              <div class="flex size-13 sm:size-15 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-xs group-hover:bg-accent group-hover:text-on-accent transition-all duration-300">
                <Icon
                  name="material-symbols:mic-rounded"
                  class="text-3xl sm:text-4xl"
                />
              </div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-muted group-hover:text-accent transition-colors">Slušaj</span>
            </div>
          </button>
        </div>

        <!-- Live Status Heading & Instruction -->
        <div class="space-y-1.5 max-w-md">
          <p class="text-base sm:text-lg font-bold text-ink flex items-center justify-center gap-2">
            <template v-if="state === 'listening'">
              <span class="inline-block size-2 rounded-full bg-accent animate-ping" />
              <span>{{ $t('recognize.listening') }}</span>
              <span class="font-mono text-accent">({{ secondsLeft }}s)</span>
            </template>
            <template v-else-if="state === 'working'">
              <Icon name="material-symbols:sync-rounded" class="animate-spin text-accent" />
              <span>{{ $t('recognize.working') }}</span>
            </template>
            <template v-else>
              <span>{{ $t('recognize.tapToListen') }}</span>
            </template>
          </p>

          <p class="text-xs sm:text-sm text-muted leading-relaxed">
            {{ $t('recognize.hint') }}
          </p>
        </div>

        <!-- State-Specific Result Card Overlay / Section -->
        <div v-if="state === 'done' || state === 'error'" class="w-full max-w-lg mt-2">
          
          <!-- 1. Success Result -->
          <div
            v-if="state === 'done' && result"
            class="rounded-3xl border border-accent/40 bg-gradient-to-r from-accent-soft/90 via-panel to-surface p-5 sm:p-6 backdrop-blur-xl shadow-xl ring-1 ring-accent/30 text-left space-y-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3.5">
                <div class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-md shadow-accent/30">
                  <Icon name="material-symbols:music-note-rounded" class="text-2xl" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-[10.5px] font-bold uppercase tracking-wider text-accent">Prepoznata pjesma</span>
                    <span v-if="result.offline" class="rounded-full border border-line bg-surface px-2 py-0.5 text-[9px] font-mono text-muted">
                      {{ $t('recognize.fromCache') }}
                    </span>
                  </div>
                  <h3 class="text-base sm:text-lg font-black text-ink truncate">{{ result.title }}</h3>
                  <p class="text-xs sm:text-sm font-semibold text-muted truncate">{{ result.artist?.name }}</p>
                </div>
              </div>

              <span class="shrink-0 rounded-lg border border-line-soft bg-surface/80 px-2 py-1 font-mono text-[10px] text-faint shadow-2xs">
                {{ $t('recognize.atSecond', { at: result.atSecond }) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3 pt-2 border-t border-line-soft">
              <button
                type="button"
                class="text-xs font-bold text-muted hover:text-ink transition cursor-pointer"
                @click="reset"
              >
                {{ $t('recognize.again') }}
              </button>

              <NuxtLink
                :to="localePath(`/pjesma/${result.slug}`)"
                class="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-strong text-on-accent px-4 py-2 text-xs font-bold transition shadow-sm shadow-accent/25"
              >
                <span>{{ $t('recognize.open') }}</span>
                <Icon name="material-symbols:arrow-forward-rounded" class="text-sm" />
              </NuxtLink>
            </div>
          </div>

          <!-- 2. Unsure / No Match -->
          <div
            v-else-if="state === 'done'"
            class="rounded-3xl border border-warn/30 bg-panel/95 p-5 sm:p-6 backdrop-blur-xl shadow-lg text-left space-y-3"
          >
            <div class="flex items-center gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warn/15 text-warn">
                <Icon name="material-symbols:help-outline-rounded" class="text-xl" />
              </div>
              <div>
                <!--
                  AI-NOTE: an empty index and a poor recording are different
                  answers and need different sentences. Telling somebody to move
                  closer to the speaker when no song has ever been indexed is
                  advice that cannot work, and it makes an unpopulated feature
                  read as a broken one.
                -->
                <h3 class="text-sm sm:text-base font-bold text-ink">
                  {{ reason === 'empty' ? $t('recognize.empty') : $t('recognize.unsure') }}
                </h3>
                <p class="text-xs text-muted leading-relaxed mt-0.5">
                  {{ reason === 'empty' ? $t('recognize.emptyHint') : $t('recognize.unsureHint') }}
                </p>
              </div>
            </div>

            <div class="flex justify-end pt-2 border-t border-line-soft">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface hover:bg-panel px-3.5 py-1.5 text-xs font-bold text-accent transition shadow-2xs cursor-pointer"
                @click="reset"
              >
                <Icon name="material-symbols:replay-rounded" class="text-sm" />
                <span>{{ $t('recognize.again') }}</span>
              </button>
            </div>
          </div>

          <!-- 3. Permission or Microphone Error -->
          <div
            v-else-if="state === 'error'"
            class="rounded-3xl border border-danger/30 bg-panel/95 p-5 sm:p-6 backdrop-blur-xl shadow-lg text-left space-y-3"
          >
            <div class="flex items-center gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
                <Icon name="material-symbols:mic-off-rounded" class="text-xl" />
              </div>
              <div>
                <h3 class="text-sm sm:text-base font-bold text-ink">
                  {{ error === 'permission' ? $t('recognize.noPermission') : $t('recognize.failed') }}
                </h3>
                <p class="text-xs text-muted leading-relaxed mt-0.5">
                  {{ error === 'permission' ? $t('recognize.noPermissionHint') : $t('recognize.failedHint') }}
                </p>
              </div>
            </div>

            <div class="flex justify-end pt-2 border-t border-line-soft">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface hover:bg-panel px-3.5 py-1.5 text-xs font-bold text-accent transition shadow-2xs cursor-pointer"
                @click="reset"
              >
                <Icon name="material-symbols:replay-rounded" class="text-sm" />
                <span>{{ $t('recognize.again') }}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Feature Info Cards Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="rounded-2xl border border-line bg-panel/75 p-4 backdrop-blur-md shadow-xs space-y-1.5">
        <div class="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon name="material-symbols:timer-rounded" class="text-lg" />
        </div>
        <h4 class="text-xs font-bold text-ink">{{ $t('recognize.card.fast.title') }}</h4>
        <p class="text-[11.5px] text-muted leading-relaxed">
          {{ $t('recognize.card.fast.body') }}
        </p>
      </div>

      <div class="rounded-2xl border border-line bg-panel/75 p-4 backdrop-blur-md shadow-xs space-y-1.5">
        <div class="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon name="material-symbols:queue-music-rounded" class="text-lg" />
        </div>
        <h4 class="text-xs font-bold text-ink">{{ $t('recognize.card.chords.title') }}</h4>
        <p class="text-[11.5px] text-muted leading-relaxed">
          {{ $t('recognize.card.chords.body') }}
        </p>
      </div>

      <div class="rounded-2xl border border-line bg-panel/75 p-4 backdrop-blur-md shadow-xs space-y-1.5">
        <div class="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon name="material-symbols:cloud-off-rounded" class="text-lg" />
        </div>
        <h4 class="text-xs font-bold text-ink">{{ $t('recognize.card.offline.title') }}</h4>
        <p class="text-[11.5px] text-muted leading-relaxed">
          {{ $t('recognize.card.offline.body') }}
        </p>
      </div>
    </div>

    <!-- Offline Cache Footer Status -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-2xl border border-line bg-surface/60 px-4 py-2.5 text-xs text-muted">
      <div class="flex items-center gap-2">
        <Icon name="material-symbols:database-rounded" class="text-sm text-faint" />
        <span>{{ $t('recognize.cached', { n: cachedCount }) }}</span>
      </div>
      <button
        v-if="cachedCount"
        type="button"
        class="text-xs font-semibold text-faint hover:text-danger transition cursor-pointer"
        @click="clearCache"
      >
        {{ $t('recognize.clearCache') }}
      </button>
    </div>
  </div>
</template>
