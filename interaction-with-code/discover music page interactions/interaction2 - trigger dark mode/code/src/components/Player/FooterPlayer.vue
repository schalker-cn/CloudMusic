<script setup lang="ts">
import StopIcon from '@/components/Icon/StopIcon.vue';
import OrderPlay from '@/components/Icon/OrderPlay.vue';
import { formateSongsAuthor } from '@/utils';
import { List } from '@vicons/ionicons5';
import {
  SkipPreviousSharp, SkipNextSharp,
  PlayArrowSharp, VolumeUpRound,
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined, AddBoxOutlined
} from '@vicons/material';
import { useThemeVars } from 'naive-ui';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useMainStore } from '@/stores/main';
import dayjs from 'dayjs';
import type { PlayListExpose } from './PlayList.vue';
import { useElementHover } from '@vueuse/core';
import obverser from '@/utils/obverser';
import { useAudioLoadProgress } from './hook/useAudioLoadProgress';
import { getOpusBlobDataByIdUsingIndex, openDatabase, saveSong } from '@/utils/initIndexDb'
import { AudioIndexedData } from 'env';

let slideValueChange = false;
let triggerOriginalAudioTimeUpdate = true;
const progressWidth = 500;
const themeVars = useThemeVars();
const mainStore = useMainStore();
// trigger to show music detail
const triggerRef = ref();
const isHover = useElementHover(triggerRef);
const subscribeModalRef = ref<{ show: () => void }>();
let isLoad = false;
const audioRef = ref<HTMLAudioElement>();
const { updateBuffer, progressValue } = useAudioLoadProgress(audioRef, mainStore.currentPlaySong?.dt / 1000);
// percentage of playing bar
const percentage = ref(0);
const currentPlayTime = ref('00:00');
const volume = ref(+localStorage.volume || 100);
const playListRef = ref<PlayListExpose>();
const primaryColor = computed(() => themeVars.value.primaryColor);
const currentSong = computed(() => mainStore.currentPlaySong);
const isShow = computed(() => !!mainStore.playList.length);
const currentPlayModeIcon = computed(() => {
  return OrderPlay;
});
const activeStyle = computed(() => {
  let transformStyle;
  if (!mainStore.showMusicDetail) {
    transformStyle = 'translateY(0)';
  } else {
    transformStyle = 'translateY(-54px)';
  }
  return { transform: transformStyle };
});
const loadCurrentPrevAndNext = async (val: any) => {
  if (!val) return;
  // load url for next and prev song
  let next = mainStore.playList[val.nextIndex];
  let prev = mainStore.playList[val.prevIndex];
  if (next && !next.url) {
    mainStore.setMusicData({ data: mainStore.playList, id: next.id, index: val.nextIndex, showMessage: false });
  }
  if (prev && !prev.url) {
    mainStore.setMusicData({ data: mainStore.playList, id: prev.id, index: val.prevIndex, showMessage: false });
  }
  localStorage.playList = JSON.stringify(mainStore.playList);
};
const requestSongData = async () => {
  const res = await mainStore.setMusicData({ data: mainStore.playList, id: mainStore.currentPlaySong.id, index: mainStore.currentPlayIndex });
  if (res.success) {
    // reload media resource
    audioRef.value?.load();
    localStorage.playList = JSON.stringify(mainStore.playList);
    resetState();
    if (mainStore.playing) {
      audioRef.value?.play();
    }
  }
}
watch(
  () => mainStore.currentPlaySong, (val, oldVal) => {
    if (!val) return;
    loadCurrentPrevAndNext(val);
    if (oldVal && val.id !== oldVal.id) {
      if (!audioRef.value?.paused) {
        mainStore.playing = false;
      }
      audioRef.value?.load();
      resetState();
      tryPlay();
    }
    document.title = val.name;
    if (!val.url) {
      requestSongData();
    }
    // create a temp url from blob data
    getOpusBlobDataByIdUsingIndex(mainStore.currentPlaySong?.id).then((res: AudioIndexedData) => {
      if (res) {
        const url = window.URL.createObjectURL(res.blob);

        if (res.id === mainStore.currentPlaySong.id) {
          if (!audioRef.value?.paused) {
            mainStore.playing = false;
          }
          mainStore.currentPlaySong.url = url;
          setTimeout(() => {
            mainStore.playing = true;
          });
        }
      }
    })
  }, { immediate: true }
);
watch(() => mainStore.playList, (val) => {
  if (val.length === 0) {
    percentage.value = 0;
  }
});
watch(() => mainStore.playing, (val) => {
  if (val) {
    tryPlay();
  } else {
    audioRef.value?.pause();
  }
});
const resetState = () => {
  currentPlayTime.value = '00:00';
  percentage.value = 0;
  progressValue.value = 0;
  audioRef.value!.currentTime = 0;
  mainStore.playWaiting = true;
};
const tryPlay = () => {
  if (audioRef.value && audioRef.value!.readyState >= 2 && audioRef.value?.paused) {
    audioRef.value?.play();
  }
  mainStore.changePlaying(true);
};
const handleEnded = () => {
  if (mainStore.playMode === 'singleLoop') {
    audioRef.value!.currentTime = 0;
    audioRef.value?.play();
  } else {
    mainStore.toggleNext();
  }
  obverser.emit('ended');
};
const handleTimeupdate = (event: Event) => {
  if (triggerOriginalAudioTimeUpdate) {
    const target = event.target as HTMLAudioElement;
    updatePlayTime(target.currentTime);
  }
};

