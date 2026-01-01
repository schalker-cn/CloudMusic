<script setup lang="ts">
import { getPlaylistAllDetail, getPlaylistComment, getPlaylistDetail } from '@/service';
import type { AnyObject } from 'env';
import { formateNumber, getArrLast } from '@/utils';
import { computed, reactive, ref, toRaw, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LoadImg from '@/components/Base/LoadImg.vue';
import { StarOutline, Star, ShareSocialOutline, Search } from '@vicons/ionicons5';
import { useMainStore } from '@/stores/main';
import { useThemeVars } from 'naive-ui';
import { useMemorizeRequest } from '@/hook/useMemorizeRequest';
import { cloneDeep } from 'lodash';
import { markSearchKeyword } from '@/utils/markSearhKeyword';

let backTopEle: HTMLElement;
let songListIndexMap = new Map();
const route = useRoute();
const mainStore = useMainStore();
const songListDetail = ref<AnyObject>();
const songList = ref<any[]>([]);
const rawSongList = ref<any[]>([]);
const tabsValue = ref('musicList');
const commentValue = ref('');
const songListComment = ref<AnyObject>({});
const hasLoadAllSongsFished = ref(false);
const pageParams = reactive({
  pageCount: 10,
  page: 1,
  pageSize: 50
});

const themeVars = useThemeVars();
const commentBtnLoading = ref(false);
const subscribeBtnLoading = ref(false);
const searchKeyword = ref('');
const songListId = ref(route.params.id as string);
const isMySongList = computed(() => {
  return songListDetail.value
    && mainStore.userProfile
    && songListDetail.value?.userId === mainStore.userProfile?.profile?.userId;
});
const starButtonDisabled = computed(() => {
  return songListDetail.value
    && mainStore.userProfile
    && songListDetail.value?.userId === mainStore.userProfile?.profile?.userId;
});
const { wrapRequest: wrapFetchPlayList, requestLoading: isLoading, loadSuccess: loadPlayListSuccess, removeCache } = useMemorizeRequest(getPlaylistDetail, 'getPlaylistDetail');

const fetchSongListDetail = (id: string = route.params.id as string) => {
  wrapFetchPlayList(id).then((res: { data: { playlist: AnyObject }; }) => {
    let creator = res.data.playlist.creator;
    if (res.data.playlist.name === (creator?.nickname + '喜欢的音乐') && creator.userId === mainStore.userProfile?.profile.userId) {
      res.data.playlist.isMyLike = true;
      res.data.playlist.name = '我喜欢的音乐';
    } else {
      res.data.playlist.isMyLike = false;
    }
    songListDetail.value = res.data.playlist;
    fetchMusicList();
  }).finally(() => loadPlayListSuccess())
};
const { wrapRequest: wrapFetchPlayListComment, requestLoading: isCommentLoading, loadSuccess: loadPlayListCommentSuccess } = useMemorizeRequest(getPlaylistComment, 'getPlaylistComment');
const fetchSongListComment = (id: string = route.params.id as string) => {
  let params: {
    id: string; limit: number; offset: number; before?: string;
  } = {
    id,
    limit: pageParams.pageSize,
    offset: ((pageParams.page) - 1) * pageParams.pageSize
  };
  if (songListComment.value.total > 5000) {
    params.before = songListComment.value.comments[getArrLast(songListComment.value.comments)];
  }
  wrapFetchPlayListComment(params).then((res: { data: { [x: string]: any; total?: any; }; }) => {
    pageParams.pageCount = Math.round(res.data?.total || 1 / pageParams.pageSize) || 1;
    songListComment.value = res.data;
  }).finally(() => { loadPlayListCommentSuccess() })
};
const { wrapRequest, requestLoading, loadSuccess } = useMemorizeRequest(getPlaylistAllDetail, 'getPlaylistAllDetail');

const getMoreMusicList = async () => {
  let trackCount = songListDetail.value!.trackCount;
  let requestCount = Math.round((trackCount - 300) / 300);
  let requestList = [];
  for (let i = 1; i <= requestCount; i++) {
    let offset = 300 * i;
    requestList.push(getPlaylistAllDetail({ id: songListDetail.value!.id, offset: offset }));
  }
  Promise.allSettled(requestList).then((results: any[]) => {
    let allData = results.reduce((total: any[], item: { status: string; value: { data: { songs: any; }; }; }) => {
      if (item.status === 'fulfilled') {
        total = [...total, ...item.value.data.songs]
      }
      return total;
    }, [])
    let data = mainStore.mapSongListAddLike(allData);
    songList.value = songList.value.concat(data).map((item, index
    ) => ({ ...item, rawIndex: index }));
    rawSongList.value = cloneDeep(toRaw(songList).value);
    rawSongList.value.forEach((item: any, index: number) => {
      songListIndexMap.set(item.id, index);
    });
    hasLoadAllSongsFished.value = true;
  });
}
const fetchMusicList = (id: string = route.params.id as string) => {
  wrapRequest({ id }).then((res: { data: { code: number; songs: any[]; }; }) => {
    if (res?.data?.code === 200) {
      let data = mainStore.mapSongListAddLike(res.data.songs);
      songList.value = data.map((item, index
      ) => ({ ...item, rawIndex: index }));
      rawSongList.value = cloneDeep(toRaw(songList).value);
      rawSongList.value.forEach((item: any, index: number) => {
        songListIndexMap.set(item.id, index);
      });
      if (songListDetail.value!.trackCount > 100) {
        getMoreMusicList();
      } else {
        hasLoadAllSongsFished.value = true;
      }
    }
  }).finally(() => loadSuccess());
};
const searchSongList = (keyword: string) => {
  if (!keyword) {
    songList.value = toRaw(rawSongList.value);
  } else {
    let result = rawSongList.value.filter((item: any) => {
      return item.name.includes(keyword)
        || item.ar.some((ar: any) => ar.name.includes(keyword))
        || item.al.name.includes(keyword);
    }).map(item => {
      return { ...item, isSearch: true, index: songListIndexMap.get(item.id) };
    });
    songList.value = markSearchKeyword(
      result, ['name', 'formatAuthor', ['al', 'name']], keyword, themeVars.value.primaryColor
    );
  }

};
watch(() => route.params, (val) => {
  let id = val.id as string;
  if (!route.path.includes('edit') && id && route.path.includes('songList')) {
    songListId.value = id;
    fetchSongListDetail(id);
    fetchSongListComment();
  }
});
watch(pageParams, () => {
  backTopEle = document.querySelector('.n-back-top') as HTMLElement;
  backTopEle && backTopEle.click();
  fetchSongListComment();
});
watch(() => mainStore.likeSongs, (val, oldVal) => {
  if (val.length !== oldVal.length) {
    removeCache();
  }
});
watch(searchKeyword, (val) => {
  searchSongList(val);
});
fetchSongListDetail();
fetchSongListComment();
const handleShareClick = () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    window.$message.success('Share link copied to clipboard!');
  });
};
</script>
<template>
  <div class="p-8 pb-2">
    <n-spin :show="isLoading">
      <div v-if="songListDetail" class="flex justify-between">
        <load-img ref="imageRef" :has-hover-scale="false" class-name="w-52 h-52" :src="'https://dummyimage.com/1080x1080/0606fc/0606fc&text=1'" />
        <div class="flex-1 ml-8">
          <div class="flex items-center">
            <n-tag type="primary">
              Playlist
            </n-tag>
            <p class="ml-4 text-2xl font-bold ">
              {{ songListDetail.name}}
            </p>
          </div>
          <div class="mt-3 text-sm flex-items-center">
            <n-avatar :img-props="{ crossorigin: 'anonymous' }" round :size="30"
              :src="'https://dummyimage.com/1080x1080/0606fc/0606fc&text=1'" />
            <span class="pl-4 text-primary">{{ songListDetail.creator.nickname }}</span>
            <div class="ml-3 text-gray-600">
              <span>created on </span>
              <n-time :time="songListDetail.createTime" type="date" />
            </div>
          </div>
          <div class="mt-3">
            <n-space>
              <play-all-button :song-list="rawSongList" :song-list-id="songListId" />
              <n-button size="medium" round :disabled="starButtonDisabled" :loading="subscribeBtnLoading">
                <template #icon>
                  <n-icon :component="songListDetail.subscribed ? Star : StarOutline" />
                </template>
                {{ songListDetail.subscribed ? 'STARRED' : ' STAR' }}
                ({{ formateNumber(songListDetail.subscribedCount) }})
              </n-button>
              <n-button size="medium" round @click="handleShareClick">
                <template #icon>
                  <n-icon :component="ShareSocialOutline" />
                </template>
                SHARE
                ({{ formateNumber(songListDetail.shareCount) }})
              </n-button>
            </n-space>
          </div>
          <div class="mt-3">
            <div v-if="!songListDetail.isMyLike">
              <span>tags</span>
              <span class="px-1">:</span>
              <span class="cursor-pointer text-primary"> {{ songListDetail.tags.join(' / ') }} </span>
            </div>
            <div class="flex">
              <div>
                <span>song count</span>
                <span class="px-1">:</span>
                {{ songListDetail.trackCount }}
              </div>
              <div class="ml-4">
                <span>play count</span>
                <span class="px-1">:</span>
                {{ formateNumber(songListDetail.playCount) }}
              </div>
            </div>
            <div v-if="songListDetail.description" class="flex">
              <n-ellipsis expand-trigger="click" line-clamp="1" :tooltip="false">
                <span>description</span>
                <span class="px-1">:</span>
                {{ songListDetail.description }}
              </n-ellipsis>
            </div>
          </div>
        </div>
      </div>
      <div v-else style="height:200px" />
      <div :value="tabsValue" class="mt-5">
        <div class="flex justify-between sticky top-0 z-[999] pt-2">
          <n-tabs type="line" :value="tabsValue">
            <n-tab name="musicList" @click="tabsValue = 'musicList'">
              Song List
            </n-tab>
            <n-tab name="comment">
              Comment <span class="pl-1 text-sm">({{ songListComment?.total }})</span>
            </n-tab>
          </n-tabs>
          <div class="w-60" v-if="hasLoadAllSongsFished">
            <n-input v-model:value="searchKeyword" clearable size="small" placeholder="search in this list" round>
              <template #prefix>
                <n-icon class="cursor-pointer" :component="Search" />
              </template>
            </n-input>
          </div>
        </div>

        <div v-show="tabsValue === 'musicList'" class="mt-5">
          <music-list :song-list="songList" :raw-song-list="rawSongList" :loading="requestLoading"
            :play-list-id="songListId"/>
        </div>
      </div>
    </n-spin>
  </div>
</template>
<style scoped>
:deep(.n-card-header__main) {
  text-align: center;
}

:deep(.n-tabs .n-tabs-nav.n-tabs-nav--line-type .n-tabs-nav-scroll-content) {
  border: none;
}

.tag:hover {
  color: var(--n-color-target);
}
</style>
