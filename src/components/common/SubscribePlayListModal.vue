<script setup lang="ts">
import { updatePlaylistTracks, createPlaylist } from '@/service/playlist';
import { useMainStore } from '@/stores/main';
import obverser from '@/utils/obverser';
import { ArrowBackIosSharp } from '@vicons/material';
import { computed, ref, watch } from 'vue';
let isLoad = false;
const mainStore = useMainStore();
const showCreatePlayList = ref(false);
const isPrivate = ref(false);
const playListTitle = ref('');
const showModal = ref(false);
const btnLoading = ref(false);
const props = defineProps<{
  tracks: number;
}>();
const modalStyle = computed(() => {
  return {
    padding: 0,
    width: '500px',
    height: showCreatePlayList.value
      ? '250px'
      : '450px',
    overflow: 'hidden'
  };
});
const handleItemClick = (item: any, index: number) => {
  if (!mainStore.isLogin) {
    return window.$message.error('please log in first');
  }
  if (isLoad) return undefined;
  isLoad = true;
  let params: { tracks: number, op: 'add' | 'del', pid: number } = {
    tracks: props.tracks,
    op: 'add',
    pid: item.id
  };
  window.$message.loading('加载中..', { duration: 0 });
  return updatePlaylistTracks(params).then((res) => {
    if (res.data?.body.code === 200) {
      window.$message.success('already added to the playlist');
      mainStore.mySubscribeSongList[index].trackCount = res.data.body.count;
    } else {
      window.$message.error(res.data.body.message);
    }
    window.$message.destroyAll();
    isLoad = false;
  });
};
const handleCreateClick = () => {
  if (!mainStore.isLogin) {
    return window.$message.error('please log in first');
  }
  let params: { name: string, privacy?: string } = { name: playListTitle.value };
  if (isPrivate.value) {
    params.privacy = '10';
  }
  btnLoading.value = true;
  return createPlaylist(params).then((res) => {
    if (res.data?.code === 200) {
      window.$message.success('创建成功');
      showCreatePlayList.value = false;
      playListTitle.value = '';
      mainStore.mySubscribeSongList.push(res.data.playlist);
      obverser.emit('updateMyCreatePlayList', res.data.playlist);
      btnLoading.value = false;
    }
  });
};
defineExpose({
  show() {
    showModal.value = true;
  }
});
watch(showModal, (val) => {
  if (!val) {
    setTimeout(() => {
      showCreatePlayList.value = false;
    }, 300);
  }
});
</script>

<template>
  <n-modal v-model:show="showModal" preset="dialog" transform-origin="center" :show-icon="false" :mask-closable="true"
    class="transition-all duration-300" :style="modalStyle">
    <div class="my-4">
      <transition name="fade" mode="out-in">
        <div v-if="!showCreatePlayList">
          <div class="flex items-center pb-4 pl-4" @click="showCreatePlayList = true">
            <div class="bg-gray-200 dark:bg-gray-200/20 add">
              <div class="line" />
              <div class="line" />
            </div>
            <span class="pl-2 cursor-default">Create new playlist</span>
          </div>
          <base-empty v-if="!mainStore.mySubscribeSongList.length" description="You haven't created any playlist yet." />
          <n-scrollbar style="max-height: 300px">
            <div v-for="(item, index) in mainStore.mySubscribeSongList" :key="item.id"
              class="flex items-center py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-200/20 transition-all cursor-pointer"
              @click="handleItemClick(item, index)">
              <img class="w-14 h-14 rounded-lg" :src="item.coverImgUrl" crossorigin="anonymous" />
              <div class="ml-2">
                <n-ellipsis>
                  <p>{{ item.name }}</p>
                </n-ellipsis>
                <p class="pt-2">
                  <span class="text-gray-500">{{ item.trackCount }}首，</span>
                  <span class="text-gray-500">{{ item.playCount }}次播放</span>
                </p>
              </div>
            </div>
          </n-scrollbar>
        </div>
        <div v-else class="p-4">
          <n-space vertical>
            <n-input v-model:value="playListTitle" placeholder="name" />
            <n-checkbox v-model:checked="isPrivate" size="small" label="Set as private" />
          </n-space>
          <div class="flex justify-center mt-4">
            <n-button :loading="btnLoading" :disabled="!playListTitle" type="primary" @click="handleCreateClick">
              Create
            </n-button>
          </div>
        </div>
      </transition>
    </div>
    <template #header>
      <div class="flex flex-1 items-center">
        <n-icon v-if="showCreatePlayList" :size="20" class="ml-4 cursor-pointer" :component="ArrowBackIosSharp"
          @click="showCreatePlayList = false" />
        <h4 class="flex-1 my-5 text-center">
          {{ showCreatePlayList ? 'Create new playlist' : 'Add to playlist' }}
        </h4>
      </div>
    </template>
  </n-modal>
</template>

<style lang="less" scoped>
.add {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  padding: 10px;
  justify-content: center;

  .line {
    width: 1px;
    height: 25px;
    background-color: var(--n-icon-color);
  }

  >div:nth-child(2) {
    background-color: var(--n-icon-color);
    transform: rotate(90deg);
  }
}
</style>
