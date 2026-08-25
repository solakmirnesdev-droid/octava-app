<script setup>
const { $api } = useNuxtApp();
const auth = useAuthStore();

const form = ref({ title: '', artist: '', note: '' });
const sending = ref(false);
const feedback = ref(null);

const { data, refresh } = await useAsyncData('requests', () =>
  $api('/requests', { params: { limit: 30 } }).catch(() => ({ requests: [] }))
);

async function submit() {
  if (!form.value.title.trim() || !form.value.artist.trim()) return;

  sending.value = true;
  feedback.value = null;
  try {
    const result = await $api('/requests', { method: 'POST', body: form.value });
    feedback.value = result.alreadyRequested
      ? { tone: 'info', text: 'Neko je već tražio ovu pjesmu — dodali smo tvoj glas.' }
      : { tone: 'ok', text: 'Zahtjev je zabilježen. Hvala!' };
    form.value = { title: '', artist: '', note: '' };
    await refresh();
  } catch (err) {
    feedback.value = { tone: 'error', text: err.data?.message || 'Slanje nije uspjelo.' };
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

const STATUS = {
  open: { label: 'čeka', cls: 'bg-black/5 text-black/50' },
  in_progress: { label: 'u radu', cls: 'bg-amber-100 text-amber-800' },
  done: { label: 'gotovo', cls: 'bg-green-100 text-green-800' }
};

useSeoMeta({
  title: 'Zatraži akorde | Octava',
  description: 'Nema pjesme koju tražiš? Pošalji zahtjev i glasaj za pjesme koje drugi traže.'
});
// Canonical and hreflang come from useLocaleHead in app.vue. A hard-coded
// canonical here pointed every English page at its Bosnian counterpart,
// which tells a search engine to index that one instead.
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">Zatraži akorde</h1>
      <p class="mt-2 text-black/60">
        Nema pjesme koju tražiš? Javi nam. Pjesme sa najviše glasova obrađujemo prve.
      </p>
    </header>

    <form class="mb-10 rounded-lg border border-black/10 bg-white p-4" @submit.prevent="submit">
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">Izvođač</span>
          <input
            v-model="form.artist" required maxlength="120"
            class="mt-1 w-full rounded border border-black/15 px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">Naslov</span>
          <input
            v-model="form.title" required maxlength="200"
            class="mt-1 w-full rounded border border-black/15 px-3 py-2 outline-none focus:border-accent"
          />
        </label>
      </div>

      <label class="mt-3 block">
        <span class="text-sm font-medium">Napomena <span class="font-normal text-black/40">(nije obavezno)</span></span>
        <input
          v-model="form.note" maxlength="500" placeholder="npr. verzija uživo, ili tonalitet koji ti treba"
          class="mt-1 w-full rounded border border-black/15 px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <div class="mt-4 flex items-center gap-3">
        <button
          type="submit" :disabled="sending"
          class="rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-accent disabled:opacity-50"
        >
          {{ sending ? 'Šaljem…' : 'Pošalji zahtjev' }}
        </button>

        <p
          v-if="feedback" role="status"
          class="text-sm"
          :class="{
            'text-green-700': feedback.tone === 'ok',
            'text-black/60': feedback.tone === 'info',
            'text-accent': feedback.tone === 'error'
          }"
        >{{ feedback.text }}</p>
      </div>
    </form>

    <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-black/40">
      Najtraženije
    </h2>

    <p v-if="!data?.requests?.length" class="text-sm text-black/50">
      Još nema zahtjeva. Budi prvi.
    </p>

    <ul v-else class="divide-y divide-black/5">
      <li v-for="request in data.requests" :key="request._id" class="flex items-center gap-3 py-3">
        <button
          class="flex w-12 shrink-0 flex-col items-center rounded border py-1 transition"
          :class="request.voted ? 'border-accent bg-accent/10 text-accent' : 'border-black/15 hover:border-accent'"
          :title="request.voted ? 'Povuci glas' : 'Glasaj'"
          @click="toggleVote(request)"
        >
          <span class="text-xs leading-none">▲</span>
          <span class="font-mono text-sm font-semibold leading-tight">{{ request.votes }}</span>
        </button>

        <div class="min-w-0 flex-1">
          <p class="truncate">
            <span class="font-medium">{{ request.title }}</span>
            <span class="ml-2 text-sm text-black/50">{{ request.artist }}</span>
          </p>
          <p v-if="request.note" class="truncate text-xs text-black/40">{{ request.note }}</p>
        </div>

        <NuxtLink
          v-if="request.fulfilledBy"
          :to="`/pjesma/${request.fulfilledBy.slug}`"
          class="shrink-0 text-sm text-accent hover:underline"
        >Otvori</NuxtLink>
        <span
          v-else
          class="shrink-0 rounded px-2 py-0.5 text-xs"
          :class="STATUS[request.status]?.cls"
        >{{ STATUS[request.status]?.label }}</span>
      </li>
    </ul>
  </div>
</template>
