<script setup>
/**
 * Reviews under a song, and the form for writing your own.
 *
 * Fetched on the client rather than during SSR. What a search engine should
 * index on this page are the chords; reviews change independently of them and
 * would otherwise put a second API call in front of the thing people came for.
 */
const props = defineProps({
  slug: { type: String, required: true }
});

const { $api } = useNuxtApp();
const auth = useAuthStore();
const localePath = useLocalePath();
const route = useRoute();
const { t, locale } = useI18n();

const items = ref([]);
const mine = ref(null);
const total = ref(0);
const page = ref(1);
const pages = ref(1);
const loading = ref(true);

const editing = ref(false);
const draft = ref('');
const posting = ref(false);
const error = ref('');

onMounted(load);

async function load(next = 1) {
  loading.value = true;
  try {
    const res = await $api(`/songs/${props.slug}/reviews`, { params: { page: next, limit: 10 } });
    // Appending rather than replacing past the first page: "load more" that
    // swaps the list out loses the review you were halfway through reading.
    items.value = next === 1 ? res.items : [...items.value, ...res.items];
    mine.value = res.mine;
    total.value = res.total;
    pages.value = res.pages;
    page.value = next;
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
}

/** Your own review is pulled out of the list so it never appears twice. */
const others = computed(() =>
  items.value.filter((r) => !mine.value || r._id !== mine.value._id)
);

function startWriting() {
  draft.value = mine.value?.body || '';
  editing.value = true;
  error.value = '';
}

async function submit() {
  const body = draft.value.trim();
  if (body.length < 3) {
    error.value = t('reviews.tooShort');
    return;
  }

  posting.value = true;
  error.value = '';
  try {
    await $api(`/songs/${props.slug}/reviews`, { method: 'POST', body: { body } });
    editing.value = false;
    await load(1);
  } catch (err) {
    // 403 is the one case with a real explanation: moderation.
    error.value = err?.data?.statusCode === 403 || err?.statusCode === 403
      ? t('reviews.hiddenNotice')
      : t('reviews.failed');
  } finally {
    posting.value = false;
  }
}

async function remove() {
  if (!confirm(t('reviews.removeConfirm'))) return;
  await $api(`/reviews/${mine.value._id}`, { method: 'DELETE' });
  mine.value = null;
  await load(1);
}

/** Keeps the count under a review in step without refetching the page. */
function adjustCount(review, delta) {
  review.commentCount = Math.max((review.commentCount || 0) + delta, 0);
}

const when = (iso) => new Date(iso).toLocaleDateString(locale.value);
</script>

<template>
  <section class="mt-10 border-t border-black/10 pt-6">
    <header class="mb-4 flex flex-wrap items-baseline gap-x-3">
      <h2 class="text-lg font-semibold tracking-tight">{{ $t('reviews.title') }}</h2>
      <span class="text-sm text-black/45">{{ $t('reviews.count', { n: total }, total) }}</span>
    </header>

    <!-- Your own, first and set apart: it is the one you can act on. -->
    <div v-if="auth.isAuthenticated" class="mb-6">
      <form v-if="editing" @submit.prevent="submit">
        <textarea
          v-model="draft" rows="4" maxlength="4000" autofocus
          class="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
          :placeholder="$t('reviews.placeholder')"
        />
        <p v-if="error" class="mt-1 text-sm text-rose-700">{{ error }}</p>
        <div class="mt-2 flex gap-2">
          <button
            class="rounded bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-40"
            :disabled="posting || draft.trim().length < 3"
          >{{ posting ? $t('reviews.saving') : (mine ? $t('reviews.save') : $t('reviews.post')) }}</button>
          <button type="button" class="rounded px-3 py-1.5 text-sm text-black/60 hover:text-accent"
                  @click="editing = false">{{ $t('reviews.cancel') }}</button>
        </div>
      </form>

      <div v-else-if="mine" class="rounded border border-accent/30 bg-accent/[0.03] px-4 py-3">
        <div class="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span class="font-medium">{{ $t('reviews.yours') }}</span>
          <span class="text-xs text-black/35">{{ when(mine.createdAt) }}</span>
          <span v-if="mine.editedAt" class="text-xs text-black/30">· {{ $t('reviews.edited') }}</span>
          <span class="ml-auto flex gap-3">
            <button class="py-3.5 -my-3.5 text-xs text-black/45 hover:text-accent" @click="startWriting">
              {{ $t('reviews.edit') }}
            </button>
            <button class="py-3.5 -my-3.5 text-xs text-black/45 hover:text-rose-700" @click="remove">
              {{ $t('reviews.remove') }}
            </button>
          </span>
        </div>
        <p class="mt-1.5 whitespace-pre-wrap text-sm text-black/80">{{ mine.body }}</p>
        <ReviewComments
          :review-id="mine._id" :count="mine.commentCount"
          @changed="(d) => adjustCount(mine, d)"
        />
      </div>

      <button
        v-else
        class="rounded border border-black/15 bg-white px-3 py-1.5 text-sm hover:border-accent hover:text-accent"
        @click="startWriting"
      >{{ $t('reviews.write') }}</button>
    </div>

    <NuxtLink
      v-else
      :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
      class="mb-6 inline-block text-sm text-black/50 hover:text-accent"
    >{{ $t('reviews.signIn') }}</NuxtLink>

    <p v-if="loading && !items.length" class="text-sm text-black/40">{{ $t('common.loading') }}</p>

    <p v-else-if="!total" class="text-sm text-black/45">{{ $t('reviews.empty') }}</p>

    <ul v-else class="space-y-5">
      <li v-for="r in others" :key="r._id" class="border-b border-black/5 pb-5 last:border-0">
        <div class="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span class="font-medium">{{ r.author }}</span>
          <span class="text-xs text-black/35">{{ when(r.createdAt) }}</span>
          <span v-if="r.editedAt" class="text-xs text-black/30">· {{ $t('reviews.edited') }}</span>
        </div>
        <p class="mt-1 whitespace-pre-wrap text-sm text-black/80">{{ r.body }}</p>
        <ReviewComments :review-id="r._id" :count="r.commentCount" @changed="(d) => adjustCount(r, d)" />
      </li>
    </ul>

    <button
      v-if="page < pages"
      class="mt-5 rounded border border-black/15 px-3 py-1.5 text-sm hover:border-accent hover:text-accent disabled:opacity-40"
      :disabled="loading"
      @click="load(page + 1)"
    >{{ loading ? $t('common.loading') : $t('reviews.loadMore') }}</button>
  </section>
</template>
