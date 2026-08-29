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
    AI-DECISION: This is a compact continuation of the chord sheet, not a
    hero-sized pricing panel. The interrupted reading context already explains
    the value; the card supplies one clear next step without creating a second
    focal point on a wide song page. See AI-NOTES.md §5 (2026-08-30).
  -->
  <section
    class="mx-auto mt-14 max-w-2xl sm:mt-16"
    aria-labelledby="song-paywall-title"
    data-print="hide"
  >
    <AppCard variant="glass" padding="none" class="overflow-hidden">
      <div class="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div class="flex min-w-0 items-start gap-3.5">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent-soft text-accent">
            <Icon name="material-symbols:lock-outline-rounded" class="text-xl" aria-hidden="true" />
          </span>

          <div class="min-w-0">
            <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              {{ $t('paywall.eyebrow') }}
            </p>
            <h2 id="song-paywall-title" class="mt-1 text-base font-bold tracking-tight text-ink sm:text-lg">
              {{ $t('paywall.title') }}
            </h2>
            <p class="mt-1.5 max-w-lg text-sm leading-relaxed text-muted">
              {{ $t('paywall.body') }}
            </p>
            <p v-if="cheapest" class="mt-2 font-mono text-xs text-faint">
              {{ $t('paywall.from', { price: cheapest.price, currency: cheapest.currency }) }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <AppButton
            :to="localePath('/pretplata')"
            size="md"
            icon-right="material-symbols:arrow-forward-rounded"
          >
            {{ $t('paywall.cta') }}
          </AppButton>

          <!-- Somebody who already pays and is merely signed out needs the other
               door, not the price list. -->
          <AppButton
            v-if="reason === 'login_required'"
            :to="localePath('/prijava')"
            variant="secondary"
            size="md"
          >
            {{ $t('paywall.signIn') }}
          </AppButton>
        </div>
      </div>
    </AppCard>
  </section>
</template>
