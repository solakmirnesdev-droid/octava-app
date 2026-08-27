<script setup>
/**
 * "These chords are wrong."
 *
 * Kept small and behind a dialog: the person who needs it is a minority of
 * readers, and putting a form for it on the page would sit between everyone
 * else and the chords.
 *
 * The category matters more than the note. Most people will not write one, and
 * "wrong chords on this song" is already enough for an editor to go and look.
 */
const props = defineProps({
  slug: { type: String, required: true },
  arrangementId: { type: String, default: null }
});

const { $api } = useNuxtApp();
const auth = useAuthStore();
const localePath = useLocalePath();
const route = useRoute();
const { t } = useI18n();

const KINDS = ['chords', 'lyrics', 'key', 'duplicate', 'other'];
const labelFor = (k) => `song.kind${k.charAt(0).toUpperCase()}${k.slice(1)}`;

const open = ref(false);
const kind = ref('chords');
const note = ref('');
const sending = ref(false);
const done = ref(false);
const error = ref('');

function start() {
  open.value = true;
  kind.value = 'chords';
  note.value = '';
  done.value = false;
  error.value = '';
}

const canSend = computed(() =>
  !sending.value && (kind.value !== 'other' || note.value.trim().length > 0)
);

async function send() {
  if (!canSend.value) return;
  sending.value = true;
  error.value = '';
  try {
    await $api(`/songs/${props.slug}/report`, {
      method: 'POST',
      body: {
        kind: kind.value,
        note: note.value.trim(),
        ...(props.arrangementId ? { arrangementId: props.arrangementId } : {})
      }
    });
    done.value = true;
  } catch (err) {
    const status = err?.statusCode || err?.data?.statusCode || err?.response?.status;
    error.value = status === 409 ? t('song.reportDuplicate') : t('song.reportFailed');
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div>
    <button
      v-if="auth.isAuthenticated"
      class="py-3.5 -my-3.5 text-xs text-faint hover:text-accent"
      @click="start"
    >{{ $t('song.reportButton') }}</button>

    <NuxtLink
      v-else
      :to="localePath({ path: '/prijava', query: { redirect: route.fullPath } })"
      class="text-xs text-faint hover:text-accent"
    >{{ $t('song.reportSignIn') }}</NuxtLink>

    <div
      v-if="open"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
      @click.self="open = false"
    >
      <div class="w-full max-w-sm rounded-lg bg-panel p-5 shadow-xl">
        <template v-if="!done">
          <h2 class="text-sm font-semibold">{{ $t('song.reportTitle') }}</h2>

          <div class="mt-3 space-y-1.5">
            <label
              v-for="k in KINDS" :key="k"
              class="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-raised"
            >
              <input v-model="kind" type="radio" :value="k" name="report-kind" class="accent-accent">
              <span>{{ $t(labelFor(k)) }}</span>
            </label>
          </div>

          <label class="mt-3 block">
            <span class="text-xs font-medium text-muted">
              {{ $t('song.reportNote') }}
              <span v-if="kind !== 'other'" class="font-normal text-faint">{{ $t('page.optional') }}</span>
            </span>
            <textarea
              v-model="note" rows="3" maxlength="1000"
              class="mt-1 w-full rounded border border-line-strong px-3 py-2 text-sm outline-none focus:border-accent"
              :placeholder="$t('song.reportNoteHint')"
            />
          </label>

          <p v-if="error" class="mt-2 text-sm text-rose-700">{{ error }}</p>

          <div class="mt-4 flex justify-end gap-2 text-sm">
            <button class="rounded px-3 py-1.5 text-muted hover:text-accent" @click="open = false">
              {{ $t('song.cancel') }}
            </button>
            <button
              class="rounded bg-accent px-3 py-1.5 text-on-accent disabled:opacity-40"
              :disabled="!canSend"
              @click="send"
            >{{ sending ? $t('song.reportSending') : $t('song.reportSend') }}</button>
          </div>
        </template>

        <template v-else>
          <p class="text-sm">{{ $t('song.reportThanks') }}</p>
          <div class="mt-4 flex justify-end">
            <button class="rounded bg-accent px-3 py-1.5 text-sm text-on-accent" @click="open = false">
              {{ $t('common.close') }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
