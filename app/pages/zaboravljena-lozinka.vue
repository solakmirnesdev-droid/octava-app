<script setup>
definePageMeta({ layout: false });

const { $api } = useNuxtApp();
const email = ref('');
const sending = ref(false);
const sent = ref(false);

async function submit() {
  sending.value = true;
  try {
    await $api('/auth/forgot', { method: 'POST', body: { email: email.value } });
  } catch {
    // The server answers the same either way; a network failure must not
    // become the one signal that distinguishes a real account from a missing
    // one, so the view says the same thing regardless.
  } finally {
    sending.value = false;
    sent.value = true;
  }
}

useSeoMeta({ title: 'Zaboravljena lozinka | Octava', robots: 'noindex, nofollow' });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface px-6 text-ink">
    <div class="w-full max-w-sm">
      <NuxtLink to="/" class="text-2xl font-semibold tracking-tight">Octava</NuxtLink>

      <template v-if="!sent">
        <p class="mt-1 mb-8 text-sm text-black/50">
          Upiši email i poslat ćemo ti link za novu lozinku.
        </p>

        <form @submit.prevent="submit">
          <label for="email" class="mb-1 block text-sm font-medium">Email</label>
          <input
            id="email" v-model="email" type="email" required autocomplete="username"
            autofocus inputmode="email"
            class="mb-6 w-full rounded border border-black/15 bg-white px-3 py-2 outline-none focus:border-accent"
          />

          <button
            type="submit" :disabled="sending"
            class="w-full rounded bg-ink py-2.5 font-medium text-white hover:bg-accent disabled:opacity-50"
          >
            {{ sending ? 'Šaljem…' : 'Pošalji link' }}
          </button>
        </form>
      </template>

      <div v-else class="mt-6 rounded border border-black/10 bg-white p-5">
        <p class="text-sm text-black/70">
          Ako nalog postoji, link je poslan na <strong>{{ email }}</strong>.
        </p>
        <p class="mt-2 text-xs text-black/45">
          Link vrijedi 60 minuta. Provjeri i neželjenu poštu.
        </p>
      </div>

      <p class="mt-6 text-center text-sm text-black/50">
        <NuxtLink to="/prijava" class="text-accent hover:underline">Nazad na prijavu</NuxtLink>
      </p>
    </div>
  </div>
</template>
