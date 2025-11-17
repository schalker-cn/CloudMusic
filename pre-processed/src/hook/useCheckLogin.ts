import { useMainStore } from './../stores/main';
export function userCheckLogin(callback:() => void, message='please log in first') {
  const mainStore = useMainStore();
  if (!mainStore.isLogin) {
    window.$message.error(message);
  } else {
    callback();
  }
}