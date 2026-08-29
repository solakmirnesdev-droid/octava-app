<script setup>
/**
 * The plans.
 *
 * AI-DECISION: not a three-column pricing grid with a highlighted middle tier.
 * There are two plans and they differ in one thing — how long they last — so a
 * table with feature ticks would be inventing differences to fill cells. The
 * page states what the subscription is for, then the two lengths, and stops.
 *
 * AI-NOTE: the catalogue figures are fetched, never written into the copy. A
 * number typed into a marketing line is wrong the day after it is typed, and
 * this one would be claiming a size the catalogue has to actually have.
 */
const localePath = useLocalePath();
const { t: $t } = useI18n();
const { $api } = useNuxtApp();
const auth = useAuthStore();
const toast = useToast?.() ?? null;

const { data: planData } = await useAsyncData('plans', () => $api('/plans'));
const { data: counts } = await useAsyncData('catalogue-size', () =>
  Promise.all([$api('/songs', { params: { limit: 1 } }), $api('/artists', { params: { limit: 1 } })])
    .then(([s, a]) => ({ songs: s.meta.total, artists: a.meta.total }))
    .catch(() => null));

const plans = computed(() => planData.value?.plans || []);
const simulated = computed(() => planData.value?.mode === 'simulated');

const busy = ref('');
const done = ref(false);

const active = computed(() => auth.user?.subscription?.active === true);

async function choose(plan) {
  if (!auth.isAuthenticated) return navigateTo(localePath('/prijava'));
  busy.value = plan.key;
  try {
    await $api('/me/subscription', { method: 'POST', body: { plan: plan.key } });
    await auth.fetchMe();
    done.value = true;
  } catch (err) {
    toast?.error?.(err?.data?.message || 'Pretplata nije uspjela.');
  } finally {
    busy.value = '';
  }
}

async function stop() {
  busy.value = 'cancel';
  try {
    await $api('/me/subscription', { method: 'DELETE' });
    await auth.fetchMe();
  } catch (err) {
    toast?.error?.(err?.data?.message || 'Otkazivanje nije uspjelo.');
  } finally {
    busy.value = '';
  }
}

const until = computed(() => {
  const d = auth.user?.subscription?.expiresAt;
  return d ? new Date(d).toLocaleDateString('bs') : '';
});

useSeoMeta({ title: () => `${$t('subscribe.metaTitle')} | Octava` });
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <header class="text-center">
      <p class="font-mono text-xs uppercase tracking-[0.25em] text-accent">
        {{ $t('subscribe.eyebrow') }}
      </p>
      <h1 class="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {{ $t('subscribe.title') }}
      </h1>
      <p class="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
        {{ $t('subscribe.lead') }}
      </p>

      <!-- Live, so the page cannot claim a catalogue that is not there. -->
      <p v-if="counts" class="mt-4 font-mono text-xs text-faint">
        {{ counts.songs }} {{ $t('subscribe.songs') }} · {{ counts.artists }} {{ $t('subscribe.artists') }}
      </p>
    </header>

    <!-- Already paying: the page becomes a receipt, not another offer. -->
    <div
      v-if="active"
      class="mt-8 rounded-2xl border border-ok/30 bg-ok-soft/40 p-6 text-center"
    >
      <p class="text-sm font-semibold text-ok">{{ $t('subscribe.activeTitle') }}</p>
      <p class="mt-1 text-sm text-muted">{{ $t('subscribe.activeUntil', { date: until }) }}</p>
      <button
        class="mt-4 rounded-lg border border-line-strong px-4 py-2 text-xs text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-40"
        :disabled="busy === 'cancel'"
        @click="stop"
      >{{ $t('subscribe.cancel') }}</button>
    </div>

    <div v-else class="mt-8 grid gap-4 sm:grid-cols-2">
      <div
        v-for="plan in plans" :key="plan.key"
        class="flex flex-col rounded-2xl border border-line bg-panel p-6 transition-colors hover:border-accent"
      >
        <p class="text-sm font-semibold text-ink">{{ $t(`subscribe.plan.${plan.key}`) }}</p>

        <p class="mt-3 flex items-baseline gap-1.5">
          <span class="font-mono text-3xl font-extrabold tracking-tight text-ink">{{ plan.price }}</span>
          <span class="font-mono text-sm text-faint">{{ plan.currency }}</span>
        </p>

        <p class="mt-1 text-xs text-faint">{{ $t(`subscribe.per.${plan.key}`) }}</p>

        <button
          class="mt-6 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
          :disabled="busy === plan.key"
          @click="choose(plan)"
        >
          {{ busy === plan.key ? '…' : $t('subscribe.choose') }}
        </button>
      </div>
    </div>

    <!--
      Said plainly, not buried. Somebody who clicks a price and is not charged
      needs to know that was on purpose — otherwise the site looks broken, or
      dishonest, depending on the reader.
    -->
    <p
      v-if="simulated && !active"
      class="mt-6 rounded-xl border border-warn/30 bg-warn-soft/30 px-4 py-3 text-center text-xs text-warn"
    >
      {{ $t('subscribe.simulated') }}
    </p>

    <p v-if="done" class="mt-4 text-center text-sm text-ok">{{ $t('subscribe.thanks') }}</p>
  </div>
</template>
