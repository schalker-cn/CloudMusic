import qs from 'qs';
import service from './request';
import { DAILY_PLAYLIST_MOCK } from '@/mocks/playlistMock';
import { PLAYLIST_DETAIL_MOCK } from '@/mocks/playlistMock';
import { PLAYLIST_TRACK_MOCK } from '@/mocks/playlistMock';
import { COMMENT_MOCK } from '@/mocks/commentMock';
import { SIMILAR_PLAYLIST_MOCK } from '@/mocks/playlistMock';
import placeholder from '@/assets/img/placeholder.png';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
export function getTopPlayList({ cat = '全部', limit = 10, before = '' }) {
  return service.get(`/top/playlist/highquality?cat=${cat}&limit=${limit}&before=${before}`);
}
export function getTopPlayListTags() {
  return service.get('/playlist/highquality/tags');
}
export function getPersonalized() {
  const modifiedData = {
    ...DAILY_PLAYLIST_MOCK,
    result: DAILY_PLAYLIST_MOCK.result.map(playlist => ({
      ...playlist,
      picUrl: placeholder
    }))
  };
  return Promise.resolve(modifiedData);
}
export function getPlaylistDetail(id: string) {
  const matched = PLAYLIST_DETAIL_MOCK.playlist.find(item => item.id.toString() == id);
  matched.tracks.forEach(item => item.al.picUrl = placeholder);
  console.log(matched.tracks[0].al.picUrl);
  const mockResponse: AxiosResponse = {
    data: {
      code: PLAYLIST_DETAIL_MOCK.code,
      relatedVideos: PLAYLIST_DETAIL_MOCK.relatedVideos,
      playlist: matched || null,
      urls: PLAYLIST_DETAIL_MOCK.urls
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      headers: {},
      method: 'get',
      url: ``,
    } as InternalAxiosRequestConfig,
  };
  
  return Promise.resolve(mockResponse);
}
export function getPlaylistAllDetail(data:{
  id: string,
  limit?: number,
  offset?: number,
}) {
  const matched = PLAYLIST_TRACK_MOCK.track.find(item => item.id.toString() == data.id);
  matched.songs.forEach(item => item.al.picUrl = placeholder);
  const mockResponse: AxiosResponse = {
    data: {
      code: PLAYLIST_TRACK_MOCK.code,
      songs: matched.songs || [],
      privileges: matched.privileges || []
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      headers: {},
      method: 'get',
      url: ``,
    } as InternalAxiosRequestConfig,
  };

  return Promise.resolve(mockResponse);
}
export function updatePlaylistTags(data: {
  id: string,
  tags: string
}) {
  const query = qs.stringify({
    ...data,
    timestamp: Date.now()
  });
  return service.get('/playlist/tags/update?'+query);
}
export function updatePlayListInfo(data:{
  id:string;
  name:string;
  tags:string;
  desc:string;
}) {
  const query = qs.stringify({
    id: data.id,
    name: data.name,
    tags: data.tags,
    desc: data.desc,
    timestamp: Date.now()
  });
  return service.get('/playlist/update?'+query);
}
export function updatePlayListCover(
  file: File, imgSize:number, id:string
) {
  const formData = new FormData();
  formData.append('imgFile', file);
  const params = { timestamp: Date.now(), imgSize, id };
  const url = '/playlist/cover/update?'+qs.stringify(params);
  return service.post(
    url, formData, { headers: { 'Content-Type': 'multipart/form-data' } }
  );  
}
export function updatePlayListSubscribe(data:{
  id:string;
  t:number;// 1:收藏，2:取消收藏
}) {
  const query = qs.stringify({
    id: data.id,
    t: data.t,
    timestamp: Date.now()
  });
  return service.get('/playlist/subscribe?'+query);
}
export function getPlaylistComment(data:{
  id:string;
  limit?:number;
  offset?:number;
  before?:string;
}) {

  const matched = COMMENT_MOCK.songListComment.find(item => item.id.toString() == data.id);
  console.log('matched comment is: ', matched);
  const mockResponse: AxiosResponse = {
    data: {
      ...matched
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      headers: {},
      method: 'get',
      url: ``,
    } as InternalAxiosRequestConfig,
  };

  return Promise.resolve(mockResponse);
}
export function getSimilarPlaylist(id: string) {
  const updatedPlaylists = SIMILAR_PLAYLIST_MOCK.playlists.map(playlist => ({
    ...playlist,
    coverImgUrl: placeholder
  }));

  const response = {
    data: {
      ...SIMILAR_PLAYLIST_MOCK,
      playlists: updatedPlaylists
    }
  };

  return Promise.resolve(response);
}
export function getSimilarSong(id:string) {
  return service.get('/simi/song?id='+id);
}
export function updatePlaylistTracks(data:{
  tracks:number;
  pid:number;
  op:'add'|'del';// 1:添加，2:删除
}) {
  const query = qs.stringify({
    tracks: data.tracks,
    pid: data.pid,
    op: data.op,
    timestamp: Date.now()
  });
  return service.get('/playlist/tracks?'+query);
}
export function createPlaylist(data:{
  name:string;
  privacy?:string;// 默认否，传'10'则设置成隐私歌单
}) {
  const query = qs.stringify({
    name: data.name,
    privacy: data.privacy,
    timestamp: Date.now()
  });
  return service.get('/playlist/create?'+query);
}