const updatePlayTime = async (time: number, triggerPlay = false) => {
  // if the slider is being changed by user, do not update time to avoid conflict
  if (!slideValueChange) {
    currentPlayTime.value = dayjs(time * 1000).format('mm:ss');
    percentage.value = Math.round(((time * 1000) / currentSong.value?.dt) * 100);

  }
  if (triggerPlay) {
    tryPlay();
    await nextTick();
    if (audioRef.value) {
      audioRef.value!.currentTime = time;
    }
  }
  obverser.emit('timeUpdate', Math.round(time * 1000));
};
// first frame loaded, ready to play
const handleLoadeddata = () => {
  let data = {
    id: mainStore.currentPlaySong.id,
    url: mainStore.currentPlaySong.url,
    name: mainStore.currentPlaySong.name,
  };
  if (!mainStore.currentPlaySong.url?.startsWith('blob:')) {
    getOpusBlobDataByIdUsingIndex(data?.id).then((res) => {
      if (!res) {
        saveSong(data)
      }
    })
  }
  if (mainStore.playing && audioRef.value?.paused) {
    audioRef.value?.play();
  }
};
const handleWaiting = () => {
  mainStore.playWaiting = true;
};
const handlePlaying = () => {
  mainStore.playWaiting = false;
};
const MAX_RETRY_COUNT = 1; 
let retryCount = 0;
const handleError = () => {
  if (mainStore.currentPlaySong.url?.startsWith('blob:')) {
    // create a temp url from blob data
    getOpusBlobDataByIdUsingIndex(mainStore.currentPlaySong?.id).then((res: AudioIndexedData) => {
      if (res) {
        const url = window.URL.createObjectURL(res.blob);
        if (res.id === mainStore.currentPlaySong.id) {
          mainStore.currentPlaySong.url = url;

        }
      } else {
        requestSongData();
      }
    });
    return;
  }
  if (audioRef.value?.error?.code === 4 || audioRef.value?.error?.code === 2) {
    if (retryCount >= MAX_RETRY_COUNT) {
      return;
    }
    window.$message.warning('song resource expires, try to fetch again');

    if (isLoad) return;
    isLoad = true;

    mainStore.setMusicData({ data: mainStore.playList, id: mainStore.currentPlaySong.id, index: mainStore.currentPlayIndex }).then(res => {
      localStorage.playList = JSON.stringify(mainStore.playList);
      isLoad = false;
      if (res.success) {
        audioRef.value?.load();
        resetState();
        if (mainStore.playing) {
          audioRef.value?.play();
        }
      }
    }).catch((error) => {
      console.error('Error while setting music data:', error);
    });

    retryCount++;
  }
};

const handleVolumeClick = () => {
  if (volume.value === 100) {
    volume.value = 0;
    localStorage.volume = 0;
  } else {
    volume.value = 100;
    localStorage.volume = 100;
  }
  audioRef.value!.volume = volume.value / 100;
};

