<script setup>
import { countries } from '~/utils/countries';

/**
 * Where the reader is.
 *
 * AI-NOTE: a plain select rather than a searchable combobox. There are 195
 * options but the six that matter here sit at the top, so the common case is
 * two taps and needs no JavaScript beyond the element itself — which also means
 * it works on a phone keyboard the way people already expect a select to.
 */
const model = defineModel({ type: String, default: '' });

defineProps({
  id: { type: String, default: 'country' },
  required: { type: Boolean, default: false }
});

const { locale } = useI18n();

// Recomputed on a language switch, so the names follow the page.
const list = computed(() => countries(locale.value));
const near = computed(() => list.value.filter((c) => c.nearby));
const rest = computed(() => list.value.filter((c) => !c.nearby));
</script>

<template>
  <select
    :id="id" v-model="model" :required="required" autocomplete="country"
    class="w-full rounded border border-line-strong bg-panel px-3 py-2 outline-none focus:border-accent"
  >
    <option value="">{{ $t('profile.countryNone') }}</option>

    <!-- The region first. An alphabetical list that opens with Afganistan makes
         the six countries almost everyone here will pick the hardest to reach. -->
    <optgroup :label="$t('profile.countryNearby')">
      <option v-for="c in near" :key="c.code" :value="c.code">{{ c.flag }} {{ c.name }}</option>
    </optgroup>

    <optgroup :label="$t('profile.countryAll')">
      <option v-for="c in rest" :key="c.code" :value="c.code">{{ c.flag }} {{ c.name }}</option>
    </optgroup>
  </select>
</template>
