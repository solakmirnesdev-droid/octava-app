<script setup>
import { toWebp } from '~/utils/toWebp';
import { countryName } from '~/utils/countries';

/**
 * The reader's own account settings.
 *
 * 2-column responsive dashboard for 2026 aesthetics:
 * - Left column: Identity (Avatar, Username, Country)
 * - Right column: Security (Email address, Password change)
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
    say(t('profile.passwordSaved'));
  }
}

useSeoMeta({ title: t('meta.profileTitle'), robots: 'noindex, nofollow' });
</script>

<template>
  <div v-if="auth.user" class="mx-auto max-w-6xl space-y-6">
    <!-- Page Header & Status alerts -->
    <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-ink">{{ $t('profile.title') }}</h1>
        <p class="text-xs sm:text-sm text-muted mt-1">Upravljaj svojim korisničkim računom, postavkama i sigurnošću.</p>
      </div>

      <!-- Quick user chip on top right -->
      <div class="inline-flex items-center gap-2 rounded-2xl border border-line bg-panel/80 px-3.5 py-1.5 text-xs text-muted shadow-2xs">
        <span class="size-2 rounded-full bg-ok animate-pulse" />
        <span>Prijavljen kao <strong class="font-mono text-ink">{{ auth.user.username }}</strong></span>
      </div>
    </header>

    <!-- Feedback alerts with smooth transitions -->
    <div v-if="done" role="status" class="flex items-center gap-2 rounded-xl border border-ok/30 bg-ok-soft px-4 py-3 text-sm text-ok shadow-2xs">
      <Icon name="material-symbols:check-circle-rounded" class="text-base shrink-0" />
      <span>{{ done }}</span>
    </div>

    <div v-if="auth.error" role="alert" class="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger shadow-2xs">
      <Icon name="material-symbols:error-rounded" class="text-base shrink-0" />
      <span>{{ auth.error }}</span>
    </div>

    <!-- 2-Column Responsive Dashboard -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- LEFT COLUMN: Identity, Avatar & Profile Info (5 cols) -->
      <div class="lg:col-span-5 space-y-6">
        
        <!-- Photo & Avatar Card -->
        <section class="rounded-2xl border border-line bg-gradient-to-b from-panel/95 via-panel/80 to-surface/90 p-5 sm:p-6 backdrop-blur-md shadow-xs">
          <div class="flex items-center gap-2 mb-4">
            <Icon name="material-symbols:account-circle-outline-rounded" class="text-accent text-lg" />
            <h2 class="text-xs font-semibold uppercase tracking-wider text-faint">{{ $t('profile.photo') }}</h2>
          </div>

          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <UserAvatar
              :key="version"
              :name="auth.user.username"
              :user-id="auth.user.id"
              :has-avatar="auth.user.hasAvatar"
              :flag="auth.user.flag || ''"
              size="lg"
            />

            <div class="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs transition-all hover:border-accent hover:text-accent disabled:opacity-40"
                  :disabled="busyAvatar"
                  @click="fileInput?.click()"
                >
                  <Icon name="material-symbols:upload-rounded" class="text-sm" />
                  <span>{{ busyAvatar ? $t('common.loading') : $t('profile.choosePhoto') }}</span>
                </button>

                <button
                  v-if="auth.user.hasAvatar"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-muted shadow-2xs transition-all hover:border-danger hover:text-danger disabled:opacity-40"
                  :disabled="busyAvatar"
                  @click="removeAvatar"
                >
                  <Icon name="material-symbols:delete-outline-rounded" class="text-sm" />
                  <span>{{ $t('profile.removePhoto') }}</span>
                </button>
              </div>

              <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="pickAvatar">
              <p class="text-xs text-faint leading-relaxed">{{ $t('profile.photoHint') }}</p>
              <p v-if="avatarError" class="text-xs text-danger font-medium">{{ avatarError }}</p>
            </div>
          </div>
        </section>

        <!-- Account Details Card (Username & Country) -->
        <section class="rounded-2xl border border-line bg-gradient-to-b from-panel/95 via-panel/80 to-surface/90 p-5 sm:p-6 backdrop-blur-md shadow-xs">
          <div class="flex items-center gap-2 mb-4">
            <Icon name="material-symbols:badge-outline-rounded" class="text-accent text-lg" />
            <h2 class="text-xs font-semibold uppercase tracking-wider text-faint">{{ $t('profile.details') }}</h2>
          </div>

          <div class="space-y-4">
            <div>
              <label for="username" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-faint">
                {{ $t('auth.username') }}
              </label>
              <input
                id="username"
                v-model="username"
                type="text"
                maxlength="40"
                class="w-full rounded-xl border border-line bg-surface/90 px-3.5 py-2.5 text-base sm:text-sm text-ink outline-none transition-all focus:border-accent focus:bg-panel focus:ring-2 focus:ring-accent/15"
              >
            </div>

            <div>
              <label for="country" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-faint">
                {{ $t('auth.country') }}
              </label>
              <CountrySelect id="country" v-model="country" />
              <p v-if="country" class="mt-1.5 text-xs text-faint">
                {{ $t('profile.shownAs') }} {{ auth.user.flag }} {{ countryName(country, locale) }}
              </p>
            </div>

            <button
              type="button"
              class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-on-accent shadow-xs transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="auth.loading || !profileChanged"
              @click="saveProfile"
            >
              <Icon name="material-symbols:check-rounded" class="text-base" />
              <span>{{ $t('common.save') }}</span>
            </button>
          </div>
        </section>

      </div>

      <!-- RIGHT COLUMN: Security, Email & Password (7 cols) -->
      <div class="lg:col-span-7 space-y-6">

        <!-- Email Address Section -->
        <section class="rounded-2xl border border-line bg-gradient-to-b from-panel/95 via-panel/80 to-surface/90 p-5 sm:p-6 backdrop-blur-md shadow-xs">
          <div class="flex items-center justify-between gap-2 mb-4">
            <div class="flex items-center gap-2">
              <Icon name="material-symbols:mail-outline-rounded" class="text-accent text-lg" />
              <h2 class="text-xs font-semibold uppercase tracking-wider text-faint">{{ $t('profile.email') }}</h2>
            </div>

            <!-- Current Email verification status chip -->
            <span
              v-if="auth.user.emailVerified"
              class="inline-flex items-center gap-1 rounded-full border border-ok/30 bg-ok-soft px-2.5 py-0.5 text-[11px] font-bold text-ok"
            >
              <Icon name="material-symbols:check-circle-rounded" class="text-xs" />
              <span>Potvrđen</span>
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 rounded-full border border-warn/30 bg-warn-soft px-2.5 py-0.5 text-[11px] font-bold text-warn"
            >
              <Icon name="material-symbols:warning-rounded" class="text-xs" />
              <span>{{ $t('profile.unverified') }}</span>
            </span>
          </div>

          <p class="text-xs text-muted mb-4 font-mono bg-surface/60 rounded-lg p-2 border border-line-soft">
            Trenutna adresa: <strong class="text-ink">{{ auth.user.email }}</strong>
          </p>

          <div class="space-y-4">
            <div>
              <label for="new-email" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-faint">
                {{ $t('profile.newEmail') }}
              </label>
              <input
                id="new-email"
                v-model="email.next"
                type="email"
                autocomplete="email"
                placeholder="nova.adresa@primjer.com"
                class="w-full rounded-xl border border-line bg-surface/90 px-3.5 py-2.5 text-base sm:text-sm text-ink outline-none transition-all focus:border-accent focus:bg-panel focus:ring-2 focus:ring-accent/15 placeholder:text-dim"
              >
            </div>

            <div>
              <label for="email-password" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-faint">
                {{ $t('profile.confirmPassword') }}
              </label>
              <input
                id="email-password"
                v-model="email.password"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full rounded-xl border border-line bg-surface/90 px-3.5 py-2.5 text-base sm:text-sm text-ink outline-none transition-all focus:border-accent focus:bg-panel focus:ring-2 focus:ring-accent/15 placeholder:text-dim"
              >
              <p class="mt-1 text-xs text-faint">{{ $t('profile.whyPassword') }}</p>
            </div>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-on-accent shadow-xs transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="auth.loading || !email.next || !email.password"
              @click="saveEmail"
            >
              <Icon name="material-symbols:mail-rounded" class="text-base" />
              <span>{{ $t('profile.changeEmail') }}</span>
            </button>
          </div>
        </section>

        <!-- Password Change Section -->
        <section class="rounded-2xl border border-line bg-gradient-to-b from-panel/95 via-panel/80 to-surface/90 p-5 sm:p-6 backdrop-blur-md shadow-xs">
          <div class="flex items-center gap-2 mb-4">
            <Icon name="material-symbols:lock-outline-rounded" class="text-accent text-lg" />
            <h2 class="text-xs font-semibold uppercase tracking-wider text-faint">{{ $t('profile.password') }}</h2>
          </div>

          <div class="space-y-4">
            <div>
              <label for="current-password" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-faint">
                {{ $t('profile.currentPassword') }}
              </label>
              <input
                id="current-password"
                v-model="pass.current"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full rounded-xl border border-line bg-surface/90 px-3.5 py-2.5 text-base sm:text-sm text-ink outline-none transition-all focus:border-accent focus:bg-panel focus:ring-2 focus:ring-accent/15 placeholder:text-dim"
              >
            </div>

            <div>
              <label for="new-password" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-faint">
                Nova lozinka
              </label>
              <PasswordField id="new-password" v-model="pass.next" autocomplete="new-password" :minlength="8" show-strength />
            </div>

            <div>
              <label for="repeat-password" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-faint">
                {{ $t('profile.repeatPassword') }}
              </label>
              <input
                id="repeat-password"
                v-model="pass.repeat"
                type="password"
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full rounded-xl border border-line bg-surface/90 px-3.5 py-2.5 text-base sm:text-sm text-ink outline-none transition-all focus:border-accent focus:bg-panel focus:ring-2 focus:ring-accent/15 placeholder:text-dim"
              >
              <p v-if="passwordMismatch" class="mt-1 text-xs text-danger font-medium">{{ $t('profile.mismatch') }}</p>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-on-accent shadow-xs transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="auth.loading || !pass.next || passwordMismatch"
                @click="savePassword"
              >
                <Icon name="material-symbols:key-rounded" class="text-base" />
                <span>{{ $t('profile.changePassword') }}</span>
              </button>

              <NuxtLink
                :to="localePath('/zaboravljena-lozinka')"
                class="text-xs font-medium text-muted hover:text-accent transition-colors"
              >
                {{ $t('profile.forgotHint') }} {{ $t('auth.forgot') }}
              </NuxtLink>
            </div>
          </div>
        </section>

      </div>

    </div>
  </div>
</template>
