<script setup lang="ts">
defineProps<{ year: number }>()
</script>

<template>
  <nav class="mt-3">
    <ul class="pagination justify-content-center">
      <li class="page-item">
        <router-link :to="`/operations/year/${year - 1}`" class="page-link">&laquo; {{ year - 1 }}</router-link>
      </li>
      <li class="page-item">
        <router-link :to="`/operations/year/${year + 1}`" class="page-link">{{ year + 1 }} &raquo;</router-link>
      </li>
    </ul>
  </nav>
</template>
