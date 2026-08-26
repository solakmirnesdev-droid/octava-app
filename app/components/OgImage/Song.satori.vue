<script setup>
/**
 * The card that appears when a song link is pasted into WhatsApp, Viber or
 * Facebook. Rendered by satori, which supports a deliberate subset of CSS:
 * every container needs an explicit display:flex, there is no grid, and
 * shorthand properties are unreliable — hence the long-hand inline styles.
 *
 * Colours are the site's own tokens, hardcoded because satori resolves no
 * CSS variables.
 *
 * AI-NOTE: only Inter 400 reaches satori — @nuxt/fonts fetches the faces the
 * site's own CSS asks for, and the site does not use Inter. Declaring weights
 * in nuxt.config or writing font-bold here changes nothing; both were tried.
 * The hierarchy therefore comes from size and colour, not weight. To get a
 * bold face here the app itself would have to adopt Inter at 700.
 */
defineProps({
  title:      { type: String, default: '' },
  artist:     { type: String, default: '' },
  musicalKey: { type: String, default: '' },
  capo:       { type: Number, default: 0 },
  difficulty: { type: String, default: '' },
  capoLabel:  { type: String, default: '' },
  siteName:   { type: String, default: 'Octava' }
});
</script>

<template>
  <div
    style="width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;
           background-color:#faf8f5;padding:72px;font-family:Inter"
  >
    <!-- A bar in the accent colour rather than a logo file: there is no mark
         yet, and a coloured edge still reads as "this is a place". -->
    <div style="display:flex;position:absolute;top:0;left:0;width:1200px;height:14px;background-color:#b4472f" />

    <div style="display:flex;flex-direction:column;margin-bottom:52px">
      <div class="font-bold" style="display:flex;font-size:26px;color:#b4472f;letter-spacing:4px">
        {{ siteName.toUpperCase() }}
      </div>

      <div
        class="font-bold" style="display:flex;margin-top:36px;font-size:78px;color:#12100f;line-height:1.08"
      >{{ title }}</div>

      <div v-if="artist" style="display:flex;margin-top:20px;font-size:40px;color:#12100f;opacity:0.6">
        {{ artist }}
      </div>
    </div>

    <div style="display:flex;align-items:center">
      <div
        v-if="musicalKey"
        style="display:flex;margin-right:16px;padding-top:12px;padding-bottom:12px;padding-left:26px;
               padding-right:26px;border-radius:999px;background-color:#b4472f;color:#ffffff;
               font-size:30px"
        class="font-bold"
      >{{ musicalKey }}</div>

      <div
        v-if="capo"
        style="display:flex;margin-right:16px;padding-top:12px;padding-bottom:12px;padding-left:26px;
               padding-right:26px;border-radius:999px;border:2px solid rgba(18,16,15,0.18);
               color:#12100f;font-size:28px"
      >{{ capoLabel }}</div>

      <div
        v-if="difficulty"
        style="display:flex;padding-top:12px;padding-bottom:12px;padding-left:26px;padding-right:26px;
               border-radius:999px;border:2px solid rgba(18,16,15,0.18);color:#12100f;font-size:28px"
      >{{ difficulty }}</div>
    </div>
  </div>
</template>
