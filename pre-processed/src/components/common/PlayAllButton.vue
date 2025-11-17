<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import { Play, AddOutline } from '@vicons/ionicons5';
const mainStore = useMainStore();
const props = withDefaults(defineProps<{
  songList?: any[] | undefined;
  songListId: string;
}>(), { songList: () => [] });
const handleStartPlayAllClick = () => {
  if (mainStore.currentPlayListId === props.songListId) {
    if (mainStore.playing) {
      return window.$message.warning('is already playing');
    } else {
      mainStore.changePlayIndex(0, props.songList[0]);
    }
  } else {
    mainStore.initPlayList(
      props.songList, 0, props.songListId
    );
  }
  return null;
};
const handleAddToAllPlayListClick = () => {
  if (!mainStore.playListIdList.includes(props.songListId)) {
    return mainStore.addPlaylist(props.songList, props.songListId);
  } else {
    return window.$message.warning('already in the queue');
  }
};
</script>

<template>
  <n-button size="medium" type="primary" round>
    <template #icon>
      <n-icon :component="Play" />
    </template>
    <p @click="handleStartPlayAllClick">
      PLAY ALL
    </p>
    <div class="ml-4 ">
      <n-tooltip placement="bottom-start" trigger="hover">
        <template #trigger>
          <n-icon :component="AddOutline" size="20" @click="handleAddToAllPlayListClick" />
        </template>
        <span>add all to the queue</span>
      </n-tooltip>
    </div>
  </n-button>
</template>