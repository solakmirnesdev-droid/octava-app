<script setup>
/**
 * Signing out, with a dialog that says what it is about to do.
 *
 * AI-DECISION: two earlier attempts were wrong. A bare button signed people out
 * with no visible change beyond the header losing two links, which reads as a
 * page reload — several people were not sure it had worked. Replacing it with a
 * button that arms on the first click and fires on the second was worse: it is
 * a control that does something different depending on how recently you touched
 * it, and nothing on screen explains the rule.
 *
 * A dialog is the ordinary answer. It names the account, so you can see whose
 * session is ending, and the notice afterwards confirms it happened.
 * See AI-NOTES.md §5.
 */
defineProps({
  block: { type: Boolean, default: false }
});

const auth = useAuthStore();
const { t } = useI18n();

const asking = ref(false);
const busy = ref(false);

async function signOut() {
  busy.value = true;
  try {
    await auth.logout(t('nav.loggedOut'));
  } finally {
    busy.value = false;
    asking.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    class="flex shrink-0 items-center gap-1.5 rounded text-body hover:bg-raised hover:text-accent"
    :class="block ? 'w-full px-2 py-2.5 text-left' : 'px-2 py-1.5'"
    :title="$t('nav.logout')"
    @click="asking = true"
  >
    <Icon name="material-symbols:logout-rounded" :class="block ? 'text-lg' : ''" />
    <span>{{ $t('nav.logout') }}</span>
  </button>

  <AppModal
    v-model="asking"
    :title="$t('nav.logoutTitle')"
    :description="$t('nav.logoutBody', { name: auth.user?.username || '' })"
    :confirm-label="$t('nav.logout')"
    :cancel-label="$t('common.cancel')"
    :busy="busy"
    @confirm="signOut"
  />
</template>
