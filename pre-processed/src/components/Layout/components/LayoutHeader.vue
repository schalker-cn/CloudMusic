<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import { Moon, SunnySharp } from '@vicons/ionicons5';
import { ArrowForwardIosRound } from '@vicons/material';
import { UserProfile } from '@vicons/carbon';
import { ExitToAppRound } from '@vicons/material';
import { ref } from 'vue';
import { onClickOutside } from '@vueuse/core';
import type { AnyObject } from 'env';
import { useRouter } from 'vue-router';

let mainStore = useMainStore();
const router = useRouter();
const popoverContainerRef = ref();
const userDetail = ref<AnyObject>();
const showUserPopover = ref(false);

onClickOutside(popoverContainerRef, (event: MouseEvent) => {
  let target = event.target as HTMLElement;
  if (!target.classList.contains('trigger')) {
    showUserPopover.value = false;
  }
});
const handleInfoEditClick = () => {
  console.log("edit button clicked.")
};
const handleThemeSwitchUpdateChange = () => {
  mainStore.toggleTheme();
};
const BackToDiscovery = () => {
  router.push('/discovery');
}
</script>
<template>
  <n-layout-header bordered class="flex justify-between items-center px-4 h-14 sm:px-3">
    <div class="flex">
      <span class=" truncate cursor-pointer" @click="BackToDiscovery">Music House</span>
      <layout-header-search />
    </div>
    <div class="flex items-center">
      <div v-if="mainStore.isLogin">
        <div v-if="mainStore.userProfile" class="flex items-center mr-2">
          <n-avatar :img-props="{ crossorigin: 'anonymous' }" round :size="30"
            :src="mainStore.userProfile?.profile?.avatarUrl" />
          <n-popover :show="showUserPopover" trigger="click" style="padding:0" display-directive="show">
            <template #trigger>
              <p class="pl-2 text-xs truncate opacity-80 hover:opacity-100 cursor-pointer w-30 trigger" @click="() => (userDetail && (showUserPopover = !showUserPopover))
                ">
                {{ mainStore.userProfile?.profile?.nickname }}
              </p>
            </template>
            <div ref="popoverContainerRef" style="width:300px">
              <div class="flex justify-evenly py-4">
                <div class="flex flex-col items-center">
                  <p class="text-lg font-bold">
                    {{ mainStore.userProfile?.profile.eventCount }}
                  </p>
                  Activities
                </div>
                <div>
                  <p class="text-lg font-bold">
                    {{ mainStore.userProfile?.profile?.follows }}
                  </p>
                  Friends
                </div>
                <div>
                  <p class="text-lg font-bold">
                    {{ mainStore.userProfile?.profile?.followeds }}
                  </p>
                  Fans
                </div>
              </div>
              <div
                class="mt-3 hover:bg-neutral-200/20 border-0 border-b border-gray-200  dark:border-gray-200/20 border-solid">
                <div class="flex justify-between items-center py-2 px-4 cursor-pointer" @click="handleInfoEditClick">
                  <div class="flex items-center text-base">
                    <n-icon :size="20" :component="UserProfile" />
                    <span class="ml-2">Personal Information Settings</span>
                  </div>
                  <n-icon :component="ArrowForwardIosRound" />
                </div>
              </div>
              <div
                class="hover:bg-neutral-200/20 border-0 border-b border-gray-200  dark:border-gray-200/20 border-solid">
                <n-popconfirm>
                  <template #trigger>
                    <div class="flex justify-between items-center py-2 px-4 cursor-pointer">
                      <div class="flex items-center text-base">
                        <n-icon :size="20" :component="ExitToAppRound" />
                        <span class="ml-2">Logout</span>
                      </div>
                      <n-icon :component="ArrowForwardIosRound" />
                    </div>
                  </template>
                  Are you sure to logout?
                </n-popconfirm>
              </div>
            </div>
          </n-popover>
        </div>
        <div v-else class="flex items-center mr-2">
          <n-skeleton width="30px" height="30px" round />
          <n-skeleton text style="width:100px;margin-left: 8px;" />
        </div>
      </div>
      <div class="flex items-center ml-2">
        <n-switch :value="mainStore.isActiveDarkTheme" size="large" :on-update:value="handleThemeSwitchUpdateChange">
          <template #checked-icon>
            <n-icon :component="Moon" />
          </template>
          <template #unchecked-icon>
            <n-icon :component="SunnySharp" />
          </template>
        </n-switch>
      </div>
    </div>
  </n-layout-header>
</template>
<style scoped>
:deep(.n-popover:not(.n-popover--raw):not(.n-popover--show-header)) {
  padding: 0 !important;
}
</style>