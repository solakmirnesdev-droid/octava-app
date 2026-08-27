<script setup>
/**
 * Offers the other language rather than switching to it.
 *
 * Runs only in the browser and never redirects. An automatic switch would
 * decide for the crawler too, and since crawlers arrive with US addresses and
 * usually no language header, the Bosnian catalogue would disappear from the
 * index entirely.
 */
const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const STORAGE_KEY = 'octava_locale_choice';

/**
 * Languages of the region the Bosnian version serves. A visitor whose browser
 * asks for any of these is better served by it, wherever they happen to be —
 * which is precisely what an address lookup would get wrong for anyone abroad.
 */
const REGIONAL = ['bs', 'hr', 'sr', 'sh', 'me', 'mk', 'sl', 'sq'];

const visible = ref(false);
const suggested = computed(() => locales.value.find((l) => l.code !== locale.value));

onMounted(() => {
  // A choice already made is a choice; do not ask again.
  if (localStorage.getItem(STORAGE_KEY)) return;

  const preferred = (navigator.languages || [navigator.language || ''])
    .map((tag) => tag.toLowerCase().split('-')[0]);

  const wantsRegional = preferred.some((tag) => REGIONAL.includes(tag));
  const shouldSuggest = wantsRegional ? locale.value !== 'bs' : locale.value !== 'en';

  visible.value = shouldSuggest;
});

function remember(choice) {
  localStorage.setItem(STORAGE_KEY, choice);
  visible.value = false;
}
</script>

<template>
  <div
    v-if="visible && suggested"
    class="border-b border-line bg-accent/5"
    role="region"
    :aria-label="$t('language.switch')"
  >
    <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-2 text-sm">
      <Icon name="material-symbols:language" class="text-accent" />
      <span class="text-body">{{ $t('language.suggestion') }}</span>

      <NuxtLink
        :to="switchLocalePath(suggested.code)"
        class="font-medium text-accent hover:underline"
        @click="remember(suggested.code)"
      >
        {{ $t('language.viewIn') }}
      </NuxtLink>

      <button class="ml-auto text-xs text-faint hover:text-accent" @click="remember(locale)">
        {{ $t('language.dismiss') }}
      </button>
    </div>
  </div>
</template>
