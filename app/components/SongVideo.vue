<script setup>
/**
 * The original recording, to play while learning the chords.
 *
 * A thumbnail until it is clicked, never the iframe straight away. YouTube's
 * embed pulls well over a megabyte of script and sets its own cookies the
 * moment it loads, and most readers on a chord sheet never press play — paying
 * that on every song page would slow the thing they did come for.
 *
 * The thumbnail is a plain image from YouTube's own host, so nothing runs until
 * the reader asks for it.
 */
const props = defineProps({
  videoId: { type: String, required: true },
  title: { type: String, default: '' }
});

const playing = ref(false);

const thumbnail = computed(() => `https://i.ytimg.com/vi/${props.videoId}/hqdefault.jpg`);
const embed = computed(() =>
  `https://www.youtube-nocookie.com/embed/${props.videoId}?autoplay=1&rel=0`
);
</script>

<template>
  <section class="mt-8">
    <div class="relative aspect-video w-full overflow-hidden rounded-lg bg-raised">
      <iframe
        v-if="playing"
        :src="embed"
        :title="title || $t('song.videoLabel')"
        class="absolute inset-0 size-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />

      <button
        v-else
        type="button"
        class="group absolute inset-0 size-full"
        :aria-label="$t('song.listen')"
        @click="playing = true"
      >
        <img
          :src="thumbnail" alt="" loading="lazy"
          class="size-full object-cover transition group-hover:opacity-90"
        >
        <span class="absolute inset-0 flex items-center justify-center">
          <span
            class="flex size-16 items-center justify-center rounded-full bg-black/60 text-white
                   transition group-hover:bg-accent"
          >
            <Icon name="material-symbols:play-arrow-rounded" class="text-4xl" />
          </span>
        </span>
      </button>
    </div>

    <p class="mt-1.5 text-xs text-faint">{{ $t('song.listen') }}</p>
  </section>
</template>
