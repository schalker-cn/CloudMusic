<script setup lang="ts">
import { useThemeVars } from 'naive-ui';
import obverser from '@/utils/obverser';
import { PlayArrowSharp } from '@vicons/material';
import { computed, nextTick, onMounted, toRaw, watch, type CSSProperties } from 'vue';
import { useMainStore } from '@/stores/main';
import { ref } from 'vue';
import { parseLyric, parseRangeLyric, type LyricItem, parseBaseLyric, type RangeLyricItem } from '@/utils/lyric';
import { useElementHover } from '@vueuse/core';
let timeId: any;
let clearTriggerScrollTimer: any;
let triggerScroll = true;
let triggerPlayLyric = true;
let selectLyricLineIndex = 0;
let pendingSetScrollFn: (() => void) | null = null;
const mainStore = useMainStore();
const themeVars = useThemeVars();
const currentPlayLine = ref(0);
const eleScrollTopMap = new Map();
const selectLyricLine = ref<{ time: number; index: number, middleTop: number } | null>();
const showSelectLyric = ref(false);
const lyricContainer = ref<HTMLDivElement>();
const scrollBarRef = ref<{ scrollTo: (data: { left?: number, top?: number, behavior: string }) => void }>();
const scrollContainerRef = ref();
const footerMaskBackground = ref<CSSProperties>({});
const topMaskBackground = ref<CSSProperties>({});

const isHover = useElementHover(scrollContainerRef);
let audioEle: HTMLAudioElement | null = null;
let animatingId: number;
const activeLyricStyle = ref({
  backgroundImage: '',
  WebkitTextFillColor: 'transparent',
  fontWeight: 'bold',
  fontSize: '16px'
} as CSSProperties);

let lyricContainerEle: null | HTMLDivElement = null;
let currentScrollTop = 0;
let lyricItemHeight = 35;
let lyricChildrenValueList: { offsetTop: number, index: number, time: number, height: number, middleTop: number }[] = [];
const hasTlyric = computed(() => {
  return mainStore.currentPlaySong?.tlyric !== '' && mainStore.currentPlaySong?.tlyric !== undefined;
});
const gapHeight = computed(() => {
  return hasTlyric.value ? 175 : 140
});
const containerHeight = computed(() => {
  return hasTlyric.value
    ? 350 : 315;
});



const lyricData = computed(() => {
  let tlyricData: LyricItem[] | undefined;
  if (mainStore.currentPlaySong?.tlyric) {
    tlyricData = parseBaseLyric(mainStore.currentPlaySong?.tlyric);
  }
  if (!mainStore.currentPlaySong?.lyric) {
    return [];
  } else {
    let lyric = parseLyric(mainStore.currentPlaySong?.lyric, mainStore.currentPlaySong?.yrcLyric);
    if (tlyricData) {
      lyric.filter((item) => !/^\[[^\d\]]+\]$/.test(item.content) && item.index != undefined).forEach((item, index) => {
        if (tlyricData[index]) {
          item.translateContent = tlyricData[index].content;
        }
        return item;
      });
      return lyric;
    } else {
      return lyric;
    }
  }
});


const rangeLyricList = computed(() => {
  return parseRangeLyric(toRaw(lyricData.value));
});
const currentLyricStyle = computed(() => {
  return (index: number) => {
    let isCurrent = index === currentPlayLine.value;
    return {
      color: isCurrent
        ? themeVars.value.primaryColor
        : selectLyricLine.value?.index === index
          ? themeVars.value.primaryColorSuppl
          : '#646463',
      fontWeight: isCurrent
        ? 'bold'
        : '500',
      fontSize: isCurrent
        ? '16px'
        : '14px'
    } as CSSProperties;

  };
});
function handlePlayLyric(time: number, listenScroll = false) {
  if (selectLyricLine.value) return;
  if (!triggerPlayLyric) return;
  triggerLyricChange(time, listenScroll);
}
const handleSliderChange = (time: number, listenScroll = false) => {
  if (mainStore.showMusicDetail) {
    triggerLyricChange(time, listenScroll);
  } else {
    pendingSetScrollFn = () => triggerLyricChange(time, listenScroll);
  }
};

