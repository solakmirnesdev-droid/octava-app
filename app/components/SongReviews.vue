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
const removing = ref(false);


async function remove() {
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
  <section id="recenzije" class="mt-10 border-t border-line/80 pt-6 space-y-4">
    <!-- Header: Title + Badge + Write Review Trigger -->
    <header class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h2 class="text-lg sm:text-xl font-bold tracking-tight text-ink">{{ $t('reviews.title') }}</h2>
        <AppBadge v-if="total > 0" variant="accent" size="xs">
          {{ $t('reviews.count', { n: total }, total) }}
        </AppBadge>
      </div>

      <!-- Quick Write Action Button when user has no review and not already editing -->
      <AppButton
        v-if="auth.isAuthenticated && !mine && !editing"
        variant="secondary"
        size="xs"
        icon="material-symbols:edit-rounded"
        @click="startWriting"
      >
        {{ $t('reviews.write') }}
      </AppButton>
    </header>

    <!-- 1. Review Input / Composer (Active when editing is true, or user clicked write) -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-2 scale-[0.99]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-2 scale-[0.99]"
    >
      <AppCard
        v-if="auth.isAuthenticated && editing"
        variant="gradient"
        padding="md"
        class="border-accent/40 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <UserAvatar
              :name="auth.user?.username || '?'"
              :user-id="auth.user?.id"
              :has-avatar="auth.user?.hasAvatar"
              :flag="auth.user?.flag || ''"
              size="sm"
            />
            <div>
              <p class="text-xs sm:text-sm font-bold text-ink flex items-center gap-1.5 leading-tight">
                <span>{{ auth.user?.username }}</span>
                <span v-if="auth.user?.flag" class="text-xs">{{ auth.user.flag }}</span>
              </p>
              <p class="text-[11px] text-muted leading-tight mt-0.5">
                {{ mine ? 'Uređivanje tvoje recenzije' : 'Napiši svoje utiske ili savjete za sviranje ove pjesme' }}
              </p>
            </div>
          </div>

          <button
            type="button"
            class="text-xs text-muted hover:text-ink transition-colors p-1 cursor-pointer"
            :title="$t('reviews.cancel')"
            @click="editing = false"
          >
            <Icon name="material-symbols:close-rounded" class="text-base" />
          </button>
        </div>

        <form class="space-y-3" @submit.prevent="submit">
          <div class="relative">
            <Icon
              name="material-symbols:edit-note-rounded"
              class="pointer-events-none absolute left-3.5 top-3 text-2xl text-muted/70"
            />
            <textarea
              v-model="draft"
              rows="3"
              maxlength="4000"
              autofocus
              class="textarea-base pl-12 min-h-[95px] leading-relaxed text-xs sm:text-sm focus:ring-2 focus:ring-accent/20"
              :placeholder="$t('reviews.placeholder')"
            />
          </div>

          <!-- Alert Error if any -->
          <div
            v-if="error"
            role="alert"
            class="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft p-2.5 text-xs text-danger font-medium"
          >
            <Icon name="material-symbols:error-rounded" class="text-base shrink-0" />
            <span>{{ error }}</span>
          </div>

          <!-- Actions & Character Info -->
          <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div class="flex items-center gap-1.5 text-xs font-mono text-faint">
              <span>{{ draft.length }}/4000</span>
              <span v-if="draft.length > 0 && draft.trim().length < 3" class="text-warn text-[11px]">
                (min. 3 znaka)
              </span>
            </div>

            <div class="flex items-center gap-2">
              <AppButton
                type="button"
                variant="ghost"
                size="xs"
                @click="editing = false"
              >
                {{ $t('reviews.cancel') }}
              </AppButton>

              <AppButton
                type="submit"
                variant="primary"
                size="xs"
                icon="material-symbols:send-rounded"
                :loading="posting"
                :disabled="posting || draft.trim().length < 3"
              >
                {{ posting ? $t('reviews.saving') : (mine ? $t('reviews.save') : $t('reviews.post')) }}
              </AppButton>
            </div>
          </div>
        </form>
      </AppCard>
    </Transition>

    <!-- 2. The User's Own Review ("Tvoja recenzija") Card -->
    <AppCard
      v-if="auth.isAuthenticated && mine && !editing"
      variant="glass"
      padding="md"
      class="border-accent/30 shadow-2xs ring-1 ring-accent/10"
    >
      <div class="flex items-start gap-3">
        <UserAvatar
          :name="auth.user?.username || '?'"
          :user-id="auth.user?.id"
          :has-avatar="auth.user?.hasAvatar"
          :flag="auth.user?.flag || ''"
          size="md"
          class="shrink-0 mt-0.5"
        />

        <div class="min-w-0 flex-1 space-y-1.5">
          <!-- Top Row: Author Name, Badge, Date & Actions -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
              <span class="font-bold text-ink">{{ auth.user?.username }}</span>
              <span v-if="auth.user?.flag" class="text-xs">{{ auth.user.flag }}</span>

              <AppBadge variant="accent" size="xs" dot>
                {{ $t('reviews.yoursTag') }}
              </AppBadge>

              <span class="text-xs text-faint ml-0.5">
                {{ when(mine.createdAt) }}
                <span v-if="mine.editedAt" class="text-[11px] text-faint">· {{ $t('reviews.edited') }}</span>
              </span>
            </div>

            <!-- Edit / Delete Actions -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                class="text-xs text-muted hover:text-accent font-medium px-2 py-1 rounded hover:bg-raised transition-colors cursor-pointer"
                @click="startWriting"
              >
                {{ $t('reviews.edit') }}
              </button>

              <button
                type="button"
                class="text-xs text-danger/80 hover:text-danger font-medium px-2 py-1 rounded hover:bg-danger-soft transition-colors cursor-pointer"
                @click="removing = true"
              >
                {{ $t('reviews.remove') }}
              </button>
            </div>
          </div>

          <!-- Review Body -->
          <p class="whitespace-pre-wrap text-sm text-body leading-relaxed font-sans">
            {{ mine.body }}
          </p>

          <!-- Replies Thread -->
          <ReviewComments
            :review-id="mine._id"
            :count="mine.commentCount"
            @changed="(d) => adjustCount(mine, d)"
          />
        </div>
      </div>
    </AppCard>

    <!-- 3. Not Logged In Callout Card -->
    <div
      v-if="!auth.isAuthenticated"
      class="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-line bg-panel/75 p-3.5 sm:p-4 backdrop-blur-xs shadow-2xs"
    >
      <div class="flex items-center gap-3">
        <Icon name="material-symbols:rate-review-outline-rounded" class="text-2xl text-accent shrink-0" />
        <div>
          <p class="text-xs sm:text-sm font-bold text-ink">Želiš podijeliti svoje mišljenje?</p>
          <p class="text-xs text-muted">{{ $t('reviews.signIn') }}</p>
        </div>
      </div>

      <AppButton
        :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
        variant="secondary"
        size="xs"
        icon="material-symbols:login-rounded"
      >
        {{ $t('nav.login') }}
      </AppButton>
    </div>

    <!-- 4. Empty State -->
    <div
      v-if="!loading && !total && !editing"
      class="rounded-2xl border border-line bg-panel/40 py-8 text-center space-y-1.5"
    >
      <p class="text-sm font-semibold text-ink">{{ $t('reviews.empty') }}</p>
      <p class="text-xs text-muted">Ostavi prvi komentar o tačnosti akorda, tonalitetu ili izvođenju.</p>
    </div>

    <!-- 5. Community Reviews List -->
    <ul v-else-if="others.length" class="space-y-3">
      <li v-for="r in others" :key="r._id">
        <AppCard variant="default" padding="md" class="hover:border-line-strong transition-all duration-150">
          <div class="flex items-start gap-3">
            <UserAvatar
              :name="r.author || '?'"
              :user-id="r.authorId"
              :has-avatar="r.authorHasAvatar"
              :flag="r.authorFlag || ''"
              size="md"
              class="shrink-0 mt-0.5"
            />

            <div class="min-w-0 flex-1 space-y-1.5">
              <div class="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                <span class="font-bold text-ink">{{ r.author }}</span>
                <span v-if="r.authorFlag" class="text-xs">{{ r.authorFlag }}</span>
                <span class="text-xs text-faint ml-0.5">
                  {{ when(r.createdAt) }}
                  <span v-if="r.editedAt" class="text-[11px] text-faint">· {{ $t('reviews.edited') }}</span>
                </span>
              </div>

              <p class="whitespace-pre-wrap text-sm text-body leading-relaxed font-sans">
                {{ r.body }}
              </p>

              <ReviewComments
                :review-id="r._id"
                :count="r.commentCount"
                @changed="(d) => adjustCount(r, d)"
              />
            </div>
          </div>
        </AppCard>
      </li>
    </ul>

    <!-- Load More Button -->
    <div v-if="page < pages" class="pt-1 text-center">
      <AppButton
        variant="secondary"
        size="xs"
        :loading="loading"
        @click="load(page + 1)"
      >
        {{ loading ? $t('common.loading') : $t('reviews.loadMore') }}
      </AppButton>
    </div>

    <!-- Removal Confirmation Dialog -->
    <AppModal
      v-model="removing"
      :title="$t('reviews.removeTitle')"
      :description="$t('reviews.removeConfirm')"
      :confirm-label="$t('reviews.remove')"
      :cancel-label="$t('common.cancel')"
      tone="danger"
      @confirm="removing = false; remove()"
    />
  </section>
</template>
