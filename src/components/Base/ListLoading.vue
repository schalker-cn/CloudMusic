<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
export interface ListLoadingProps {
  wrapHeight?: string;
  strokeWidth?:number;
  show?:boolean;
  stroke?:string;
  description?:string;
  size?: 'small' | 'medium' | 'large';
  rotate?:boolean;
  loadMore?:(loadSuccess:() => void) => void;
  noMore:boolean,
}
const props = withDefaults(defineProps<ListLoadingProps>(), {
  wrapHeight: '40px',
  show: true,
  size: 'medium',
  strokeWidth: undefined,
  stroke: undefined,
  description: '',
  loadMore: () => {}
});
const loadingTarget = ref<HTMLElement | null>(null);
let loadStatus:'pending' | 'loading' | 'done' = 'pending';
let firstVisible = ref<boolean | undefined>();

let observerCallback = (entries:IntersectionObserverEntry[]) => {
  if (props.noMore) {
    loadingTarget.value && observer.disconnect();
    return; 
  }
  let visible = entries[0].isIntersecting;
  
  if (firstVisible.value === undefined) {
    firstVisible.value = visible;
  }

  if (firstVisible.value === false) {
    if (visible) {
      if (loadStatus === 'loading') return;
      loadStatus = 'loading';
      props.loadMore(() => {
        loadStatus = 'done';
      });
    }
  }
};
const observer = new IntersectionObserver(observerCallback);

onMounted(() => {
  loadingTarget.value && observer.observe(loadingTarget.value);
});
onUnmounted(() => {
  loadingTarget.value && observer.disconnect();
});
</script>
<template>
  <div
    v-if="!noMore" ref="loadingTarget"
    class="wrapLoading"
    :style="{display: firstVisible ? 'none' :'flex',height:wrapHeight}"
  >
    <n-spin
      :stroke-width="strokeWidth" :show="show" 
      :stroke="stroke" :description="description" :size="size"
    />
  </div>
  <n-divider v-else dashed>
    我也是有底线的!
  </n-divider>
</template>
<style scoped>
.wrapLoading {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