const triggerLyricChange = (time: number, listenScroll = false) => {
  if (mainStore.currentPlaySong.isNotLyric) return;
  if (!lyricData.value.length) return;

  if (time > lyricData.value[lyricData.value.length - 1].time) {
    let currentLyric = lyricData.value[lyricData.value.length - 1];
    currentPlayLine.value = lyricData.value.length - 1;
    mainStore.currentPlayLyric = currentLyric.content;
    setScroll(currentLyric.time, listenScroll);
  } else {
    let currentLyric = rangeLyricList.value.get(time) as RangeLyricItem;
    if (currentLyric) {
      currentPlayLine.value = currentLyric.index;
      mainStore.currentPlayLyric = currentLyric.content;
      setScroll(currentLyric.time, listenScroll);
    }
  }

};

const handleScroll = (event: Event) => {
  if (!triggerScroll) return;
  if (mainStore.currentPlaySong.isNotLyric) return;
  const target = event.target as HTMLElement;
  triggerScroll = true;
  let { scrollTop } = target;
  const current = findLyricByScrollTop(scrollTop);

  if (!current) return;

  selectLyricLine.value = current;

  if (!mainStore.currentPlaySong?.isNotLyric) {
    showSelectLyric.value = true;
  }
  if (selectLyricLine.value?.index != undefined) {
    selectLyricLineIndex = selectLyricLine.value.index;
  }
  clearTimeout(timeId);
  timeId = setTimeout(() => {
    if (selectLyricLineIndex && selectLyricLineIndex !== currentPlayLine.value) {
      triggerPlayLyric = false;
      scrollTo(currentScrollTop, true);
    }
    selectLyricLine.value = null;
    showSelectLyric.value = false;
  }, 2500);
};
const handlePlayIconClick = () => {
  let time = selectLyricLine.value!.time;
  currentPlayLine.value = selectLyricLine.value!.index;
  selectLyricLineIndex = currentPlayLine.value;
  showSelectLyric.value = false;
  triggerScroll = false;
  selectLyricLine.value = null;
  obverser.emit('selectLyricPlay', time / 1000);
};
const handleWheel = (event: WheelEvent) => {
  event.preventDefault();
  let deltaY = event.deltaY;
  triggerScroll = true;
  let target;
  if (selectLyricLineIndex == 0 && deltaY < 0) return;
  if (selectLyricLineIndex == lyricChildrenValueList.length - 1 && deltaY > 0) return;
  if (deltaY > 0) {
    target = lyricChildrenValueList[selectLyricLineIndex + 1];
  } else {
    target = lyricChildrenValueList[selectLyricLineIndex - 1];
  }
  let moveDistance = target.height;

  let scrollTop: number = 0;

  if (deltaY > 0) {
    scrollTop = lyricContainerEle!.scrollTop + moveDistance;
  } else {
    scrollTop = lyricContainerEle!.scrollTop - moveDistance;
  }
  const current = findLyricByScrollTop(scrollTop);
  if (!current) return;
  lyricContainerEle!.scrollTop = Math.floor(scrollTop);
  clearTimeout(clearTriggerScrollTimer);
  clearTriggerScrollTimer = setTimeout(() => {
    triggerScroll = false;
  }, 500);
};
const initEleScrollTopMap = () => {
  if (!lyricContainer.value || !lyricData.value.length) return;
  eleScrollTopMap.clear();
  let children = Array.from(lyricContainer.value.children) as HTMLElement[];
  lyricChildrenValueList = children.map((child, index) => {
    return {
      offsetTop: child.offsetTop - gapHeight.value,
      index,
      time: +child.getAttribute('data-time')!,
      height: child.offsetHeight,
      middleTop: child.offsetHeight <= lyricItemHeight ? gapHeight.value + child.offsetHeight / 2 - lyricItemHeight / 2 : gapHeight.value - lyricItemHeight / 2
    };
  });

};
const findLyricByScrollTop = (scrollTop: number) => {
  if (!lyricChildrenValueList.length) return null;

  let left = 0;
  let right = lyricChildrenValueList.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midItem = lyricChildrenValueList[mid];
    const nextItem = lyricChildrenValueList[mid + 1] || { offsetTop: Infinity };

    if (scrollTop >= midItem.offsetTop && scrollTop < nextItem.offsetTop) {
      return { index: midItem.index, time: midItem.time, middleTop: midItem.middleTop };
    } else if (scrollTop < midItem.offsetTop) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  const lastItem = lyricChildrenValueList[lyricChildrenValueList.length - 1];
  return scrollTop >= lastItem.offsetTop ? { index: lastItem.index, time: lastItem.time, middleTop: lastItem.middleTop } : null;
};
const setScroll = (time: number, listen = false) => {
  let targetELe = document.querySelector(`#time${time}`) as HTMLElement;
  if (!targetELe) return;

  let top = targetELe!.offsetTop - gapHeight.value;
  if (mainStore.currentPlaySong?.tlyric) {
    top += lyricItemHeight;
  }
  if (targetELe) {
    currentScrollTop = top;
    ;
    scrollTo(currentScrollTop, listen);
  }
};
const scrollTo = (top: number, listen = false) => {
  triggerScroll = false;
  scrollBarRef.value?.scrollTo({ top: top, behavior: 'smooth' });
  if (listen) {
    listenScrollComplete(top, () => {
      obverser.emit('scrollComplete');
      triggerPlayLyric = true;
    });
  }

};
const createListenScrollComplete = (selector = '.scrollContainer > .n-scrollbar > .n-scrollbar-container', wait = 50) => {
  let scrollTargetEle: null | HTMLElement = null;
  let timer: any;
  return async (top: number, callback: () => void) => {
    await nextTick();
    if (!scrollTargetEle) {
      scrollTargetEle = document.querySelector(selector) as HTMLElement;
    }
    timer = setInterval(() => {
      if (scrollTargetEle?.scrollTop === top) {
        callback();
        clearInterval(timer);
      }
    }, wait);
  };
};
let listenScrollComplete = createListenScrollComplete();
watch(isHover, (val) => {
  if (!val) {
    showSelectLyric.value = false;
  } else {
    if (selectLyricLine.value && !mainStore.currentPlaySong?.isNotLyric) {
      showSelectLyric.value = true;
    } else {
      showSelectLyric.value = false;
    }
  }
});
watch(() => mainStore.currentPlaySong, async () => {
  currentScrollTop = 0;
  scrollTo(0, true);
  if (mainStore.showMusicDetail && !mainStore.currentPlaySong?.isNotLyric) {
    await nextTick();
    initEleScrollTopMap();
  }
});
watch(
  () => mainStore.showMusicDetail, async (val) => {
    if (val && eleScrollTopMap.size === 0 && !mainStore.currentPlaySong?.isNotLyric) {
      await nextTick();
      initEleScrollTopMap();
    }
    if (val) {
      setTimeout(() => {
        pendingSetScrollFn && pendingSetScrollFn();
      }, 500);
    } else {
      pendingSetScrollFn = null;
    }
  }, { immediate: true }
);

