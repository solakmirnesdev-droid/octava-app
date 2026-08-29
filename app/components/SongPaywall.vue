<script setup>
/**
 * Where the chord sheet stops for somebody who has not subscribed.
 *
 * AI-DECISION: this grows out of the sheet rather than covering it. A dialog
 * over the page says "you are not allowed"; a fade out of the last chords the
 * reader can see says "there is more of this", which is the same fact told from
 * the side of the person reading. The preview above it is real content, cut on
 * the server — nothing here is hiding text the browser already has.
 */
const props = defineProps({
  /** 'login_required' or 'subscription_required' — a different ask each. */
  reason: { type: String, default: 'subscription_required' }
});

const localePath = useLocalePath();
const { $api } = useNuxtApp();

const plans = ref([]);
onMounted(async () => {
  try {
    plans.value = (await $api('/plans')).plans || [];
  } catch {
    // The offer still stands; only the numbers are missing.
  }
});

const cheapest = computed(() =>
  [...plans.value].sort((a, b) => a.price / a.days - b.price / b.days)[0] || null);
</script>

<template>
  <!--
    No gradient fade here any more. It made sense while the sheet was cut off
    partway; now the words run to the end and only the chords are held back, so
    a fade would be pretending the text stops when it does not.
  -->
  <div class="mt-8">
    <div class="rounded-2xl border border-accent/25 bg-panel p-6 text-center shadow-lg sm:p-8">
      <p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        {{ $t('paywall.eyebrow') }}
      </p>

      <h2 class="mt-3 text-xl font-bold tracking-tight text-ink sm:text-2xl">
        {{ $t('paywall.title') }}
      </h2>

      <p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
        {{ $t('paywall.body') }}
      </p>

      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <NuxtLink
          :to="localePath('/pretplata')"
          class="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-xs transition-opacity hover:opacity-90"
        >
          {{ $t('paywall.cta') }}
        </NuxtLink>

        <!-- Somebody who already pays and is merely signed out needs the other
             door, not the price list. -->
        <NuxtLink
          v-if="reason === 'login_required'"
          :to="localePath('/prijava')"
          class="rounded-xl border border-line-strong px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
        >
          {{ $t('paywall.signIn') }}
        </NuxtLink>
      </div>

      <p v-if="cheapest" class="mt-4 font-mono text-xs text-faint">
        {{ $t('paywall.from', { price: cheapest.price, currency: cheapest.currency }) }}
      </p>
    </div>
  </div>
</template>
