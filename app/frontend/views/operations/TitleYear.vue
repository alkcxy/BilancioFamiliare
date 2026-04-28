<script setup lang="ts">
defineProps<{ year: number }>()
const actualYear = new Date().getFullYear()
</script>

<template>
  <h1>
    Movimenti del {{ year }}
    <br />
    <small v-if="actualYear !== year" class="text-muted">
      <router-link :to="`/operations/year/${actualYear}`">Torna al {{ actualYear }}</router-link>
    </small>
  </h1>
</template>
