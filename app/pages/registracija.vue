<script setup>
const turnstileToken = ref('');
const { t } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const auth = useAuthStore();

definePageMeta({ layout: false });

const username = ref('');
const email = ref('');
const password = ref('');
const country = ref('');
const googleError = ref('');

function onGoogle() {
  navigateTo(localePath(route.query.redirect || '/'));
}

async function submit() {
  if (await auth.register(email.value, password.value, username.value, turnstileToken.value, country.value)) {
    await navigateTo(localePath('/'));
  }
}

useSeoMeta({ title: () => `${t('meta.registerTitle')} | Octava`, robots: 'noindex, nofollow' });
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
    <div class="relative z-10 w-full max-w-[440px] rounded-3xl border border-line bg-panel/95 p-6 sm:p-8 backdrop-blur-md shadow-2xl ring-1 ring-white/10 space-y-6">
      
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
            {{ $t('auth.createAccount') }}
          </h1>
          <p class="mt-1 text-xs sm:text-sm text-muted leading-relaxed">
            Kreirajte besplatan račun za čuvanje pjesama i personalizovane postavke.
          </p>
        </div>
      </div>

      <!-- Registration Form -->
      <form class="space-y-4" @submit.prevent="submit">
        <!-- Username Field -->
        <div>
          <label for="username" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            {{ $t('auth.username') }}
          </label>
          <input
            id="username"
            v-model="username"
            required
            autocomplete="nickname"
            autofocus
            placeholder="Vaše ime ili nadimak"
            class="input-base"
          />
        </div>

        <!-- Email Field -->
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
            inputmode="email"
            placeholder="ime@email.com"
            class="input-base"
          />
        </div>

        <!-- Country Field (Optional) -->
        <div>
          <label for="country" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            {{ $t('auth.country') }}
            <span class="ml-1 font-normal text-faint normal-case">({{ $t('auth.optional') }})</span>
          </label>
          <CountrySelect id="country" v-model="country" />
        </div>

        <!-- Password Field -->
        <div>
          <PasswordField
            id="password"
            v-model="password"
            autocomplete="new-password"
            :minlength="8"
            show-strength
          />
          <p class="mt-1 text-xs text-faint">{{ $t('auth.minChars') }}</p>
        </div>

        <!-- Error Feedback Message -->
        <div
          v-if="auth.error"
          role="alert"
          class="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-xs font-medium text-danger"
        >
          <Icon name="material-symbols:error-rounded" class="text-base shrink-0" />
          <span>{{ auth.error }}</span>
        </div>

        <TurnstileWidget v-model="turnstileToken" />

        <!-- Primary Submit Button -->
        <AppButton
          type="submit"
          variant="primary"
          :loading="auth.loading"
          :disabled="auth.loading"
          block
          size="md"
          class="w-full mt-2"
        >
          {{ auth.loading ? 'Kreiranje…' : $t('auth.register') }}
        </AppButton>
      </form>

      <!-- Google / Alternative Sign-in Separator -->
      <div class="space-y-3">
        <div class="flex items-center gap-3 text-xs text-faint">
          <span class="h-px flex-1 bg-line" />
          <span class="font-mono text-[11px] uppercase tracking-wider">{{ $t('auth.or') }}</span>
          <span class="h-px flex-1 bg-line" />
        </div>

        <div class="flex flex-col items-center justify-center">
          <GoogleSignIn @signed-in="onGoogle" @failed="googleError = $t('auth.googleFailed')" />
          <p v-if="googleError" class="mt-2 text-xs text-danger font-medium">{{ googleError }}</p>
        </div>
      </div>

      <!-- Card Footer: Link to Login -->
      <div class="border-t border-line-soft pt-4 text-center text-xs text-muted">
        <span>{{ $t('auth.haveAccount') }} </span>
        <NuxtLink
          :to="localePath('/prijava')"
          class="font-bold text-accent hover:underline hover:text-accent/90 transition-colors"
        >
          {{ $t('auth.signIn') }}
        </NuxtLink>
      </div>
    </div>

    <!-- Micro bottom footer -->
    <div class="mt-6 text-center text-[11px] text-faint select-none">
      <span>Octava · Akordi i muzički studio</span>
    </div>
  </div>
</template>
