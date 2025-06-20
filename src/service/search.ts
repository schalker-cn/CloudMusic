import service from './request';
import { PLAYLIST_SEARCH_MOCK } from '@/mocks/playlistMock';
import { DEFAULT_KEYWORD_MOCK } from '@/mocks/searchMock';
import { SONG_SEARCH_MOCK } from '@/mocks/songMock';
import { SUGGEST_SEARCH_MOCK } from '@/mocks/searchMock';
export function getDefaultSearchKeyword() {
  return Promise.resolve({
    data: {
      ...DEFAULT_KEYWORD_MOCK
    }
  });
}
export function getHotSearchList() {
    return Promise.resolve({
    data: {
      ...SUGGEST_SEARCH_MOCK
    }
  });
}
export function getSuggestSearchList(keyword: string) {
  return service.get(`/search/suggest?keywords=${keyword}`);
}
export interface SearchParams{
  keywords:string;
  type:string;//1 单曲 1000歌单
  limit:number;
  offset?:number
}
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