<script setup lang="ts">
import { ThumbsUp, ThumbsUpFilled } from '@vicons/carbon';
import { CommentOutlined } from '@vicons/material';
import { computed, ref } from 'vue';
export interface CommentListProps {
  list: any[],
  title: string;
  resourceId: number;
  commentTotalNum?: string | number;
  type?: number;//资源类型0: 歌曲 1: mv2: 歌单3: 专辑4: 电台5: 视频6: 动态
}
const props = withDefaults(defineProps<CommentListProps>(), { type: 1, commentTotalNum: 0 });
const currentClickedComment = ref<any>();
const emit = defineEmits(['updateCommentList', 'updateCommentLiked']);

const commentPlaceholder = computed(() => {
  return currentClickedComment.value && 'reply: ' + currentClickedComment.value.user.nickname;
});

const handleUpdateCommentList = (comment: any) => {
  emit('updateCommentList', comment);
  currentClickedComment.value = null;
};
</script>
<template>
  <!-- comment block -->
  <p v-if="list.length" class="mt-10 text-base font-bold">
    {{ title }}
    <span v-if="commentTotalNum" class="text-sm">({{ commentTotalNum }})</span>
  </p>
  <div v-for="(item, index) in list" :key="item.id" class="flex mt-5">
    <n-avatar :img-props="{ crossorigin: 'anonymous' }" round :size="50" :src="'https://dummyimage.com/1080x1080/0606fc/0606fc&text=1'" />
    <div class="flex-1 pb-5 ml-4 border-0 border-b border-gray-200 dark:border-gray-200/20 border-solid">
      <div style="overflow-wrap: anywhere;">
        <span class="text-sky-500"> {{ item?.user.nickname }}：</span>
        <span>{{ item.content }}</span>
      </div>
      <div v-if="item.beReplied.length" style="overflow-wrap: anywhere;"
        class="p-2 mt-2 bg-stone-100 dark:bg-stone-100/10 rounded-md">
        <span class="text-sky-500">@{{ item.beReplied[0]?.user?.nickname }}：</span>
        <span>{{ item?.beReplied[0].content }}</span>
      </div>
      <div class="flex justify-between mt-2 text-xs opacity-60">
        <n-time :time="item.time" />
        <div class="flex items-center">
          <div class="flex items-center mr-4 cursor-pointer">
            <n-icon :component="item.liked ? ThumbsUpFilled : ThumbsUp" />
            <span class="pl-1">{{ item.likedCount }}</span>
          </div>
          <div class="pl-4 border-gray-300 dark:border-gray-300/50 cursor-pointer flex-items-center border-left">
            <n-icon :component="CommentOutlined" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>