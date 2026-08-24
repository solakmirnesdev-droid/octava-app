<template>
  <div class="py-20 text-center">
    <h1 class="text-2xl font-semibold tracking-tight">Stranica nije pronađena</h1>
    <RouterLink :to="{ name: 'home' }" class="mt-4 inline-block text-accent hover:underline">
      Nazad na početnu
    </RouterLink>
  </div>
</template>
