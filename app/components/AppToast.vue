<script setup>
import { initials, avatarStyle } from '~/utils/avatar';

const { toast, dismiss } = useToast();
const config = useRuntimeConfig();
const localePath = useLocalePath();

const imgError = ref(false);

watch(() => toast.value?.id, () => {
  imgError.value = false;
});

const artistImgSrc = computed(() => {
  if (!toast.value?.artistId || imgError.value) return null;
  return `${config.public.apiBase}/artists/${toast.value.artistId}/image`;
});
</script>

<template>
  <Teleport to="body">
    <div
      data-print="hide"
      class="pointer-events-none fixed inset-x-0 bottom-0 z-50 p-4 sm:bottom-6 sm:right-6 sm:inset-x-auto sm:p-0"
      aria-live="polite"
      role="status"
    >
      <Transition
        enter-active-class="transition duration-300 ease-out"
        leave-active-class="transition duration-200 ease-in"
        enter-from-class="translate-y-6 opacity-0 scale-95"
        leave-to-class="translate-y-4 opacity-0 scale-95"
      >
        <div
          v-if="toast"
          class="pointer-events-auto flex w-full max-w-sm items-center gap-3.5 rounded-2xl border border-line-strong bg-panel p-3.5 shadow-2xl shadow-black/20 backdrop-blur-md transition-colors"
        >
          <!-- Artist picture / fallback initials avatar with badge -->
          <div class="relative shrink-0">
            <img
              v-if="artistImgSrc"
              :src="artistImgSrc"
              :alt="toast.artistName || toast.title"
              class="size-12 rounded-full object-cover ring-1 ring-line"
              @error="imgError = true"
            >
            <span
              v-else
              :style="avatarStyle(toast.artistName || toast.title)"
              class="flex size-12 select-none items-center justify-center rounded-full font-semibold ring-1 ring-line text-sm"
              aria-hidden="true"
            >
              {{ initials(toast.artistName || toast.title) }}
            </span>

            <!-- Heart badge -->
            <span
              class="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-accent text-on-accent ring-2 ring-panel"
            >
              <Icon name="material-symbols:favorite-rounded" class="text-xs" />
            </span>
          </div>

          <!-- Message and song / artist details -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
              <span>{{ toast.message || $t('song.saved') }}</span>
            </div>
            <p class="truncate text-sm font-semibold text-ink leading-snug">
              {{ toast.title }}
            </p>
            <p v-if="toast.artistName && toast.artistName !== toast.title" class="truncate text-xs text-muted">
              {{ toast.artistName }}
            </p>
          </div>

          <!-- Dismiss button -->
          <div class="flex shrink-0 items-center pl-1">
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-raised hover:text-ink"
              :title="$t('common.dismiss')"
              :aria-label="$t('common.dismiss')"
              @click="dismiss"
            >
              <Icon name="material-symbols:close-rounded" class="text-lg" />
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
