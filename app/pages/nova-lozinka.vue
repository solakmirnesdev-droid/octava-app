<script setup>
const { t } = useI18n();
const localePath = useLocalePath();
definePageMeta({ layout: false });

const route = useRoute();
const { $api } = useNuxtApp();

const password = ref('');
const saving = ref(false);
const error = ref(null);
const done = ref(false);

const token = computed(() => route.query.token || '');
const realm = computed(() => (route.query.realm === 'staff' ? 'staff' : 'user'));

async function submit() {
  saving.value = true;
  error.value = null;
  try {
    await $api('/auth/reset', {
      method: 'POST',
      body: { token: token.value, password: password.value, realm: realm.value }
    });
    done.value = true;
  } catch (err) {
    error.value = err.data?.message || 'Promjena nije uspjela.';
  } finally {
    saving.value = false;
  }
}

useSeoMeta({ title: () => `${t('meta.newPassTitle')} | Octava`, robots: 'noindex, nofollow' });
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
            {{ $t('auth.setNewPassword') }}
          </h1>
          <p class="mt-1 text-xs sm:text-sm text-muted leading-relaxed">
            Unesite novu sigurnu lozinku za vaš Octava nalog.
          </p>
        </div>
      </div>

      <p v-if="!token" class="rounded-2xl border border-danger/30 bg-danger-soft p-4 text-xs sm:text-sm text-danger text-center">
        {{ $t('auth.linkIncomplete') }}
      </p>

      <template v-else-if="!done">
        <form class="space-y-4" @submit.prevent="submit">
          <div>
            <PasswordField
              id="password"
              v-model="password"
              label="Nova lozinka"
              autocomplete="new-password"
              :minlength="8"
              show-strength
            />
            <p class="mt-1 text-xs text-faint">{{ $t('auth.minChars') }}</p>
          </div>

          <div
            v-if="error"
            role="alert"
            class="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-xs font-medium text-danger"
          >
            <Icon name="material-symbols:error-rounded" class="text-base shrink-0" />
            <span>{{ error }}</span>
          </div>

          <AppButton
            type="submit"
            variant="primary"
            :loading="saving"
            :disabled="saving"
            block
            size="md"
            class="w-full mt-2"
          >
            {{ saving ? 'Spašavanje…' : 'Postavi lozinku' }}
          </AppButton>
        </form>
      </template>

      <div v-else class="rounded-2xl border border-ok/30 bg-ok-soft p-5 text-center space-y-3">
        <Icon name="material-symbols:check-circle-rounded" class="mx-auto text-3xl text-ok" />
        <div>
          <p class="text-sm font-bold text-ok">{{ $t('auth.passwordChanged') }}</p>
          <p class="mt-1 text-xs text-ok/80">{{ $t('auth.signInWithNew') }}</p>
        </div>
        <NuxtLink
          :to="localePath('/prijava')"
          class="inline-block rounded-xl bg-accent px-4 py-2 text-xs font-bold text-on-accent shadow-xs hover:opacity-95 transition"
        >
          {{ $t('auth.goToSignIn') }}
        </NuxtLink>
      </div>

      <!-- Card Footer: Link to Login -->
      <div v-if="!done" class="border-t border-line-soft pt-4 text-center text-xs text-muted">
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
