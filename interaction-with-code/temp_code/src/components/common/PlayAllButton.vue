<script setup lang="ts">
import { Play, AddOutline } from '@vicons/ionicons5';
const props = withDefaults(defineProps<{
  songList?: any[] | undefined;
  songListId: string;
}>(), { songList: () => [] });
</script>

<template>
  <n-button size="medium" type="primary" round>
    <template #icon>
      <n-icon :component="Play" />
    </template>
    <p>
      PLAY ALL
    </p>
    <div class="ml-4 ">
      <n-tooltip placement="bottom-start" trigger="hover">
        <template #trigger>
          <n-icon :component="AddOutline" size="20"/>
        </template>
      </n-tooltip>
    </div>
  </n-button>
</template>