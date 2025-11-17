<script setup lang="tsx">
import { registerRouteHook } from '@/router';
import { useMainStore } from '@/stores/main';
import { BackToTop, Music } from '@vicons/carbon';
import { QueueMusicFilled } from '@vicons/material';
import { SparklesOutline} from '@vicons/ionicons5';
import { NIcon, useLoadingBar } from 'naive-ui';
import { computed, onMounted, ref, watch, type CSSProperties, type VNodeChild } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import obverser from '@/utils/obverser';

const mainStore = useMainStore();
interface childrenMenuOptionItem extends MenuOptionItem {
  id: number;
}
type MenuOptionItem = {
  label: (() => VNodeChild) | string,
  key: string,
  icon?: () => VNodeChild,
  children?: childrenMenuOptionItem[]
}

const menuOptions = [
  {
    label: () => <RouterLink to='/discovery'>Discover Music</RouterLink>,
    key: '/discovery',
    icon: () => <NIcon component={SparklesOutline} />
  },
  {
    label: () => <RouterLink to='/latestMusic'>Newest Trend</RouterLink>,
    key: '/latestMusic',
    icon: () => <NIcon component={Music} />
  },
];

const route = useRoute();
const router = useRouter();
const loadingBar = useLoadingBar();

let collapsed = ref(false);
let scrollContainer: HTMLElement | null;
let activeKey = ref<string | null>('');
let hiddenLeftMenu = ref(false);
const myMenuOptions = ref<MenuOptionItem[]>(menuOptions);
const mainStyle = computed<CSSProperties>(() => {
  return {
    height: route.meta.hidden
      ? '100%'
      : 'calc(100vh - 69px - 56px)'
  };
});
const changeMenuOption = (myCreatePlayList: any[] = [], collectPlayList: any[] = []) => {
  if (!mainStore.isLogin) {
    myMenuOptions.value = [...menuOptions];
  }
};
const handlePlayListItemClick = (item: any) => {
  router.push(`/songList/${item.id}`);
};
watch(() => route.path, (newVal) => {
  activeKey.value = newVal;
  if (route.meta.hidden) {
    hiddenLeftMenu.value = true;
  } else {
    hiddenLeftMenu.value = false;
  }
});
watch(() => mainStore.userProfile, (val) => {
  let userId = mainStore.userProfile?.profile?.userId;
  if (val && userId) {
    fetchUserPlaylist(userId);
    fetchMyLikeMusicList(userId);
  } else {
    changeMenuOption();
  }
});
if (!mainStore.isLogin) {
  changeMenuOption();
}

const fetchUserPlaylist = (userId: number) => {
  window.$message.loading('loading playlist...');
};
const fetchMyLikeMusicList = (userId: number) => {

};
registerRouteHook((to) => {
  scrollContainer?.scrollTo({
    behavior: 'smooth',
    top: 0
  });
  if (to.meta.auth && !mainStore.isLogin) {
    window.$message.error('please log in first');
    return false;
  } else {
    loadingBar.start();
    return true;
  }

}, () => {
  loadingBar.finish();
});
const watchUpdateCollectPlayList = () => {
  obverser.on('updateCollectPlayList', (data: any) => {
    let { subscribed } = data;
    if (subscribed) {
      let songListDetail = data.songListDetail;
      myMenuOptions.value[1].children?.unshift({
        label: () => <span onClick={() => handlePlayListItemClick(songListDetail)}>{songListDetail.name}</span>,
        key: songListDetail.name,
        icon: () => <NIcon size={20} component={QueueMusicFilled}></NIcon>,
        id: songListDetail.id
      });
    } else {
      let id = data.id;
      let index = myMenuOptions.value[1].children?.findIndex((item: any) => item.id === +id);
      if (index) {
        myMenuOptions.value[1].children?.splice(index, 1);
      }
    }
  });
};
const watchUpdateMyCreatePlayList = () => {
  obverser.on('updateMyCreatePlayList', (data: any) => {
    myMenuOptions.value[0].children?.splice(
      1, 0, {
      label: () => <span onClick={() => handlePlayListItemClick(data)}>{data.name}</span>,
      key: data.name,
      icon: () => <NIcon size={20} component={QueueMusicFilled}></NIcon>,
      id: data.id
    }
    );
  });
};
onMounted(() => {
  scrollContainer = document.querySelector('.rightMain>.n-layout-scroll-container');
  watchUpdateCollectPlayList();
  watchUpdateMyCreatePlayList();
});
</script>
<template>
  <n-layout has-sider>
    <n-layout-sider v-show="!hiddenLeftMenu" bordered collapse-mode="width" :collapsed-width="64" :width="192"
      :style="mainStyle" :collapsed="collapsed" show-trigger @collapse="collapsed = true" @expand="collapsed = false">
      <n-menu v-model:value="activeKey" :collapsed="collapsed" :collapsed-width="64" :collapsed-icon-size="22"
        :options="myMenuOptions" :default-expand-all="true" />
    </n-layout-sider>
    <n-back-top :right="mainStore.backTopLeft" :bottom="220" :visibility-height="800">
      <n-icon :component="BackToTop" />
    </n-back-top>
    <n-layout :style="mainStyle">
      <router-view v-slot="{ Component }">
        <transition name="fade-transform" mode="out-in">
          <keep-alive>
            <div :key="route.name">
              <component :is="Component" />
            </div>
          </keep-alive>
        </transition>
      </router-view>
    </n-layout>
  </n-layout>
</template>
<style lang="less" scoped>
.n-layout-sider {
  transition: color 0.3s var(--n-bezier), border-color 0.3s var(--n-bezier),
    min-width 0.3s var(--n-bezier), max-width 0.3s var(--n-bezier), width 0.3s var(--n-bezier),
    transform 0.3s var(--n-bezier), background-color 0.3s var(--n-bezier);
}

:deep(.n-submenu-children > .n-menu-item > .n-menu-item-content) {
  padding-left: 40px !important;
}
</style>
