<script setup>
const props = defineProps({
  slug: { type: String, required: true },
  arrangementId: { type: String, default: null }
});

const { $api } = useNuxtApp();
const auth = useAuthStore();
const localePath = useLocalePath();
const route = useRoute();

const rating = ref(null);
const hovered = ref(0);
const saving = ref(false);
const failed = ref(false);

// Fetched on the client: the average is not part of what a search engine
// should index for this page, and it changes far more often than the chords.
onMounted(load);

async function load() {
  try {
    rating.value = await $api(`/songs/${props.slug}/rating`, {
      params: props.arrangementId ? { arrangementId: props.arrangementId } : undefined
    }).then((r) => r.rating);
  } catch {
    rating.value = null;
  }
}

/** What the stars show: your hover, then your vote, then the average. */
const displayed = computed(() => {
  if (hovered.value) return hovered.value;
  if (rating.value?.mine) return rating.value.mine;
  return Math.round(rating.value?.average || 0);
});

const isMine = computed(() => Boolean(rating.value?.mine));

async function submit(value) {
  if (!auth.isAuthenticated) return;

  saving.value = true;
  failed.value = false;
  try {
    // Sending the same value again withdraws it, so the control is its own
    // undo rather than needing a separate one.
    const method = rating.value?.mine === value ? 'DELETE' : 'POST';
    const result = await $api(`/songs/${props.slug}/rating`, {
      method,
      body: { value, arrangementId: props.arrangementId }
    });
    rating.value = result.rating;
  } catch {
    failed.value = true;
  } finally {
    saving.value = false;
    hovered.value = 0;
  }
}
</script>

<template>
  <div v-if="rating" class="flex flex-col gap-1">
    <div class="flex items-center gap-2">
      <div
        class="flex items-center"
        role="radiogroup"
        :aria-label="$t('rating.title')"
        @mouseleave="hovered = 0"
      >
        <button
          v-for="star in 5" :key="star"
          type="button"
          role="radio"
          :aria-checked="rating.mine === star"
          :aria-label="$t('rating.star', { n: star })"
          :disabled="saving || !auth.isAuthenticated"
          class="px-0.5 transition disabled:cursor-default"
          :class="star <= displayed
            ? (isMine || hovered ? 'text-accent' : 'text-faint')
            : 'text-dim'"
          @mouseenter="auth.isAuthenticated && (hovered = star)"
          @click="submit(star)"
        >
          <Icon name="material-symbols:star-rounded" />
        </button>
      </div>

      <span class="text-xs text-faint">
        <template v-if="rating.count">
          {{ $t('rating.average', { average: rating.average }) }}
          · {{ $t('rating.count', rating.count, { n: rating.count }) }}
        </template>
        <template v-else>{{ $t('rating.count', 0, { n: 0 }) }}</template>
      </span>
    </div>

    <p v-if="failed" role="alert" class="text-xs text-accent">{{ $t('rating.failed') }}</p>

    <p v-else-if="!auth.isAuthenticated" class="text-xs text-faint">
      <NuxtLink
        :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
        class="hover:text-accent hover:underline"
      >{{ $t('rating.signInToRate') }}</NuxtLink>
    </p>

    <p v-else-if="isMine" class="text-xs text-faint">
      {{ $t('rating.yourRating') }}: {{ rating.mine }} ·
      <button class="hover:text-accent hover:underline" @click="submit(rating.mine)">
        {{ $t('rating.remove') }}
      </button>
    </p>

    <p v-else class="text-xs text-faint">{{ $t('rating.hint') }}</p>
  </div>
</template>
