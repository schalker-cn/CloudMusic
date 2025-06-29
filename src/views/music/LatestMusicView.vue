<script setup lang="ts">
import { formateSongsAuthor } from '@/utils';
import { computed, ref, type CSSProperties } from 'vue';
import { getTopSong } from '../../service';
import LoadImg from '@/components/Base/LoadImg.vue';
import PlayIcon from '@/components/Base/PlayIcon.vue';
import { useMemorizeRequest } from '@/hook/useMemorizeRequest';
import { useRouter } from 'vue-router';
import useThemeStyle from '@/hook/useThemeStyle';
import { useDbClickPlay } from '@/hook/useDbClickPlay';
import { mapSongs } from '@/utils/arr-map';
import { useMainStore } from '@/stores/main';
import { useNanoid } from '@/hook/useNanoid';
const typeList = [
  {
    value: '0',
    name: 'All'
  },
  {
    value: '7',
    name: 'Chinese'
  },
  {
    value: '96',
    name: 'American'
  },
  {
    value: '8',
    name: 'Japanese'
  },
  {
    value: '16',
    name: 'Korean'
  }
];
const router = useRouter();
const mainStore = useMainStore();
const newSongList = ref<any[]>([]);
const activeType = ref('0');
const { stripedClass, themeVars } = useThemeStyle();
const { currentId, set } = useNanoid();
const tagColor = computed(() => {
  return {
    textColor: themeVars.value.primaryColor,
    borderColor: themeVars.value.primaryColor
  };
});
const activeStyle = (value: string): CSSProperties => {
  return {
    color: value === activeType.value
      ? themeVars.value.primaryColor
      : themeVars.value.textColorBase,
    opacity: value === activeType.value
      ? 1
      : '0.5',
    fontSize: value === activeType.value
      ? '0.9rem'
      : '0.8rem'
  };
};
const { wrapRequest, requestLoading: isLoading, loadSuccess } = useMemorizeRequest(getTopSong, 'getTopSong');
const fetchData = () => {
  set(activeType.value);
  wrapRequest(activeType.value as any)
    .then(async (res: { data: { data: never[]; }; }) => {
      newSongList.value = mainStore.mapSongListAddLike(mapSongs(res.data.data));
      loadSuccess();
    });
};

const handleTypeClick = (value: string) => {
  activeType.value = value;
  fetchData();
};
const handleDBClick = useDbClickPlay();
const handleMouseEnter = (e: MouseEvent, value: string) => {
  if (value === activeType.value) return;
  (e.target as HTMLElement).style.opacity = '1';
};
const handleMouseLeave = (e: MouseEvent, value: string) => {
  if (value === activeType.value) return;
  (e.target as HTMLElement).style.opacity = '0.8';
};
fetchData();

</script>

<template>
  <div class="sticky top-0  z-10  p-4 bg-slate-50 dark:bg-black">
    <span v-for="item in typeList" :key="item.value"
      class="px-2 rounded-md opacity-50 transition duration-150 ease-in-out cursor-pointer"
      :style="activeStyle(item.value)" @mouseenter="handleMouseEnter($event, item.value)"
      @mouseleave="handleMouseLeave($event, item.value)" @click="handleTypeClick(item.value)">{{ item.name }}</span>
  </div>
  <div class="mt-4">
    <div v-show="isLoading">
      <div v-for="item in 9" :key="item" class="flex justify-between items-center p-2">
        <div class="flex items-center">
          <n-skeleton width="15px" class="mt-2" type="text" />
          <n-skeleton class="mt-2 ml-2" height="64px" width="64px" :sharp="false" />
        </div>
        <n-skeleton width="30%" height="30px" class="m-4" type="text" :repeat="3" />
        <n-skeleton width="5%" height="30px" class="m-2" type="text" />
      </div>
    </div>
    <transition name="fade" appear mode="out-in">
      <ul v-show="!isLoading" class="songList">
        <li v-for="(item, index) in newSongList" :key="item.id"
          :class="'flex items-center py-2 px-4 transition-colors ' + stripedClass(index)"
          @dblclick="handleDBClick(newSongList, currentId, item, index)">
          <div class="flex items-center" style="width:120px">
            <p class="w-5 text-sm opacity-80">
              {{ index < 9 ? '0' + (index + 1) : (index + 1) }} </p>
                <div style="transform: translateZ(0);" class="relative ml-4 w-16 h-16 rounded-md">
                  <load-img loading-height="64px" class-name="w-16 h-16 rounded-md" :src="item.album.picUrl"
                    :show-message="false" :double-click-preview="false" />
                  <play-icon :size="15" class="cursor-pointer position-center"
                    :style="{ opacity: '1', width: '25px', height: '25px' }" />
                </div>
          </div>
          <p class="ml-6 w-xs text-sm truncate flex-30">
            {{ item.name }}
            <n-tag v-if="item.mvid !== 0" size="small" :color="tagColor" @click=" router.push(`/mv/${item.mvid}`)">
              MV
            </n-tag>
          </p>
          <p class="ml-2 w-xs text-sm opacity-80 flex-30">
            <n-ellipsis>{{ formateSongsAuthor(item.artists) }}</n-ellipsis>
          </p>
          <p class="flex-1 ml-2 w-xs text-sm truncate opacity-80 flex-30">
            {{ item.album.name }}
          </p>
          <n-time class="pl-4 mx-2 text-sm text-left opacity-80" :time="item.bMusic?.playTime" format="mm:ss" />
        </li>
      </ul>
    </transition>
  </div>
</template>

<style scoped>
:deep(.n-tabs .n-tabs-rail) {
  border-radius: 30px;
}

:deep(.n-tabs .n-tabs-rail .n-tabs-tab-wrapper > .n-tabs-tab) {
  border-radius: 30px;
}

:deep(.n-data-table-thead) {
  display: none;
}

.text-left-opacity-50 {
  @apply pl-4 text-left opacity-50;
}

.flex-30 {
  flex: 0.5;
}
</style>
