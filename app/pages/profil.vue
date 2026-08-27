<script setup>
import { toWebp } from '~/utils/toWebp';
import { countryName } from '~/utils/countries';

/**
 * The reader's own account.
 *
 * Three separate forms rather than one: a display name is a preference, an
 * address and a password are credentials. Putting them in one Save button means
 * typing your password to correct a typo in your own name.
 */
const { t, locale } = useI18n();
const localePath = useLocalePath();
const auth = useAuthStore();
const { say } = useNotice();

definePageMeta({ middleware: 'auth' });

const username = ref('');
const country = ref('');
const fileInput = ref(null);
const busyAvatar = ref(false);
const avatarError = ref('');

// Bumped after an upload so the browser fetches the new portrait rather than
// the one it already has cached under the same URL.
const version = ref(Date.now());

const email = ref({ next: '', password: '' });
const pass = ref({ current: '', next: '', repeat: '' });
const done = ref('');

watchEffect(() => {
  if (!auth.user) return;
  username.value = auth.user.username || '';
  country.value = auth.user.country || '';
});

const profileChanged = computed(() =>
  auth.user && (username.value !== (auth.user.username || '') || country.value !== (auth.user.country || '')));

async function saveProfile() {
  done.value = '';
  if (await auth.updateProfile({ username: username.value, country: country.value })) {
    done.value = t('profile.saved');
  }
}

async function pickAvatar(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  avatarError.value = '';
  busyAvatar.value = true;
  try {
    const blob = await toWebp(file);
    if (await auth.uploadAvatar(blob)) {
      version.value = Date.now();
      done.value = t('profile.avatarSaved');
    } else {
      avatarError.value = auth.error;
    }
  } catch (err) {
    avatarError.value = err.message;
  } finally {
    busyAvatar.value = false;
  }
}

async function removeAvatar() {
  busyAvatar.value = true;
  if (await auth.deleteAvatar()) version.value = Date.now();
  busyAvatar.value = false;
}

async function saveEmail() {
  done.value = '';
  if (await auth.changeEmail(email.value.next, email.value.password)) {
    email.value = { next: '', password: '' };
    done.value = t('profile.emailSaved');
  }
}

const passwordMismatch = computed(() =>
  pass.value.repeat.length > 0 && pass.value.next !== pass.value.repeat);

async function savePassword() {
  done.value = '';
  if (passwordMismatch.value) return;
  if (await auth.changePassword(pass.value.current, pass.value.next)) {
    pass.value = { current: '', next: '', repeat: '' };
    // Every other session was just ejected, which is the point of the change
    // and worth saying out loud.
    say(t('profile.passwordSaved'));
  }
}

useSeoMeta({ title: t('meta.profileTitle'), robots: 'noindex, nofollow' });

const field = 'w-full rounded border border-line-strong bg-panel px-3 py-2 outline-none focus:border-accent';
const card = 'rounded-lg border border-line bg-panel p-5';
</script>

