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
      type="button"
      class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent transition-colors py-1 cursor-pointer outline-none"
      :aria-expanded="open"
      @click="toggle"
    >
      <Icon name="material-symbols:chat-bubble-outline-rounded" class="text-sm" />
      <span>{{ open ? $t('reviews.hideComments') : $t('reviews.commentCount', { n: count }, count) }}</span>
      <Icon
        name="material-symbols:keyboard-arrow-down-rounded"
        class="text-xs transition-transform duration-200"
        :class="open && 'rotate-180'"
      />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="open" class="mt-2.5 rounded-xl border border-line bg-surface/75 p-3 sm:p-3.5 space-y-3 shadow-2xs">
        <p v-if="loading" class="text-xs text-faint flex items-center gap-1.5">
          <Icon name="svg-spinners:ring-resize" class="text-xs" />
          <span>{{ $t('common.loading') }}</span>
        </p>

        <p v-else-if="!items.length" class="text-xs text-faint italic py-1">
          {{ $t('reviews.noComments') }}
        </p>

        <ul v-else class="space-y-2.5 divide-y divide-line-soft">
          <li v-for="c in items" :key="c._id" class="flex items-start gap-2.5 pt-2.5 first:pt-0">
            <UserAvatar
              :name="c.author || '?'"
              :user-id="c.authorId"
              :has-avatar="c.authorHasAvatar"
              :flag="c.authorFlag || ''"
              size="xs"
              class="shrink-0 mt-0.5"
            />

            <div class="min-w-0 flex-1 space-y-0.5">
              <div class="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-ink">{{ c.author }}</span>
                  <span v-if="c.authorFlag" class="text-[10px]">{{ c.authorFlag }}</span>
                  <span class="text-faint text-[11px]">{{ when(c.createdAt) }}</span>
                  <span v-if="c.editedAt" class="text-[10px] text-faint">· {{ $t('reviews.edited') }}</span>
                </div>

                <button
                  v-if="c.mine"
                  type="button"
                  class="text-[11px] text-faint hover:text-danger transition-colors cursor-pointer"
                  @click="pendingRemoval = c"
                >
                  {{ $t('reviews.remove') }}
                </button>
              </div>
              <p class="whitespace-pre-wrap text-xs text-body leading-relaxed">{{ c.body }}</p>
            </div>
          </li>
        </ul>

        <!-- Add Reply Form -->
        <form v-if="auth.isAuthenticated" class="pt-2 flex items-center gap-2" @submit.prevent="post">
          <input
            v-model="draft"
            maxlength="2000"
            class="input-base text-xs py-1.5 pl-3 pr-3"
            :placeholder="$t('reviews.commentPlaceholder')"
          >
          <AppButton
            type="submit"
            variant="primary"
            size="xs"
            icon="material-symbols:reply-rounded"
            :loading="posting"
            :disabled="!draft.trim() || posting"
          >
            {{ posting ? $t('reviews.saving') : $t('reviews.reply') }}
          </AppButton>
        </form>

        <NuxtLink
          v-else
          :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
          class="mt-1 inline-block text-xs text-muted hover:text-accent font-medium"
        >
          {{ $t('reviews.signInToReply') }} →
        </NuxtLink>
      </div>
    </Transition>

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
