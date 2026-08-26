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

useSeoMeta({ title: t('meta.newPassTitle'), robots: 'noindex, nofollow' });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface px-6 text-ink">
    <div class="w-full max-w-sm">
      <NuxtLink :to="localePath('/')" class="text-2xl font-semibold tracking-tight">Octava</NuxtLink>

      <p v-if="!token" class="mt-6 rounded bg-accent/10 px-4 py-3 text-sm text-accent">
        {{ $t('auth.linkIncomplete') }}
      </p>

      <template v-else-if="!done">
        <p class="mt-1 mb-8 text-sm text-black/50">{{ $t('auth.setNewPassword') }}</p>

        <form @submit.prevent="submit">
          <PasswordField
            id="password" v-model="password"
            label="Nova lozinka" autocomplete="new-password" :minlength="8" show-strength
          />
          <p class="mt-1 text-xs text-black/40">{{ $t('auth.minChars') }}</p>

          <p v-if="error" role="alert" class="mt-4 rounded bg-accent/10 px-3 py-2 text-sm text-accent">
            {{ error }}
          </p>

          <button
            type="submit" :disabled="saving"
            class="mt-6 w-full rounded bg-ink py-2.5 font-medium text-white hover:bg-accent disabled:opacity-50"
          >
            {{ saving ? 'Spašavanje…' : 'Postavi lozinku' }}
          </button>
        </form>
      </template>

      <div v-else class="mt-6 rounded border border-green-600/30 bg-green-50 p-5">
        <p class="text-sm text-green-900">{{ $t('auth.passwordChanged') }}</p>
        <!-- Every session issued before this moment is now refused, so signing
             in again is genuinely required rather than a formality. -->
        <p class="mt-1 text-xs text-green-900/70">{{ $t('auth.signInWithNew') }}</p>
        <NuxtLink :to="localePath('/prijava')" class="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          {{ $t('auth.goToSignIn') }}
        </NuxtLink>
      </div>

      <p v-if="!done" class="mt-6 text-center text-sm text-black/50">
        <NuxtLink :to="localePath('/prijava')" class="text-accent hover:underline">{{ $t('auth.backToSignIn') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
