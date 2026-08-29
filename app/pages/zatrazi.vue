<script setup>
const localePath = useLocalePath();
const { $api } = useNuxtApp();
const auth = useAuthStore();

const form = ref({ title: '', artist: '', note: '' });
const sending = ref(false);
const feedback = ref(null);
const statusFilter = ref('all');

const { data, refresh } = await useAsyncData('requests', () =>
  $api('/requests', { params: { limit: 50 } }).catch(() => ({ requests: [] }))
);

async function submit() {
  if (!form.value.title.trim() || !form.value.artist.trim()) return;

  sending.value = true;
  feedback.value = null;
  try {
    const result = await $api('/requests', { method: 'POST', body: form.value });
    feedback.value = result.alreadyRequested
      ? { tone: 'info', text: 'Neko je već tražio ovu pjesmu — dodali smo tvoj glas!' }
      : { tone: 'ok', text: 'Zahtjev je uspješno zabilježen. Hvala ti!' };
    form.value = { title: '', artist: '', note: '' };
    await refresh();
  } catch (err) {
    feedback.value = { tone: 'error', text: err.data?.message || 'Slanje zahtjeva nije uspjelo. Pokušaj ponovo.' };
  } finally {
    sending.value = false;
  }
}

async function toggleVote(request) {
  if (!auth.isAuthenticated) return navigateTo('/prijava?redirect=/zatrazi');
  try {
    await $api(`/requests/${request._id}/vote`, { method: 'POST' });
    await refresh();
  } catch {
    // A failed vote is not worth interrupting the page for.
  }
}

const STATUS_CONFIG = {
  open: { label: 'Čeka obradu', variant: 'neutral', dot: true, pulse: false },
  in_progress: { label: 'U radu', variant: 'warn', dot: true, pulse: true },
  done: { label: 'Obrađeno', variant: 'ok', dot: true, pulse: false }
};

const filteredRequests = computed(() => {
  const list = data.value?.requests || [];
  if (statusFilter.value === 'all') return list;
  return list.filter(r => r.status === statusFilter.value);
});

