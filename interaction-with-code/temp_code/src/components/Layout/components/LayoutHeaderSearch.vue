<script setup lang="ts">
import { getDefaultSearchKeyword, getHotSearchList } from '@/service';
import { useMainStore } from '@/stores/main';
import { Search} from '@vicons/ionicons5';
import { Delete} from '@vicons/carbon';
import { ArrowBackIosSharp, ArrowForwardIosRound } from '@vicons/material';
import { useAsyncState, useElementHover } from '@vueuse/core';
import { useThemeVars } from 'naive-ui';
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue';
import { useRouter } from 'vue-router';
import { userHistory } from '../hook/useHistoryRoutePath';

const backIconRef = ref();
const forwardIconRef = ref();
const showPopover = ref(false);
const inputRef = ref();
const searchWrapContainerRef = ref();
const spread = ref(false);
const defaultHeight = ref('100%');
const historyListRef = ref<HTMLElement>();
const themeVars = useThemeVars();
const mainStore = useMainStore();
const backHover = useElementHover(backIconRef);
const forwardHover = useElementHover(forwardIconRef);
const { backPath, forwardPath } = userHistory();
const router = useRouter();
const { state: defaultSearchKeyWord } = useAsyncState(getDefaultSearchKeyword().then(res => res.data.data), {});
const { state: hotSearch, isLoading: hotSearchLoading } = useAsyncState(getHotSearchList().then(res => res.data.data), {});
const containerStyle = computed(() => {
  let hasLen = mainStore.searchKeyword.length > 0;
  let style: CSSProperties = {
    background: themeVars.value.modalColor, zIndex: 1000, width: hasLen
      ? '420px '
      : '384px'
  };
  if (hasLen) {
    style = {
      ...style,
      transition: 'width ease-in-out 0.3s'
    };
  }
  return style;
});

const arrowIconClass = (value: string) => {
  return value
    ? 'opacity-100 cursor-pointer'
    : 'opacity-50';
};
const historyListStyle = computed<CSSProperties>(() => {
  if (spread.value) {
    return { height: defaultHeight.value, overflow: 'visible' };
  }
  return {
    height: defaultHeight.value
      ? parseInt(defaultHeight.value) >= 62
        ? '62px'
        : '100%'
      : '100%', overflow: 'hidden'
  };
});
const handleCheckAllClick = () => {
  if (defaultHeight.value === '100%') return;
  spread.value = !spread.value;
};
watch([backHover, forwardHover], (value: boolean[]) => {
  let [backIsHover, forwardIsHover] = value;
  let backIconEle = (backIconRef.value as HTMLSpanElement);
  let forwardIconEle = (forwardIconRef.value as HTMLSpanElement);

  if (backPath.value) {
    backIsHover
      ? backIconEle.style.color = themeVars.value.primaryColor
      : backIconEle.style.color = '';
  } else {
    backIconEle.style.color = '';
  }
  if (forwardPath.value) {
    forwardIsHover
      ? forwardIconEle.style.color = themeVars.value.primaryColor
      : forwardIconEle.style.color = '';
  } else {
    forwardIconEle.style.color = '';
  }
});
const toSearchResult = (val?: string) => {
  if (!mainStore.searchKeyword && defaultSearchKeyWord.value?.realkeyword && !val) {
    mainStore.searchKeyword = defaultSearchKeyWord.value.realkeyword;
  }
  if (val) {
    mainStore.searchKeyword = val;
  }
  mainStore.addSearchHistory(mainStore.searchKeyword);
  showPopover.value = false;
  mainStore.setShowMusicDetail(false);
  router.push({
    path: '/searchResult',
    query: { keyword: mainStore.searchKeyword }
  });

};
const handleBodyClick = (ev: MouseEvent) => {
  if (!ev.composedPath().includes(inputRef.value) && !ev.composedPath().includes(searchWrapContainerRef.value)) {
    showPopover.value = false;
    spread.value = false;
  }
};
watch(showPopover, async (val) => {
  if (val && defaultHeight.value === '100%') {
    await nextTick();
    if (!historyListRef.value?.children[0]) return;
    defaultHeight.value = historyListRef!.value!.children[0]!.clientHeight + 'px';
  }
});
watch(() => mainStore.searchHistory, async () => {
  await nextTick();
  defaultHeight.value = historyListRef!.value!.children[0]!.clientHeight + 'px';
});
onMounted(() => {
  document.body.addEventListener('click', handleBodyClick);
});

onUnmounted(() => {
});
</script>
<template>
  <div class="flex items-center ml-8">
    <div ref="backIconRef" class="text-base">
      <n-icon :class="[arrowIconClass(backPath)]" :component="ArrowBackIosSharp" />
    </div>
    <div ref="forwardIconRef" class="ml-2 text-base">
      <n-icon :class="[arrowIconClass(forwardPath)]" :component="ArrowForwardIosRound" />
    </div>
  </div>
  <div class="relative w-50">
    <div ref="inputRef" class="wrapInput">
      <n-input ref="target" v-model:value="mainStore.searchKeyword" size="small" class="ml-5 headerSearchInput" round
        :placeholder="defaultSearchKeyWord.showKeyword" clearable @focus="showPopover = true">
        <template #prefix>
          <n-icon class="cursor-pointer" :component="Search" @click="() => toSearchResult()" />
        </template>
      </n-input>
    </div>
    <transition name="fade-in-scale-up">
      <div v-show="showPopover" ref="searchWrapContainerRef"
        class="absolute top-10 rounded-sm shadow-lg dark:shadow-black/60 origin-top-left searchWrapContainer"
        :style="containerStyle">
        <n-scrollbar style="max-height:500px">
          <!-- search history -->
          <div v-show="mainStore.searchHistory.length && !mainStore.searchKeyword.length" class="p-4 pb-0">
            <div class="flex justify-between items-center opacity-70">
              <div>
                <span class="pr-2">Search History</span>
                <n-icon class="cursor-pointer" :component="Delete" />
              </div>
              <n-button v-if="parseInt(defaultHeight) > 62" text @click="handleCheckAllClick">
                {{ spread ? 'eclipse' : 'show all' }}
              </n-button>
            </div>
            <div ref="historyListRef" class="mt-2 transition-height" :style="historyListStyle">
              <n-space>
                <n-tag v-for="(item, index) in mainStore.searchHistory" :key="item" closable size="small" round>
                  {{ item }}
                </n-tag>
              </n-space>
            </div>
          </div>
          <!-- top songs -->
          <div v-show="!mainStore.searchKeyword.length">
            <p class="pl-4 mt-4 opacity-70">
              Trending Songs
            </p>
            <n-spin :show="hotSearchLoading">
              <div v-show="hotSearchLoading" class="h-60" />
              <div v-for="(item, index) in hotSearch" :key="item.searchWord"
                class="flex items-center p-5 hover:bg-gray-100 dark:hover:bg-gray-100/20 cursor-pointer">
                <span class="text-base"
                  :style="{ color: index >= 0 && index <= 2 ? themeVars.primaryColor : themeVars.textColor1 }">
                  {{ index + 1 }}
                </span>
                <div class="ml-4">
                  <span :style="{ fontWeight: index >= 0 && index <= 2 ? 'bold' : 'initial' }"> {{ item.searchWord }}</span>
                  <span class="pl-2 text-sm opacity-40">{{ item.score }}</span>
                </div>
              </div>
            </n-spin>
          </div>
        </n-scrollbar>
      </div>
    </transition>
  </div>
</template>