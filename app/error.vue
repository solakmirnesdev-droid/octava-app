<script setup>
const localePath = useLocalePath();
defineProps({ error: { type: Object, required: true } });
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center text-ink">
    <p class="font-mono text-sm text-accent">{{ error.statusCode }}</p>
    <h1 class="mt-2 text-2xl font-semibold tracking-tight">
      {{ error.statusMessage || 'Nešto je pošlo po zlu.' }}
    </h1>
    <NuxtLink :to="localePath('/')" class="mt-6 text-accent hover:underline" @click="clearError">
      {{ $t('common.backHome') }}
    </NuxtLink>
  </div>
</template>
