import { useMainStore } from '@/stores/main';

export default function useValidateVipSong(song: any) {
  const mainStore = useMainStore();
  if (song.fee === 1) {
    if (!mainStore.isLogin) {
      return window.$message.warning('eligible for VIP, please log in first');
    } else {
      if (mainStore.userProfile?.profile?.vipType === 0) {
        return window.$message.warning('eligible for VIP');
      }
    }
  }
  return undefined;
}