useSeoMeta({
  title: 'Zatraži akorde | Octava',
  description: 'Nema pjesme koju tražiš? Pošalji zahtjev i glasaj za pjesme koje drugi traže.'
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <RequestIcon size="1.3em" />
          </span>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-ink">{{ $t('page.requestTitle') }}</h1>
        </div>
        <p class="mt-1 text-xs sm:text-sm text-muted">
          {{ $t('page.requestLead') }}
        </p>
      </div>

      <!-- Total Metric Badge -->
      <div class="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-line bg-panel/70 px-3 py-1.5 backdrop-blur-xs shadow-2xs font-mono text-xs text-muted">
        <Icon name="material-symbols:queue-music-rounded" class="text-sm text-accent" />
        <span>{{ data?.requests?.length || 0 }} {{ (data?.requests?.length || 0) === 1 ? 'zahtjev' : 'zahtjeva' }}</span>
      </div>
    </header>

    <!-- 2-Column Responsive Studio Cockpit Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- 1. LEFT COLUMN: Submit Request Studio Card (5 cols on lg) -->
      <AppCard as="section" variant="gradient" padding="lg" class="lg:col-span-5 space-y-5">
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface/90 text-accent shadow-2xs">
            <Icon name="material-symbols:add-notes-rounded" class="text-xl" />
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-ink">Novi zahtjev</h2>
            <p class="text-xs text-muted">Upiši izvođača i naziv pjesme</p>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <!-- Artist Field -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-ink uppercase tracking-wider block">
              {{ $t('page.artist') }} <span class="text-accent">*</span>
            </label>
            <div class="relative">
              <Icon
                name="material-symbols:person-rounded"
                class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-muted/70"
              />
              <input
                v-model="form.artist"
                required
                maxlength="120"
                placeholder="npr. Oliver Dragojević, Dino Merlin..."
                class="input-base pl-11"
              >
            </div>
          </div>

          <!-- Song Title Field -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-ink uppercase tracking-wider block">
              {{ $t('page.songTitle') }} <span class="text-accent">*</span>
            </label>
            <div class="relative">
              <Icon
                name="material-symbols:music-note-rounded"
                class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-muted/70"
              />
              <input
                v-model="form.title"
                required
                maxlength="200"
                placeholder="npr. Cesarica, Nedostaješ..."
                class="input-base pl-11"
              >
            </div>
          </div>

          <!-- Note Field (Optional) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-ink uppercase tracking-wider block">
                {{ $t('page.note') }}
                <span class="text-[11px] font-normal text-faint normal-case">({{ $t('page.optional') }})</span>
              </label>
              <span class="text-[11px] font-mono text-faint">{{ form.note.length }}/500</span>
            </div>
            <div class="relative">
              <Icon
                name="material-symbols:edit-note-rounded"
                class="pointer-events-none absolute left-3.5 top-3 text-2xl text-muted/70"
              />
              <textarea
                v-model="form.note"
                rows="3"
                maxlength="500"
                :placeholder="$t('page.notePlaceholder')"
                class="textarea-base pl-12 min-h-[90px] leading-relaxed text-xs sm:text-sm"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <AppButton
            type="submit"
            :loading="sending"
            :disabled="sending"
            block
            size="lg"
          >
            <template #icon>
              <RequestIcon size="1.2em" />
            </template>
            <span>{{ sending ? 'Šaljem zahtjev…' : 'Pošalji zahtjev' }}</span>
          </AppButton>

          <!-- Inline Feedback Alert -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div
              v-if="feedback"
              role="status"
              class="flex items-start gap-2.5 rounded-xl border p-3 text-xs font-medium backdrop-blur-xs"
              :class="{
                'border-ok/30 bg-ok-soft text-ok': feedback.tone === 'ok',
                'border-line bg-surface text-ink': feedback.tone === 'info',
                'border-accent/30 bg-accent-soft text-accent': feedback.tone === 'error'
              }"
            >
              <Icon
                :name="feedback.tone === 'ok' ? 'material-symbols:check-circle-rounded' : feedback.tone === 'error' ? 'material-symbols:error-rounded' : 'material-symbols:info-rounded'"
                class="text-base shrink-0 mt-0.5"
              />
              <span class="leading-relaxed">{{ feedback.text }}</span>
            </div>
          </Transition>
        </form>
      </AppCard>

      <!-- 2. RIGHT COLUMN: Trending Requests & Community Voting Feed (7 cols on lg) -->
      <section class="lg:col-span-7 space-y-4">
        <!-- Section Header + Status Filter Tabs -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
          <div class="flex items-center gap-2">
            <Icon name="material-symbols:local-fire-department-rounded" class="text-warn text-lg" />
            <h2 class="text-sm font-bold uppercase tracking-wider text-ink">
              {{ $t('page.popular') }}
            </h2>
          </div>

          <!-- Status Filter Tabs -->
          <div class="inline-flex items-center rounded-xl border border-line bg-panel/80 p-0.5 text-xs">
            <button
              v-for="tab in [
                { key: 'all', label: 'Sve' },
                { key: 'open', label: 'Na čekanju' },
                { key: 'in_progress', label: 'U radu' },
                { key: 'done', label: 'Gotovo' }
              ]"
              :key="tab.key"
              type="button"
              class="rounded-lg px-2.5 py-1 transition-all font-medium outline-none"
              :class="statusFilter === tab.key ? 'bg-panel font-bold text-accent shadow-xs' : 'text-muted hover:text-ink'"
              @click="statusFilter = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!filteredRequests.length" class="rounded-2xl border border-line bg-panel/50 py-12 text-center">
          <Icon name="material-symbols:playlist-remove-rounded" class="mx-auto text-4xl text-faint mb-2" />
          <p class="text-sm font-semibold text-ink">{{ $t('page.noRequests') }}</p>
          <p class="text-xs text-muted mt-1">Budi prvi koji će poslati zahtjev za ovu pjesmu!</p>
        </div>

        <!-- Requests Feed List -->
        <ul v-else class="space-y-2.5">
          <li
            v-for="request in filteredRequests"
            :key="request._id"
            class="group flex items-center justify-between gap-3.5 rounded-2xl border border-line/75 bg-gradient-to-b from-panel/90 via-panel/75 to-surface/80 p-3 sm:p-3.5 backdrop-blur-md shadow-2xs transition-all duration-200 hover:border-accent/60 hover:bg-panel hover:shadow-xs"
          >
            <!-- Upvote Button -->
            <button
              type="button"
              class="group/vote flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border transition-all duration-200 outline-none"
              :class="request.voted
                ? 'border-accent bg-accent text-on-accent font-bold shadow-md shadow-accent/25 scale-102'
                : 'border-line bg-surface/90 text-muted hover:border-accent hover:text-accent hover:bg-accent-soft/35 shadow-2xs'"
              :title="request.voted ? $t('page.unvote') : $t('page.vote')"
              @click="toggleVote(request)"
            >
              <Icon
                name="material-symbols:keyboard-arrow-up-rounded"
                class="text-base leading-none transition-transform group-hover/vote:-translate-y-0.5"
              />
              <span class="font-mono text-xs font-bold leading-none">{{ request.votes }}</span>
            </button>

            <!-- Request Details (Song Title, Artist, Note) -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="truncate text-xs sm:text-sm font-bold text-ink group-hover:text-accent transition-colors">
                  {{ request.title }}
                </h3>
                <span class="text-faint text-xs">·</span>
                <span class="truncate text-xs text-muted font-medium">
                  {{ request.artist }}
                </span>
              </div>

              <div v-if="request.note" class="mt-1 flex items-center gap-1.5">
                <span class="inline-flex items-center gap-1 text-[11px] text-faint bg-surface/90 px-2 py-0.5 rounded-md border border-line/60">
                  <Icon name="material-symbols:chat-bubble-outline-rounded" class="text-[10px] text-accent shrink-0" />
                  <span class="truncate max-w-xs sm:max-w-md">{{ request.note }}</span>
                </span>
              </div>
            </div>

            <!-- Status Pill or Direct Link -->
            <div class="shrink-0">
              <NuxtLink
                v-if="request.fulfilledBy"
                :to="localePath(`/pjesma/${request.fulfilledBy.slug}`)"
                class="inline-flex items-center gap-1 rounded-xl bg-accent-soft hover:bg-accent hover:text-on-accent text-accent border border-accent/30 px-3 py-1.5 text-xs font-bold transition-all shadow-2xs"
              >
                <span>Akordi</span>
                <Icon name="material-symbols:arrow-forward-rounded" class="text-xs" />
              </NuxtLink>

              <AppBadge
                v-else
                :variant="STATUS_CONFIG[request.status]?.variant || 'neutral'"
                :dot="STATUS_CONFIG[request.status]?.dot ?? true"
                :pulse="STATUS_CONFIG[request.status]?.pulse ?? false"
              >
                {{ STATUS_CONFIG[request.status]?.label || request.status }}
              </AppBadge>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
