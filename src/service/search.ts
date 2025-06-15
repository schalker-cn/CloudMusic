import qs from 'qs';
import service from './request';
import { PLAYLIST_SEARCH_MOCK } from '@/mocks/playlistMock';
import { DEFAULT_KEYWORD_MOCK } from '@/mocks/searchMock';
import { SONG_SEARCH_MOCK } from '@/mocks/songMock';
import { SUGGEST_SEARCH_MOCK } from '@/mocks/searchMock';
// 默认搜索关键词
export function getDefaultSearchKeyword() {
  return Promise.resolve({
    data: {
      ...DEFAULT_KEYWORD_MOCK
    }
  });
}
// 热搜列表
export function getHotSearchList() {
    return Promise.resolve({
    data: {
      ...SUGGEST_SEARCH_MOCK
    }
  });
}
// 搜索建议
export function getSuggestSearchList(keyword: string) {
  return service.get(`/search/suggest?keywords=${keyword}`);
}
export interface SearchParams{
  keywords:string;// 关键词
  type:string;//1 单曲 1000歌单
  limit:number;// 返回数量
  offset?:number
}
//搜索
export function search(data:SearchParams) {
  if (data.type === '1000') {
    const matchedPlaylists = PLAYLIST_SEARCH_MOCK.result.playlists.filter(playlist =>
        playlist.name.toLowerCase().includes(data.keywords.toLowerCase())
    );

    return Promise.resolve({
        data: {
            code: PLAYLIST_SEARCH_MOCK.code,
            result: {
                playlistCount: matchedPlaylists.length,
                playlists: matchedPlaylists
            }
        }
    });
  } else if (data.type === '1') {
    const matchedSongs = SONG_SEARCH_MOCK.result.songs.filter(song =>
        song.name.toLowerCase().includes(data.keywords.toLowerCase())
    );
    return Promise.resolve({
        data: {
            code: PLAYLIST_SEARCH_MOCK.code,
            result: {
                songCount: matchedSongs.length,
                songs: matchedSongs
            }
        }
    });
  }
}