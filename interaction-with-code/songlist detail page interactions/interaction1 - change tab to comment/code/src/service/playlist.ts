import { DAILY_PLAYLIST_MOCK } from '@/mocks/playlistMock';
import { PLAYLIST_DETAIL_MOCK } from '@/mocks/playlistMock';
import { PLAYLIST_TRACK_MOCK } from '@/mocks/playlistMock';
import { COMMENT_MOCK } from '@/mocks/commentMock';
import { SIMILAR_PLAYLIST_MOCK } from '@/mocks/playlistMock';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
export function getPersonalized() {
  const modifiedData = {
    ...DAILY_PLAYLIST_MOCK,
    result: DAILY_PLAYLIST_MOCK.result.map(playlist => ({
      ...playlist,
      picUrl: "https://dummyimage.com/1080x1080/0606fc/0606fc&text=1"
    }))
  };
  return Promise.resolve(modifiedData);
}
export function getPlaylistDetail(id: string) {
  const matched = PLAYLIST_DETAIL_MOCK.playlist.find(item => item.id.toString() == id);
  matched.tracks.forEach(item => item.al.picUrl = "https://dummyimage.com/1080x1080/0606fc/0606fc&text=1");
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
  matched.songs.forEach(item => item.al.picUrl = "https://dummyimage.com/1080x1080/0606fc/0606fc&text=1");
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
export function getPlaylistComment(data:{
  id:string;
  limit?:number;
  offset?:number;
  before?:string;
}) {

  const matched = COMMENT_MOCK.songListComment.find(item => item.id.toString() == data.id);
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
    coverImgUrl: "https://dummyimage.com/1080x1080/0606fc/0606fc&text=1"
  }));

  const response = {
    data: {
      ...SIMILAR_PLAYLIST_MOCK,
      playlists: updatedPlaylists
    }
  };

  return Promise.resolve(response);
}