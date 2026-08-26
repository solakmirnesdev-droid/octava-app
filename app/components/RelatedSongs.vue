<script setup>
/**
 * Where a song page goes next.
 *
 * Fetched on the client. This is a navigation aid, not content a search engine
 * should read as part of this song, and putting it in the server render would
 * add a query to the path of the thing people came for.
 *
 * The list is deliberately plain: whoever reads this is mid-session with a
 * guitar in their lap, and the decision is "which title do I recognise".
 */
const props = defineProps({
  slug: { type: String, required: true }
});

const { $api } = useNuxtApp();
const localePath = useLocalePath();

const items = ref([]);
const loaded = ref(false);

onMounted(async () => {
  try {
    const res = await $api(`/songs/${props.slug}/related`, { params: { limit: 6 } });
    items.value = res.items || [];
  } catch {
    items.value = [];
  } finally {
    loaded.value = true;
  }
});
</script>

<template>
  <!-- Nothing at all rather than an empty heading: a section that says it has
       suggestions and then has none reads as broken. -->
  <section v-if="loaded && items.length" class="mt-10 border-t border-black/10 pt-6">
    <h2 class="mb-4 text-lg font-semibold tracking-tight">{{ $t('song.relatedTitle') }}</h2>

    <ul class="grid gap-x-6 gap-y-1 sm:grid-cols-2">
      <li v-for="s in items" :key="s._id">
        <NuxtLink
          :to="localePath(`/pjesma/${s.slug}`)"
          class="flex items-baseline gap-2 rounded py-2 hover:text-accent"
        >
          <span class="truncate font-medium">{{ s.title }}</span>
          <span v-if="s.artist" class="truncate text-sm text-black/45">{{ s.artist.name }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