const loopMatchLyric = () => {
  let time = Math.round(audioEle!.currentTime * 1000);
  let currentLyric = rangeLyricList.value.get(time) as RangeLyricItem;
  if (mainStore.currentPlaySong?.yrcLyric && currentLyric?.words?.length) {
    let j = 1
    const children = currentLyric.words;
    while (j < children.length) {
      if (time < children[j].startTime) {
        break
      } else {
        j++
      }
    }
    j = j - 1;
    const percent = j / children.length;
    const wordPercent = ((time) - children[j].startTime) / (children[j].duration) * (1 / children.length)
    const keyStyle = `-webkit-linear-gradient(left, ${themeVars.value.primaryColor} ${percent * 100 + wordPercent * 100}%, rgb(100,100,99) 0%)`
    activeLyricStyle.value.backgroundImage = keyStyle;
  }
  animatingId = requestAnimationFrame(loopMatchLyric)
}

watch(() => mainStore.playing, (val) => {
  if (val) {
    animatingId = requestAnimationFrame(loopMatchLyric)
  } else {
    cancelAnimationFrame(animatingId)
  }
})
watch(
  lyricData, (val) => {
    if (val.length) {
      mainStore.currentPlayLyric = val[0].content;
    }
  }, { immediate: true }
);
obverser.on('updateLyricMaskStyle', ({ footerMaskStyle, topMaskStyle }) => {
  footerMaskBackground.value = footerMaskStyle;
  topMaskBackground.value = topMaskStyle;

});
onMounted(() => {
  obverser.on('timeUpdate', handlePlayLyric);
  obverser.on('slideValueChange', handleSliderChange);
  audioEle = document.querySelector('#audioEle')
  lyricContainerEle = document.querySelector('.scrollContainer > .n-scrollbar > .n-scrollbar-container')
  obverser.on('ended', () => {
    currentScrollTop = 0;
    scrollTo(0, true);
  });
});