onMounted(() => {
  openDatabase();
});
</script>
<template>

  <div class="footer-player overflow-hidden" style="">
    <slider-bar v-show="mainStore.showMusicDetail"
      style="position: fixed;bottom: 54px;width: 75vw;z-index: 999;overflow: hidden;" width="75vw" v-model="percentage"
      :load-value="progressValue"/>
    <div class="flex items-center p-2" :style="{
      transform: mainStore.showMusicDetail ? 'translateY(14px)' : 'translateY(0px)', padding: mainStore.showMusicDetail ? '0px' : '4px '
    }">
      <div v-if="isShow" :class="['overflow-hidden h-12',]">
        <div :style="activeStyle" class="transition-ease">
          <div class="flex items-center h-full">
            <div ref="triggerRef" class="relative">
              <img crossorigin="anonymous" class="w-12 h-12 overflow-hidden" :src="currentSong?.al?.picUrl"
                :preview-disabled="true" :style="{ filter: isHover ? 'blur(1px)' : 'none' }" />
              <transition v-show="isHover" name="fade">
                <div class="absolute top-0 left-0 z-10 w-12  h-12 bg-black/60 flex-items-justify-center">
                  <n-icon :component="KeyboardArrowUpOutlined" size="35" color="white" />
                </div>
              </transition>
            </div>
            <div class="ml-4">
              <p class="flex items-center text-base">
                <n-ellipsis style="max-width: 150px">
                  {{ currentSong?.name }}
                </n-ellipsis>
                <heart-icon :id="mainStore.currentPlaySong.id" class="ml-2" :like="mainStore.currentPlaySong.like"/>
              </p>
              <n-ellipsis>
                <p>{{ formateSongsAuthor(currentSong?.ar || []) }}</p>
              </n-ellipsis>
            </div>
          </div>
          <div class="flex items-center h-12">
            <n-icon size="35" :component="KeyboardArrowDownOutlined" class="ml-4"/>
            <div class="ml-4">
              <div class="circleContainer">
                <heart-icon :id="mainStore.currentPlaySong.id" ref="heardLikeRef" :like="mainStore.currentPlaySong.like"
                  :size="25" :trigger-click="true"/>
              </div>
            </div>
            <div class="ml-4 circleContainer" @click="subscribeModalRef?.show()">
              <n-icon :component="AddBoxOutlined" :size="20" />
            </div>
            <div class="pl-4">
              <span class="mr-2 text-xs opacity-50">{{ currentPlayTime }}</span>
              <span>/</span>
              <span class="ml-2 text-xs opacity-50">
                <n-time format="mm:ss" :time="currentSong?.dt" />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div
        :style="{ opacity: isShow ? '1' : '0.6', transform: mainStore.showMusicDetail ? 'translateY(14px)' : 'translateY(0px)' }"
        class="flex flex-col flex-1 items-center transition">
        <div v-if="!isShow" class="absolute z-50 w-full footer-player" />
        <div style="width:25%" class="flex justify-evenly items-center">
          <n-icon class="custom-icon" :size="22" :component="currentPlayModeIcon" />
          <n-icon class="prev custom-icon" :size="22" :component="SkipPreviousSharp" />
          <div
            class="flex justify-center items-center w-8 h-8  bg-neutral-200/60 hover:bg-neutral-200 dark:bg-slate-100/20 dark:hover:bg-slate-100/40 rounded-full">
            <n-icon :size="mainStore.playing ? 14 : 20" :component="mainStore.playing ? StopIcon : PlayArrowSharp" />
          </div>
          <n-icon class="next custom-icon" :size="22" :component="SkipNextSharp"/>
        </div>
        <div class="flex items-center mt-1">
          <span v-show="isShow" class="mr-2 text-xs opacity-50">{{ currentPlayTime
          }}</span>
          <div class="flex flex-1 items-center" :style="{ width: progressWidth + 'px' }">
            <slider-bar v-model="percentage" :load-value="progressValue"/>
          </div>
          <span v-show="isShow" class="ml-2 text-xs opacity-50">
            <n-time format="mm:ss" :time="currentSong?.dt" />
          </span>
        </div>
      </div>
      <div v-if="isShow" class="flex justify-end items-center ">
        <n-popover placement="bottom" trigger="hover">
          <template #trigger>
            <n-icon :component="VolumeUpRound" :size="25" class="mr-2 custom-icon"/>
          </template>
        </n-popover>
        <n-icon :component="List" :size="25" class="mr-2 custom-icon"/>
      </div>
      <audio crossorigin="anonymous" ref="audioRef" id="audioEle" :src="currentSong?.url" preload="auto"
        @timeupdate="handleTimeupdate" @ended="handleEnded" @playing="handlePlaying" @progress="updateBuffer"
        @loadeddata="handleLoadeddata" @error="handleError" @waiting="handleWaiting" />
    </div>
  </div>
</template>
<style scoped>
.footer-player {
  height: 68px;
}

:deep(.custom-icon:hover) {
  color: v-bind(primaryColor);
}

:deep(.n-icon) {
  cursor: pointer;
}

.transition-ease {
  transition: transform .6s ease;
}

.circleContainer {
  @apply w-10 h-10 rounded-full border border-gray-200 dark:border-gray-200/30 border-solid hover:bg-gray-100 dark:hover:bg-gray-100/20 flex-items-justify-center;
}
</style>
