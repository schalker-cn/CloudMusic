<script setup lang="ts">
import { getDefaultSearchKeyword, getHotSearchList } from '@/service';
import { useMainStore } from '@/stores/main';
import { Search} from '@vicons/ionicons5';
import { ArrowBackIosSharp, ArrowForwardIosRound } from '@vicons/material';
import { useAsyncState, useElementHover } from '@vueuse/core';
import { useThemeVars } from 'naive-ui';
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue';
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
const { state: defaultSearchKeyWord } = useAsyncState(getDefaultSearchKeyword().then(res => res.data.data), {});

const arrowIconClass = (value: string) => {
  return value
    ? 'opacity-100 cursor-pointer'
    : 'opacity-50';
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
          <n-icon class="cursor-pointer" :component="Search"/>
        </template>
      </n-input>
    </div>
    <transition name="fade-in-scale-up">
    </transition>
  </div>
</template>