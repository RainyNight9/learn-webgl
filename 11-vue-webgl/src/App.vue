<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="AppContainer">
    <RouterView />
  </div>
</template>

<style scoped>
.AppContainer {
    min-height: 100vh;
    background-color: #000;
    color: #fff;
}
</style>