<template>
  <div v-if="auth.user" class="mx-auto max-w-xl">
    <h1 class="mb-6 text-2xl font-semibold tracking-tight">{{ $t('profile.title') }}</h1>

    <p v-if="done" role="status" class="mb-4 rounded bg-ok-soft px-3 py-2 text-sm text-ok">{{ done }}</p>
    <p v-if="auth.error" role="alert" class="mb-4 rounded bg-danger-soft px-3 py-2 text-sm text-danger">
      {{ auth.error }}
    </p>

    <!-- Portrait -------------------------------------------------------- -->
    <section :class="card" class="mb-4">
      <h2 class="mb-4 text-sm font-medium">{{ $t('profile.photo') }}</h2>

      <div class="flex items-center gap-5">
        <UserAvatar
          :key="version"
          :name="auth.user.username" :user-id="auth.user.id"
          :has-avatar="auth.user.hasAvatar" :flag="auth.user.flag || ''" size="lg"
        />

        <div class="min-w-0">
          <div class="flex flex-wrap gap-2">
            <button
              class="rounded border border-line-strong px-3 py-1.5 text-sm hover:border-accent hover:text-accent disabled:opacity-40"
              :disabled="busyAvatar" @click="fileInput?.click()"
            >{{ busyAvatar ? $t('common.loading') : $t('profile.choosePhoto') }}</button>

            <button
              v-if="auth.user.hasAvatar"
              class="rounded border border-line-strong px-3 py-1.5 text-sm text-muted hover:border-danger hover:text-danger disabled:opacity-40"
              :disabled="busyAvatar" @click="removeAvatar"
            >{{ $t('profile.removePhoto') }}</button>
          </div>

          <!-- The conversion happens here, so nothing about formats or sizes
               needs to reach the reader as a rule to follow. -->
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="pickAvatar">
          <p class="mt-2 text-xs text-faint">{{ $t('profile.photoHint') }}</p>
          <p v-if="avatarError" class="mt-1 text-xs text-danger">{{ avatarError }}</p>
        </div>
      </div>
    </section>

    <!-- Name and country ------------------------------------------------ -->
    <section :class="card" class="mb-4">
      <h2 class="mb-4 text-sm font-medium">{{ $t('profile.details') }}</h2>

      <label for="username" class="mb-1 block text-sm">{{ $t('auth.username') }}</label>
      <input id="username" v-model="username" :class="field" class="mb-4" maxlength="40">

      <label for="country" class="mb-1 block text-sm">{{ $t('auth.country') }}</label>
      <CountrySelect id="country" v-model="country" />
      <p v-if="country" class="mt-1.5 text-xs text-faint">
        {{ $t('profile.shownAs') }} {{ auth.user.flag }} {{ countryName(country, locale) }}
      </p>

      <button
        class="mt-4 rounded bg-ink px-4 py-2 text-sm font-medium text-on-ink hover:bg-accent disabled:opacity-40"
        :disabled="auth.loading || !profileChanged" @click="saveProfile"
      >{{ $t('common.save') }}</button>
    </section>

    <!-- Address --------------------------------------------------------- -->
    <section :class="card" class="mb-4">
      <h2 class="text-sm font-medium">{{ $t('profile.email') }}</h2>
      <p class="mb-4 mt-1 text-sm text-muted">
        {{ auth.user.email }}
        <span v-if="!auth.user.emailVerified" class="ml-1 rounded bg-warn-soft px-1.5 py-0.5 text-xs text-warn">
          {{ $t('profile.unverified') }}
        </span>
      </p>

      <label for="new-email" class="mb-1 block text-sm">{{ $t('profile.newEmail') }}</label>
      <input id="new-email" v-model="email.next" type="email" autocomplete="email" :class="field" class="mb-4">

      <label for="email-password" class="mb-1 block text-sm">{{ $t('profile.confirmPassword') }}</label>
      <input id="email-password" v-model="email.password" type="password" autocomplete="current-password" :class="field">
      <!-- Asked for even though they are signed in: an unattended browser is the
           ordinary case, and an address swapped without one is an account taken
           over quietly. -->
      <p class="mt-1 text-xs text-faint">{{ $t('profile.whyPassword') }}</p>

      <button
        class="mt-4 rounded bg-ink px-4 py-2 text-sm font-medium text-on-ink hover:bg-accent disabled:opacity-40"
        :disabled="auth.loading || !email.next || !email.password" @click="saveEmail"
      >{{ $t('profile.changeEmail') }}</button>
    </section>

    <!-- Password -------------------------------------------------------- -->
    <section :class="card">
      <h2 class="mb-4 text-sm font-medium">{{ $t('profile.password') }}</h2>

      <label for="current-password" class="mb-1 block text-sm">{{ $t('profile.currentPassword') }}</label>
      <input id="current-password" v-model="pass.current" type="password" autocomplete="current-password" :class="field" class="mb-4">

      <PasswordField id="new-password" v-model="pass.next" autocomplete="new-password" :minlength="8" show-strength />

      <label for="repeat-password" class="mb-1 mt-4 block text-sm">{{ $t('profile.repeatPassword') }}</label>
      <input id="repeat-password" v-model="pass.repeat" type="password" autocomplete="new-password" :class="field">
      <p v-if="passwordMismatch" class="mt-1 text-xs text-danger">{{ $t('profile.mismatch') }}</p>

      <button
        class="mt-4 rounded bg-ink px-4 py-2 text-sm font-medium text-on-ink hover:bg-accent disabled:opacity-40"
        :disabled="auth.loading || !pass.next || passwordMismatch" @click="savePassword"
      >{{ $t('profile.changePassword') }}</button>

      <p class="mt-4 text-xs text-faint">
        {{ $t('profile.forgotHint') }}
        <NuxtLink :to="localePath('/zaboravljena-lozinka')" class="text-accent hover:underline">
          {{ $t('auth.forgot') }}
        </NuxtLink>
      </p>
    </section>
  </div>
</template>
