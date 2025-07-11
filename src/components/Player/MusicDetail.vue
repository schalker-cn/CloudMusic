<script setup lang="ts">
import { ref, type Ref, watch, reactive, nextTick, type CSSProperties, onMounted, onBeforeUnmount } from 'vue';
// @ts-ignore
import { BackToTop, Edit } from '@vicons/carbon';
import { formateSongsAuthor, getArrLast, throttle } from '@/utils';
import { KeyboardArrowDownOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@vicons/material';
import color from 'color';
import { useMainStore } from '@/stores/main';
import useThemeStyle from '@/hook/useThemeStyle';
import { useRouter } from 'vue-router';
import type { AnyObject } from 'env';
import { getSimilarPlaylist } from '@/service/playlist';
import { useAsyncState } from '@vueuse/core';
import { useBlurLineGradient } from './hook/useBlurLineGradient';
import { analyze } from '@/utils/image';

export interface MusicDetailExpose {
  show: () => void;
  close: () => void;
  toggle: () => void;
  active: Ref<boolean>;
}
let backTopEle: HTMLElement;

const mainStore = useMainStore();
const router = useRouter();
const { tagColor } = useThemeStyle();
const { updateFooterMaskColor, resetBackground } = useBlurLineGradient();
const commentModalRef = ref();
const commentLoading = ref(true);
const scrollContainerRef = ref<HTMLElement>(null as unknown as HTMLElement);
const musicComment = ref<AnyObject>({});
const myCanvas = ref<HTMLCanvasElement>();
const titleRef = ref<HTMLElement>();
const isShowTag = ref(false);
const showTopLyric = ref(false);
const tagPositionStyle = ref<CSSProperties>();
const fullScreen = ref(false);
const { isLoading: fetchSimiPlayListLoading, state: similarPlaylist, execute: executeGetSimiPlayList } = useAsyncState(
  (id: string) => {
    return getSimilarPlaylist(id).then(res => res.data.playlists);
  }, [],
  { resetOnExecute: false, immediate: false }
);
const showBackTop = ref(false);
const pageParams = reactive({
  pageCount: 10,
  page: 1,
  pageSize: 50
});
const target = () => scrollContainerRef.value;

const fillBackground = async (updateMask = true) => {
  await nextTick();
  let ctx = myCanvas.value!.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  let width = (window.innerWidth * 0.85);
  let height = window.innerHeight - 73;
  if (!mainStore.currentPlaySong) return;
  let baseColor = mainStore.theme === 'dark'
    ? '#121212'
    : 'white';
  ctx.fillStyle = baseColor;
  ctx.fillRect(
    0, 0, width, height
  );
  let primary;
  let resultColor = mainStore.primaryColorMap[mainStore.currentPlaySong.id];
  if (!resultColor) {
    const result = await analyze(mainStore.currentPlaySong.al.picUrl);
    mainStore.updatePrimaryColorMap(mainStore.currentPlaySong.id, result);
    primary = result;
  } else {
    primary = resultColor;
  }
  let bgColor = color(baseColor).mix(color(primary), 0.2)
    .hex();
  myCanvas.value!.width = width;
  myCanvas.value!.height = height;
  let gradient = ctx!.createLinearGradient(
    width / 2, 0, width / 2, height
  );
  gradient.addColorStop(0, bgColor);
  gradient.addColorStop(1, baseColor);
  ctx.fillStyle = gradient;
  mainStore.canvasBackground = `linear-gradient(${baseColor}, ${bgColor})`;
  ctx.fillRect(
    0, 0, width, height
  );
  if (updateMask) {
    updateFooterMaskColor(ctx);
  }
};
const fetchMusicComment = (id: string) => {
  let params: {
    id: string; limit: number; offset: number; before?: string;
  } = {
    id,
    limit: pageParams.pageSize,
    offset: ((pageParams.page) - 1) * pageParams.pageSize
  };
  if (musicComment.value?.total > 5000) {
    params.before = musicComment.value.comments[getArrLast(musicComment.value.comments)];
  }
  commentLoading.value = true;
  musicComment.value = [];
};
const handleSimiPlayListItem = (id: string) => {
  router.push(`/songList/${id}`);
  mainStore.setShowMusicDetail(false);
};

const handleScroll = (e: Event) => {
  let target = e.target as HTMLElement;
  if (target.scrollTop >= 120) {
    showTopLyric.value = true;
  } else if (target.scrollTop === 0) {
    showTopLyric.value = false;
  }
  updateFooterMaskColor(myCanvas.value!.getContext('2d')!);
};

const updateCommentList = (value: any) => {
  musicComment.value.total += 1;
  musicComment.value.comments.unshift(value);
};
const updateCommentLiked = (data: { liked: number, index: number }, isHot: boolean) => {
  let { index, liked } = data;
  if (isHot) {
    musicComment.value.hotComments[index].liked = !!liked;
    liked
      ? musicComment.value.hotComments[index].likedCount += 1
      : musicComment.value.hotComments[index].likedCount -= 1;
  } else {
    musicComment.value.comments[index].liked = !!liked;
    liked
      ? musicComment.value.comments[index].likedCount += 1
      : musicComment.value.comments[index].likedCount -= 1;
  }
};
const handleUpdateShow = (value: boolean) => {
  showBackTop.value = value;
};
const handleContextMenu = (ev: MouseEvent) => {
  ev.preventDefault();
  return false;
};
const handleMvTagClick = () => {
  if (mainStore.playing) {
    mainStore.changePlaying(false);
  }
  router.push(`/mv/${mainStore.currentPlaySong.mvid || mainStore.currentPlaySong.mv}`);
};
const handleTransitionAfterEnter = () => {
  updateFooterMaskColor(myCanvas.value!.getContext('2d')!);
};
const setTagPositionStyle = async () => {
  await nextTick();
  isShowTag.value = false;
  let left = titleRef.value!.offsetLeft + titleRef.value!.offsetWidth + 20;
  tagPositionStyle.value = { left: left + 'px', top: '-15px' };
  isShowTag.value = true;
};
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    fullScreen.value = true;
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
    fullScreen.value = false;
  }
}
watch(() => mainStore.theme, () => {
  resetBackground();
  fillBackground(mainStore.showMusicDetail);
});
watch(() => mainStore.showMusicDetail, async (val) => {
  if (!val) {
    showBackTop.value = false;
  }
  if (!isShowTag.value) {
    setTagPositionStyle();
  }
});
watch(
  () => mainStore.currentPlaySong, (val, oldVal) => {
    if (oldVal && val.id === oldVal.id) return;
    fetchMusicComment(val.id);
    executeGetSimiPlayList(0, val.id);
    if (oldVal && val.id !== oldVal.id) {
      resetBackground();
    }
    if (mainStore.showMusicDetail) {
      fillBackground();
    } else {
      fillBackground(false);
    }
    isShowTag.value = false;
    if (mainStore.showMusicDetail) {
      setTagPositionStyle();
    }
  }, { immediate: true }
);
watch(pageParams, () => {
  backTopEle = document.querySelector('.n-back-top') as HTMLElement;
  backTopEle && backTopEle.click();
  if (mainStore.currentPlaySong.id) {
    fetchMusicComment(mainStore.currentPlaySong.id);
  }
});
onMounted(() => {
  document.addEventListener("fullscreenchange", handleFullscreenchange);

  window.addEventListener('resize', handleResize);
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener("fullscreenchange", handleFullscreenchange);
},)
const handleResize = throttle(() => {
  if (mainStore.showMusicDetail) {
    fillBackground(true);
  }
}, 300);
const handleFullscreenchange = () => {
  fullScreen.value = !!document.fullscreenElement;
  setTimeout(() => {
    fillBackground(true);
  });
};
</script>

