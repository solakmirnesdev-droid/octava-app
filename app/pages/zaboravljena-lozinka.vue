<script setup>
const turnstileToken = ref('');
const { t } = useI18n();
const localePath = useLocalePath();
definePageMeta({ layout: false });

const { $api } = useNuxtApp();
const email = ref('');
const sending = ref(false);
const sent = ref(false);

async function submit() {
  sending.value = true;
  try {
    await $api('/auth/forgot', { method: 'POST', body: { email: email.value, turnstileToken: turnstileToken.value } });
  } catch {
    // The server answers the same either way; a network failure must not
    // become the one signal that distinguishes a real account from a missing
    // one, so the view says the same thing regardless.
  } finally {
    sending.value = false;
    sent.value = true;
  }
}

useSeoMeta({ title: () => `${t('meta.forgotTitle')} | Octava`, robots: 'noindex, nofollow' });
</script>

<template>
  <div class="relative min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 bg-surface text-ink overflow-hidden selection:bg-accent selection:text-on-accent">
    <!-- Soft Ambient Lights -->
    <div class="pointer-events-none absolute -top-32 -left-32 size-80 rounded-full bg-accent/8 blur-2xl" />
    <div class="pointer-events-none absolute -bottom-32 -right-32 size-80 rounded-full bg-accent/6 blur-2xl" />

    <!-- Center Octava Graphic-EQ Logo Watermark Behind Blur -->
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none" aria-hidden="true">
      <Icon
        name="material-symbols:graphic-eq-rounded"
        class="text-[360px] sm:text-[460px] text-accent/[0.045] transform -rotate-6 scale-105"
      />
    </div>

    <!-- Main Glassmorphic Auth Card -->
    <div class="relative z-10 w-full max-w-[420px] rounded-3xl border border-line bg-panel/95 p-6 sm:p-8 backdrop-blur-md shadow-2xl ring-1 ring-white/10 space-y-6">
      
      <!-- Top Octava Brand Header -->
      <div class="flex flex-col items-center text-center space-y-3">
        <NuxtLink
          :to="localePath('/')"
          class="group inline-flex items-center gap-3 outline-none"
        >
          <div class="flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-md shadow-accent/25 transition-transform duration-150 group-hover:scale-105">
            <Icon name="material-symbols:graphic-eq-rounded" class="text-2xl sm:text-3xl" />
          </div>
          <div class="text-left">
            <span class="block text-2xl sm:text-3xl font-black tracking-tight text-ink group-hover:text-accent transition-colors leading-none">
              Octava
            </span>
            <span class="block text-[10px] sm:text-[11px] font-semibold text-faint uppercase tracking-wider mt-1">
              Muzički Studio
            </span>
          </div>
        </NuxtLink>

        <div class="pt-2 border-t border-line-soft w-full">
          <h1 class="text-xl sm:text-2xl font-black tracking-tight text-ink">
            {{ $t('auth.forgot') }}
          </h1>
          <p class="mt-1 text-xs sm:text-sm text-muted leading-relaxed">
            {{ $t('auth.resetLead') }}
          </p>
        </div>
      </div>

      <template v-if="!sent">
        <form class="space-y-4" @submit.prevent="submit">
          <div>
            <label for="email" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              {{ $t('auth.email') }}
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="username"
              autofocus
              inputmode="email"
              placeholder="ime@email.com"
              class="input-base"
            />
          </div>

          <TurnstileWidget v-model="turnstileToken" />

          <AppButton
            type="submit"
            variant="primary"
            :loading="sending"
            :disabled="sending"
            block
            size="md"
            class="w-full mt-2"
          >
            {{ sending ? 'Šaljem…' : 'Pošalji link za oporavak' }}
          </AppButton>
        </form>
      </template>

      <div v-else class="rounded-2xl border border-ok/30 bg-ok-soft p-5 text-center space-y-2">
        <Icon name="material-symbols:check-circle-rounded" class="mx-auto text-3xl text-ok" />
        <i18n-t keypath="auth.resetSent" tag="p" class="text-xs sm:text-sm text-ink font-medium" scope="global">
          <template #email><strong>{{ email }}</strong></template>
        </i18n-t>
        <p class="text-xs text-muted">
          {{ $t('auth.resetValid') }}
        </p>
      </div>

      <!-- Card Footer: Link to Login -->
      <div class="border-t border-line-soft pt-4 text-center text-xs text-muted">
        <NuxtLink
          :to="localePath('/prijava')"
          class="inline-flex items-center gap-1.5 font-bold text-accent hover:underline transition-colors"
        >
          <Icon name="material-symbols:arrow-forward-rounded" class="rotate-180 text-xs" />
          <span>{{ $t('auth.backToSignIn') }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Micro bottom footer -->
    <div class="mt-6 text-center text-[11px] text-faint select-none">
      <span>Octava · Akordi i muzički studio</span>
    </div>
  </div>
</template>
