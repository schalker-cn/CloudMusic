<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  props: {
    height: {
      type: String,
      default: '112px'
    },
    description: {
      type: String,
      default: 'no data'
    }
  }
});
</script>

<template>
  <div class="flex justify-center items-center" :style="{ height: height }">
    <n-empty :description="description" />
  </div>
</template>

<style scoped>
</style>
