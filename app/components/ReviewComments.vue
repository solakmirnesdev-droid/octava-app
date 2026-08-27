<script setup>
/**
 * The replies under one review, loaded only when opened.
 *
 * Most reviews are never expanded, so fetching every thread with the page would
 * spend a request per review to render nothing. The count on the button comes
 * from the review itself and is already known.
 */
const props = defineProps({
  reviewId: { type: String, required: true },
  count: { type: Number, default: 0 }
});
const emit = defineEmits(['changed']);

const { $api } = useNuxtApp();
const auth = useAuthStore();
const localePath = useLocalePath();
const route = useRoute();
const { t, locale } = useI18n();

const open = ref(false);
const items = ref([]);
const loading = ref(false);
const draft = ref('');
const posting = ref(false);

async function toggle() {
  open.value = !open.value;
  if (open.value && !items.value.length) await load();
}

async function load() {
  loading.value = true;
  try {
    const res = await $api(`/reviews/${props.reviewId}/comments`);
    items.value = res.items || [];
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
}

async function post() {
  const body = draft.value.trim();
  if (!body || posting.value) return;

  posting.value = true;
  try {
    const res = await $api(`/reviews/${props.reviewId}/comments`, {
      method: 'POST', body: { body }
    });
    items.value.push(res.comment);
    draft.value = '';
    emit('changed', 1);
  } finally {
    posting.value = false;
  }
}

/** Held while the dialog is up; cleared whichever way it closes. */
const pendingRemoval = ref(null);

async function remove(comment) {
  await $api(`/comments/${comment._id}`, { method: 'DELETE' });
  items.value = items.value.filter((c) => c._id !== comment._id);
  emit('changed', -1);
}

const when = (iso) => new Date(iso).toLocaleDateString(locale.value);
</script>

<template>
  <div class="mt-2">
    <button
      class="py-3.5 -my-3.5 text-xs text-faint hover:text-accent"
      :aria-expanded="open"
      @click="toggle"
    >
      {{ open ? $t('reviews.hideComments') : $t('reviews.commentCount', { n: count }, count) }}
    </button>

    <div v-if="open" class="mt-3 border-l-2 border-line pl-4">
      <p v-if="loading" class="text-xs text-faint">{{ $t('common.loading') }}</p>

      <p v-else-if="!items.length" class="text-xs text-faint">{{ $t('reviews.noComments') }}</p>

      <ul v-else class="space-y-3">
        <li v-for="c in items" :key="c._id" class="flex gap-2.5 text-sm">
          <!-- Smaller than the review's: a comment is a reply, and matching
               sizes would make the thread read as a list of equals. -->
          <UserAvatar
            :name="c.author || '?'" :user-id="c.authorId"
            :has-avatar="c.authorHasAvatar" :flag="c.authorFlag || ''" size="sm"
          />

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-x-2">
              <span class="font-medium">{{ c.author }}</span>
              <span class="text-xs text-faint">{{ when(c.createdAt) }}</span>
              <span v-if="c.editedAt" class="text-xs text-faint">· {{ $t('reviews.edited') }}</span>
              <button
                v-if="c.mine"
                class="ml-auto py-3.5 -my-3.5 text-xs text-faint hover:text-danger"
                @click="pendingRemoval = c"
              >{{ $t('reviews.remove') }}</button>
            </div>
            <p class="mt-0.5 whitespace-pre-wrap text-ink">{{ c.body }}</p>
          </div>
        </li>
      </ul>

      <form v-if="auth.isAuthenticated" class="mt-3 flex gap-2" @submit.prevent="post">
        <input
          v-model="draft" maxlength="2000"
          class="min-w-0 flex-1 rounded border border-line-strong px-3 py-1.5 text-sm outline-none focus:border-accent"
          :placeholder="$t('reviews.commentPlaceholder')"
        >
        <button
          class="shrink-0 rounded bg-accent px-3 py-1.5 text-sm text-on-accent disabled:opacity-40"
          :disabled="!draft.trim() || posting"
        >{{ posting ? $t('reviews.saving') : $t('reviews.reply') }}</button>
      </form>

      <NuxtLink
        v-else
        :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
        class="mt-3 inline-block text-xs text-faint hover:text-accent"
      >{{ $t('reviews.signInToReply') }}</NuxtLink>
    </div>

    <AppModal
      :model-value="Boolean(pendingRemoval)"
      :title="$t('reviews.removeCommentTitle')"
      :description="$t('reviews.removeComment')"
      :confirm-label="$t('reviews.remove')"
      :cancel-label="$t('common.cancel')"
      tone="danger"
      @update:model-value="(open) => { if (!open) pendingRemoval = null; }"
      @confirm="() => { const c = pendingRemoval; pendingRemoval = null; remove(c); }"
    />
  </div>
</template>
