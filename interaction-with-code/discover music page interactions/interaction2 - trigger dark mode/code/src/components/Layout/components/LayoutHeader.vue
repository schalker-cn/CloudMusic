<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import { Moon, SunnySharp } from '@vicons/ionicons5';

let mainStore = useMainStore();

const handleThemeSwitchUpdateChange = () => {
  mainStore.toggleTheme();
};
</script>
<template>
  <n-layout-header bordered class="flex justify-between items-center px-4 h-14 sm:px-3">
    <div class="flex">
      <span class=" truncate cursor-pointer">Music House</span>
      <layout-header-search />
    </div>
    <div class="flex items-center">
      <!-- entry to user data -->
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