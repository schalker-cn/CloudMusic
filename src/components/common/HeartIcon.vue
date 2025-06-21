<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import { HeartOutline, Heart } from '@vicons/ionicons5';
import { useThemeVars } from 'naive-ui';
import { NIcon } from 'naive-ui';
export interface HeartIconExpose{
  triggerLike:() => any;
}
const themeVars = useThemeVars();
const props = withDefaults(defineProps<{
  like:boolean;
  id:number;
  size?:number;
  triggerClick?:boolean;
  likeSuccess?:((like:boolean) => void) | null;
}>(), { size: 20, triggerClick: false, likeSuccess: null });
const mainStore = useMainStore();
const emit = defineEmits(['likeSuccess']);
const triggerLike = () => {
  if (!mainStore.isLogin) {
    return window.$message.error('please log in first');
  }
  return window.$message.success('liked this song');
};
const handleClick = () => {
  if (!props.triggerClick) {
    triggerLike();
  }
};
defineExpose({ triggerLike });

</script>

<template>
  <n-icon
    :size="size"
    :color="like ? themeVars.primaryColor : themeVars.textColor2"
    class="cursor-pointer"
    @click="handleClick"
  >
    <Transition name="scale" mode="out-in">
      <Heart v-if="like" />
      <HeartOutline v-else />
    </Transition>
  </n-icon>
</template>
