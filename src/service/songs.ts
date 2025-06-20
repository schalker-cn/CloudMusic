import qs from 'qs';
import service from './request';
import { DAILY_SONG_MOCK } from '@/mocks/songMock';
import { USA_SONG_MOCK } from '@/mocks/songMock';
import { CHN_SONG_MOCK } from '@/mocks/songMock';
import { SONG_CHECK_MOCK } from '@/mocks/songMock';
import { LYRIC_MOCK } from '@/mocks/lyricMock';
import placeholder from '@/assets/img/placeholder.png';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
export function getRecommendSong() {
    const modifiedData = {
    ...DAILY_SONG_MOCK,
    data: {
      ...DAILY_SONG_MOCK.data,
      dailySongs: DAILY_SONG_MOCK.data.dailySongs.map(song => ({
        ...song,
        al: {
          ...song.al,
          picUrl: placeholder
        }
      }))
    }
  };
  return Promise.resolve(modifiedData);
}
export function getTopSong(type: 0 | 7 | 96 | 8 | 16 = 0) {
  function withPlaceholder(data: typeof USA_SONG_MOCK | typeof CHN_SONG_MOCK) {
    return {
      ...data,
      data: data.data.map(song => ({
        ...song,
        album: {
          ...song.album,
          picUrl: placeholder,
          blurPicUrl: placeholder
        }
      }))
    };
  }

  function mockAxiosResponse(data: any): Promise<AxiosResponse> {
    const mockResponse: AxiosResponse = {
      data,
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

  if (type == 96) {
    return mockAxiosResponse(withPlaceholder(USA_SONG_MOCK));
  } else if (type == 7) {
    return mockAxiosResponse(withPlaceholder(CHN_SONG_MOCK));
  } else if (type == 0) {
    const mockedUSAData = withPlaceholder(USA_SONG_MOCK);
    const mockedCHNData = withPlaceholder(CHN_SONG_MOCK);
    const mergedData = {
      ...mockedCHNData,
      data: [...mockedCHNData.data, ...mockedUSAData.data]
    };
    return mockAxiosResponse(mergedData);
  } else {
    const emptyData = {
      data: [],
      code: 200
    };
    return mockAxiosResponse(emptyData);
  }
}
export function getSingerSong(id: number) {
  return service.get(`/artists?id=${id}`);
}
export function getLikeList(uid: number) {
  const query = qs.stringify({
    uid,
  });
  return service.get(`/likelist?${query}`);
}
export function getMusicUrl(id:string) {
  // 音乐evel standard => 标准,higher => 较高, exhigh=>极高, lossless=>无损, 
  //hires=>Hi-Res, jyeffect => 高清环绕声, sky => 沉浸环绕声, dolby => 杜比全景声, jymaster => 超清母带
  const query = qs.stringify({
    level:'standard',
    id
  });
  return service.get('/song/url/v1?'+query);
}
export function getLyric(id:string) {
  return service.get('/lyric?id='+id);
}
export function getNewLyric(id:string) {
  return LYRIC_MOCK.lyrics[0];
}
export function checkMusic(id: string) {

  const found = SONG_CHECK_MOCK.eligibleSongs.some(song => song.id === Number(id));

  if (found) {
    return Promise.resolve({
      data: {
        success: true,
        message: 'ok',
        code: 200
      }
    });
  } else {
    return Promise.resolve({
      data: {
        success: false,
        message: '亲爱的,暂无版权',
        code: 200
      }
    });
  }
}
export function getMusicComment(data:{
  id:string;
  limit?:number;
  offset?:number;
  before?:string;}) {
  const query = qs.stringify({
    ...data,
  });
  return service.get('/comment/music?'+query);
}
export function likeMusic(id:number, like:boolean) {
  return service.get(`/like?id=${id}&like=${like}`); 
}