</script>

<template>
  <div ref="scrollContainerRef" class="relative mt-10 scrollContainer"> <n-scrollbar ref="scrollBarRef"
      :style="{ height: containerHeight + 'px', }" :on-scroll="handleScroll" @wheel="handleWheel">
      <div :style="{ height: gapHeight + 'px' }" />
      <div v-if="!mainStore.currentPlaySong?.isNotLyric" ref="lyricContainer">
        <div v-for="(item, index) in lyricData" :id="'time' + item.time" :key="index" class="text-center lyric-item"
          :data-time="item.time">
          <div class="cur-lrc"
            :style="mainStore.currentPlaySong?.yrcLyric && lyricData[index].words ? currentPlayLine == index ? activeLyricStyle : {} : currentLyricStyle(index)">
            <p :style="currentLyricStyle(index)" class="transition-color">
              {{ item.content }}
            </p>
            <p v-if="item.translateContent" :style="currentLyricStyle(index)" class="transition-color">
              {{ item.translateContent }}
            </p>
          </div>
        </div>
      </div>
      <div v-else class="text-center opacity-40">
        暂无歌词...
      </div>
      <div :style="{ height: gapHeight + 'px' }" />
    </n-scrollbar>
    <div v-if="showSelectLyric" class="selectLyricContainer"
      :style="{ top: selectLyricLine.middleTop + 'px', height: lyricItemHeight + 'px' }">
      <div class="flex items-center">
        <n-time v-if="selectLyricLine" format="mm:ss" :time="selectLyricLine?.time" />
        <div class="ml-2  bg-gradient-to-r from-gray-300 dark:from-gray-500 line" />
      </div>

      <div class="flex items-center">
        <div class="mr-2 bg-gradient-to-l  from-gray-300 dark:from-gray-500 line" />
        <n-button style="font-size: 24px">
          <n-icon :component="PlayArrowSharp" :size="20" @click="handlePlayIconClick" />
        </n-button>

      </div>
    </div>
    <div class="top-mask" :style="topMaskBackground" />
    <div class="footer-mask" :style="footerMaskBackground" />
  </div>
</template>

<style scoped lang="less">
.lyric-item {
  width: 500px;

  p {
    line-height: 35px;
    color: #646463;
  }
}

.footer-mask {
  position: absolute;
  width: 500px;
  height: 35px;
  bottom: 0px;
  pointer-events: none;
}

.top-mask {
  position: absolute;
  width: 500px;
  height: 35px;
  top: 0px;
  pointer-events: none;
}

.selectLyricContainer {
  position: absolute;
  width: 540px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.line {
  width: 60px;
  height: 1px;
}

.cur-lrc {
  display: inline-block;
  background-clip: text;
  -webkit-background-clip: text;
}
</style>