<template>
  <transition name="bottom-slide-transform" @after-enter="handleTransitionAfterEnter">
    <div v-show="mainStore.showMusicDetail" class="fixed inset-x-0 m-auto music-detail">
      <div class="box-border flex items-center p-4" style="height:77px;">
        <div class="flex items-center">
          <div class="ml-4 cursor-pointer">
            <n-icon size="35" :component="KeyboardArrowDownOutlined" @click="mainStore.setShowMusicDetail(false)" />
          </div>
          <div class="ml-4 cursor-pointer">
            <n-icon size="35" :component="fullScreen ? FullscreenExitOutlined : FullscreenOutlined"
              class="ml-4 cursor-pointer" @click="toggleFullScreen" />
          </div>
          <div class="ml-4"><change-theme></change-theme></div>
        </div>

        <div class="flex items-center ml-20">
          <layout-header-search />
        </div>
        <transition v-show="showTopLyric" name="slide">
          <div class="ml-20 text-left" style="width:520px">
            <p>
              {{ mainStore.currentPlaySong.name }}
            </p>
            <p class="opacity-50">
              {{ mainStore.currentPlayLyric }}
            </p>
          </div>
        </transition>
      </div>
      <div ref="scrollContainerRef" class="px-10 pt-5 detail-content" @scroll="handleScroll">
        <div class="flex ">
          <rotate-cd />
          <div class="max:ml-10 2xl:ml-3">
            <div style="width:520px">
              <div class="relative">
                <div class=" text-center">
                  <div ref="titleRef" style="display:inline-block">
                    <span class="text-3xl"> {{ mainStore.currentPlaySong.name }}</span>
                    <span class="tex-base opacity-50 pl-1" v-if="mainStore.currentPlaySong.tns">( {{
                      mainStore.currentPlaySong.tns[0]
                    }} )</span>
                  </div>
                  <div class="absolute" :style="tagPositionStyle">
                    <n-tag v-if="mainStore.currentPlaySong.mv !== 0 && mainStore.currentPlaySong.mvid !== 0"
                      size="small" :color="tagColor" @click="handleMvTagClick">
                      MV
                    </n-tag>
                  </div>
                </div>
              </div>
              <p v-if="mainStore.currentPlaySong.alia" class="mt-2 text-sm text-center opacity-50">
                {{ mainStore.currentPlaySong.alia[0] }}
              </p>
              <p class="mt-2 text-sm text-center opacity-50">
                {{ mainStore.currentPlaySong.al.name }}
                <span>-</span>
                {{ formateSongsAuthor(mainStore.currentPlaySong.ar || []) }}
              </p>
            </div>
            <div class="flex">
              <div>
                <music-lyric />

              </div>
              <n-scrollbar style="max-height: 350px;" class="pt-10 ml-10 hidden md:block 3xl:ml-0">
                <h3 v-if="similarPlaylist.length" class="m-0 text-left">
                  related playlists
                </h3>
                <n-divider v-if="similarPlaylist.length" />
                <n-spin :show="fetchSimiPlayListLoading" size="small">
                  <div v-show="fetchSimiPlayListLoading" class="w-80 h-32" />
                  <div v-for="item in similarPlaylist" v-show="!fetchSimiPlayListLoading" :key="item.id"
                    class="flex items-center p-2 hover:bg-neutral-50 dark:hover:bg-neutral-50/20 cursor-pointer"
                    @click="handleSimiPlayListItem(item.id.toString())">
                    <img crossorigin="anonymous" width="45" height="45" class="rounded-md" :src="item.coverImgUrl" />
                    <div class="ml-4">
                      <p class="w-60 text-sm text-left truncate">
                        {{ item.name }}
                      </p>
                      <p class="mt-2 w-60 text-sm text-left truncate">
                        <span class="opacity-50">by</span> <span class="opacity-80"> {{ item.creator.nickname }}</span>
                      </p>
                    </div>
                  </div>
                </n-spin>
              </n-scrollbar>
            </div>
          </div>
        </div>
        <div class="flex justify-center">
        </div>
      </div>
    </div>
  </transition>
  <transition name="bottom-slide-transform">
    <canvas v-show="mainStore.showMusicDetail" ref="myCanvas" class="background" @contextmenu="handleContextMenu" />
  </transition>

  <n-back-top style="z-index: 9999;" :show="showBackTop" :on-update:show="handleUpdateShow" :listen-to="target"
    :bottom="90" :right="400">
    <n-icon :component="BackToTop" />
  </n-back-top>
  <replied-comment-modal ref="commentModalRef" comment-placeholder="Write your comment here"
    :title="'Song: ' + mainStore.currentPlaySong.name" :update-comment-list="updateCommentList" :t="1" :type="0"
    :resource-id="mainStore.currentPlaySong.id" />
  <transition name="slide">
    <n-button v-show="!showBackTop && mainStore.showMusicDetail" class="fixed"
      style="z-index:9999;bottom: 90px;right:400px" round type="primary" @click="commentModalRef?.show()">
      <n-icon :component="Edit" />
      Comment
    </n-button>
  </transition>
  <transition name="slide">
    <n-button v-show="showBackTop && mainStore.showMusicDetail" type="primary" class="fixed w-44"
      style="z-index:9999;bottom: 90px;right:0;left:0;margin:auto" round @click="commentModalRef?.show()">
      <n-icon :component="Edit" />
      Post my comment
    </n-button>
  </transition>
</template>

<style scoped>
.music-detail {
  bottom: 68px;
  width: 75vw;
  height: calc(100vh - 68px);
  z-index: 1000;
  overflow: hidden;
}

.detail-content {
  height: calc(100vh - 68px - 77px);
  box-sizing: border-box;
  overflow-y: scroll;
  overflow-x: hidden;
}

.background {
  position: fixed;
  width: 75vw;
  height: calc(100vh - 68px);
  bottom: 68px;
  left: 0;
  right: 0;
  margin: auto;
  z-index: 999;
}

:deep(.n-back-top-placeholder) {
  z-index: 8888 !important;
}

.bottom-slide-transform-leave-active {
  transition: height .2s cubic-bezier(0.4, 0, 0.2, 1);
}

.bottom-slide-transform-enter-active {
  transition: height .6s cubic-bezier(0.4, 0, 0.2, 1);
  ;
}

.bottom-slide-transform-enter-from {
  height: 0;
}

.bottom-slide-transform-enter-to {
  height: calc(100vh - 73px);
}

.bottom-slide-transform-leave-to {
  height: 0;
}

:deep(.n-divider:not(.n-divider--vertical)) {
  margin: 10px 0;
}
</style>
