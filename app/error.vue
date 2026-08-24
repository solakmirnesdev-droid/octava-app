<script setup>
defineProps({ error: { type: Object, required: true } });
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center text-ink">
    <p class="font-mono text-sm text-accent">{{ error.statusCode }}</p>
    <h1 class="mt-2 text-2xl font-semibold tracking-tight">
      {{ error.statusMessage || 'Nešto je pošlo po zlu.' }}
    </h1>
    <NuxtLink to="/" class="mt-6 text-accent hover:underline" @click="clearError">
      Nazad na početnu
    </NuxtLink>
  </div>
</template>
