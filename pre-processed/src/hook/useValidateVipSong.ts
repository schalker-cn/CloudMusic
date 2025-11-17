import { useMainStore } from '@/stores/main';

export default function useValidateVipSong(song: any) {
  const mainStore = useMainStore();
  // case: vip song
  if (song.fee === 1) {
    if (!mainStore.isLogin) {
      return window.$message.warning('eligible for VIP, please log in first');
    } else {
      // non-VIP user cannot play VIP song
      if (mainStore.userProfile?.profile?.vipType === 0) {
        return window.$message.warning('eligible for VIP');
      }
    }
  }
  return undefined;
}