import service from './request';
import qs from 'qs';
export function getUserInfo() {
  return service.get('/user/account');
}
export function getUserDetail(uid:string) {
  return service.get('/user/detail?uid='+uid);
}
export function signIn() {
  return service.post('/daily_signin?timestamp=' + Date.now()+'&type=1');
}
export function updateUserInfo(data:{
  nickname: string,
  signature?: string,
  gender:number;
  birthday?: number|string,
  province?: number|string,
  city?: number|string,
}) {
  const params = qs.stringify({
    ...data,
    timestamp: Date.now()
  });
  return service.get('/user/update?'+params);
}
export function updateUserAvatar(file: File, imgSize:number) {
  const formData = new FormData();
  formData.append('imgFile', file);
  const params = { timestamp: Date.now(), imgSize };
  const url = '/avatar/upload?'+qs.stringify(params);
  return service.post(
    url, formData, { headers: { 'Content-Type': 'multipart/form-data' } }
  );  
}
export function sendComment(data: {
  t:number;///1 发送, 2 回复 0 删除
  type: number, //0: 歌曲1: mv 2: 歌单 3: 专辑 4: 电台 5: 视频 6: 动态
  id: number, 
  content: string,
  commentId?: number
}) {
  const params = qs.stringify({
    ...data,
    timestamp: Date.now()
  });
  return service.get('/comment?'+params);
}
export function getUserPlaylist(uid:number) {
  return service.get('/user/playlist?uid='+uid);
}
export function likeComment(data:{
  t:number;// 是否点赞 1 为点赞 0 为取消点赞
  cid: number, 
  type: number, //0: 歌曲1: mv 2: 歌单 3: 专辑 4: 电台 5: 视频 6: 动态
  id: number, 
}) {
  const params = qs.stringify({
    ...data,
    timestamp: Date.now()
  });
  return service.get('/comment/like?'+params);
}
export function getLoginStatus() {
  return service.get('/login/status?timestamp='+Date.now());
}