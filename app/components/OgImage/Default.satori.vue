<script setup>
/**
 * The fallback card for every page that is not a single song — the home page,
 * the artist and genre listings, the tuner. Without it those links paste into
 * a chat as a bare line of grey text.
 *
 * See Song.satori.vue for the satori constraints these styles work within, and
 * for why nothing here is bold.
 */
defineProps({
  title:       { type: String, default: 'Octava' },
  description: { type: String, default: '' },
  siteName:    { type: String, default: 'Octava' }
});
</script>

<template>
  <div
    style="width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;
           background-color:#faf8f5;padding:72px;font-family:Inter"
  >
    <div style="display:flex;position:absolute;top:0;left:0;width:1200px;height:14px;background-color:#b4472f" />

    <div style="display:flex;font-size:26px;color:#b4472f;letter-spacing:4px">
      {{ siteName.toUpperCase() }}
    </div>

    <div style="display:flex;margin-top:36px;font-size:68px;color:#12100f;line-height:1.1">
      {{ title }}
    </div>

    <div
      v-if="description"
      style="display:flex;margin-top:24px;font-size:32px;color:#12100f;opacity:0.55;line-height:1.35"
    >{{ description }}</div>
  </div>
</template>
