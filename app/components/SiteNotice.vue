<script setup>
const { notice, clear } = useNotice();

// Cleared on the next navigation rather than on a timer: a message that
// vanishes while somebody is still reading it is worse than one that waits.
const route = useRoute();
watch(() => route.fullPath, (to, from) => {
  if (to !== from) clear();
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-200" leave-active-class="transition duration-150"
    enter-from-class="-translate-y-2 opacity-0" leave-to-class="-translate-y-2 opacity-0"
  >
    <div
      v-if="notice"
      role="status" aria-live="polite" data-print="hide"
      class="border-b px-5 py-2 text-sm"
      :class="notice.tone === 'ok'
        ? 'border-ok/25 bg-ok-soft text-ok'
        : 'border-line bg-raised text-body'"
    >
      <div class="mx-auto flex max-w-7xl items-center gap-3">
        <span>{{ notice.message }}</span>
        <button
          class="ml-auto -my-2 py-2 text-xs opacity-70 hover:opacity-100"
          :aria-label="$t('common.dismiss')"
          @click="clear"
        >✕</button>
      </div>
    </div>
  </Transition>
</template>
