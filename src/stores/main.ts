import { checkMusic, getMusicUrl, getNewLyric } from '@/service';
import { formateSongsAuthor, getNextIndex, getPrevIndex } from '@/utils';
import type { AnyObject } from 'env';
import { cloneDeep, isUndefined, shuffle } from 'lodash';
import { darkTheme } from 'naive-ui';
import { defineStore } from 'pinia';
import state, { type playMode } from './state';

export const useMainStore = defineStore({
  id: 'main',
  state: () => state,
  getters: {
    activeTheme(state) {
      return state.theme === 'dark'
        ? darkTheme
        : null;
    },
    isActiveDarkTheme(state) {
      return state.theme === 'dark';
    },
    likeSongsIndexMap(state) {
      const map: { [key: number]: number } = Object.create(null);
      state.likeSongs.forEach((item: number, index: number) => {
        map[item] = index;
      });
      return map;
    },
    currentPlaySong(state) {
      return state.playList[state.currentPlayIndex];
    },
    playListCount(state) {
      return state.playList.length;
    },
    isDark(state) {
      return state.theme === 'dark';
    }
  },
  actions: {
    toggleTheme() {
      const theme = this.theme === 'dark'
        ? 'light'
        : 'dark';
      this.changeTheme(theme);
    },
    changeTheme(theme: 'dark' | 'light') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = '';
      }
      this.theme = theme;
      localStorage.theme = theme;
    },
    initDocumentTheme() {
      if (this.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = '';
      }
    },
    setLikeList(data: number[]) {
      this.likeSongs = data;
      localStorage.likeSongs = JSON.stringify(data);
    },
    removeLikeList(id: number) {
      this.likeSongs = this.likeSongs.filter((item: number) => item !== id);
      localStorage.likeSongs = JSON.stringify(this.likeSongs);
    },
    removeAllLikeList() {
      this.likeSongs = [];
      localStorage.likeSongs = JSON.stringify(this.likeSongs);
    },
    addLikeList(id: number) {
      this.likeSongs.push(id);
      localStorage.likeSongs = JSON.stringify(this.likeSongs);
    },
    hasLikeSong(id: number) {
      return !!this.likeSongs[this.likeSongsIndexMap[id]];
    },
    updatePrimaryColorMap(id:string,color:string){
      this.primaryColorMap[id] = color;
      localStorage.primaryColorMap = JSON.stringify(this.primaryColorMap);
    },
    mapSongListAddLike(data: any[]) {
      return data.map((item, index) => {
        if (this.likeSongs) {
          const hasLike = this.hasLikeSong(item.id);
          item.like = hasLike;
        } else {
          item.like = false;
        }
        item.formatAuthor = item.ar ? formateSongsAuthor(item.ar) :'';
        item.key = index;
        return item;
      });
    },
    async initPlayList(
      data: any[], index = 0, playListId: string,message?:string
    ) {
      if (!data[index]?.url) {
        console.log('init step: song ' + index + ' has no url');
        const res = await this.setMusicData({ data, id: data[index]?.id, index: index });
        if (!res.success) return;
      }
      this.playList = data;
      this.initPlayListPrevAndNextIndex();
      localStorage.rawPlayList = JSON.stringify(cloneDeep(this.playList));
      this.currentPlayIndex = index;
      this.playListIdList = [playListId];
      this.currentPlayListId = playListId;
      localStorage.currentPlayIndex = index;
      localStorage.playListIdList = JSON.stringify(this.playListIdList);
      localStorage.playList = JSON.stringify(this.playList);
      localStorage.currentPlayListId = playListId;
      if (this.playMode === 'random') {
        this.shufflePlayList();
      }
      this.changePlaying(true);
    },
    resetPlayList() {
      this.playList = [];
      this.playListIdList = [];
      this.currentPlayIndex = 0;
      localStorage.currentPlayIndex = 0;
      localStorage.playList = JSON.stringify(this.playList);
      localStorage.playListIdList = JSON.stringify(this.playList);
      localStorage.currentPlayListId = '';
      this.currentPlayListId = '';
      this.playMode = 'order';
    },
    addPlaylist(list: any[], id: string) {
      this.playList = [...this.playList, ...list];
      this.playListIdList.push(id);
      localStorage.playList = JSON.stringify(this.playList);
    },
    async changePlayIndex(index: number) {
      let target = this.playList[index];
      console.log('process song with id: ' + target.id + ", the fee is: " + target.fee);
      if (target['fee'] === 0) {
        return window.$message.warning('No audio source for this song');
      }
      
      if (target && !target.url) {
        console.log('no url for ' + target.id);
        const res = await this.setMusicData({ data: this.playList, id: target.id, index, });
        if (!res.success) return { success: false };
      } else {
        console.log('has url with id:' + target.id);
      }
      if (this.playMode === 'random' && target.id) {
        let index = this.playList.findIndex(item => item.id === target.id);
        this.currentPlayIndex = index;
        localStorage.currentPlayIndex = index;
      } else {
        this.currentPlayIndex = target ? this.playList.findIndex(item => item.id === target.id) : index;
        localStorage.currentPlayIndex = this.currentPlayIndex;
      }
      localStorage.playList = JSON.stringify(this.playList);
      this.changePlaying(true);
    },
    changePlayMode(mode: playMode) {
      this.playMode = mode;
      localStorage.playMode = mode;
      if (mode === 'random') {
        this.shufflePlayList();
      } else {
        const currentPlaySong = cloneDeep(this.currentPlaySong);
        const rawPlayList = JSON.parse(localStorage.rawPlayList) as any[];
        const newCurrentPlayIndex = rawPlayList.findIndex(item => item.id === currentPlaySong.id);
        rawPlayList[newCurrentPlayIndex] = currentPlaySong;
        this.playList = rawPlayList;
        this.initPlayListPrevAndNextIndex();
        this.currentPlayIndex = newCurrentPlayIndex;
        localStorage.currentPlayIndex = this.currentPlayIndex;
        localStorage.playList = JSON.stringify(rawPlayList);
      }
    },
    changePlaying(playing: boolean) {
      this.playing = playing;
    },
    async toggleNext(index?: number) {
      let nextIndex;
      if (!isUndefined(this.currentPlaySong.nextIndex)) {
        nextIndex = this.currentPlaySong.nextIndex
      } else {
        nextIndex = isUndefined(index) ? getNextIndex(this.currentPlayIndex, this.playListCount - 1) : index
      }
      this.currentPlayIndex = nextIndex;
      localStorage.currentPlayIndex = nextIndex;
      localStorage.playList = JSON.stringify(this.playList);
      this.changePlaying(true);
     
    },
    async togglePrev(index?: number) {
      let prevIndex;
      if (!isUndefined(this.currentPlaySong.prevIndex)) {
        prevIndex = this.currentPlaySong.prevIndex
      } else {
        prevIndex = isUndefined(index) ? getNextIndex(this.currentPlayIndex, this.playListCount - 1) : index
      }
    
      this.currentPlayIndex = prevIndex;
      localStorage.currentPlayIndex = prevIndex;
      localStorage.playList = JSON.stringify(this.playList);
      this.changePlaying(true);
      return { success: true };
    },
    async insertPlay(value: any) {
      const index = this.playList.findIndex(item => item?.id === value.id);
      value.like = this.hasLikeSong(value.id);
      if (index === -1) {
        this.playList.splice(
          this.currentPlayIndex + 1, 0, value
        );
        const insertIndex = this.playList.findIndex((item: any) => item.id === value.id);
        localStorage.playList = JSON.stringify(this.playList);
        localStorage.rawPlayList = JSON.stringify(cloneDeep(this.playList));
        this.changePlayIndex(insertIndex, value);
        this.initPlayListPrevAndNextIndex();
      } else {
        this.changePlayIndex(index, value);
      }
    },
    updatePlayListLike(like: boolean, index?: number) {
      const resultIndex = index
        ? index
        : this.currentPlayIndex;
      this.playList[resultIndex].like = like;
      localStorage.playList = JSON.stringify(this.playList);
    },
    async setMusicData(options: {
      data: any[], id: string, index: number, message?: string;
      showMessage?: boolean;
    }): Promise<any> {
      const { data, id, index, message = 'no copyright, skip this song', showMessage = true } = options;
      const result: AnyObject = {};
      showMessage && window.$message.loading('fetching song data..', { duration: 0 });
      try {
        const checkRes = await checkMusic(id) as any;
        console.log('check music result: ' + checkRes.data.code + ' , id: ' + id);
        if (!checkRes.musicSuccess && !checkRes?.data?.success) {
          window.$message.destroyAll();
          showMessage && window.$message.info(message);
          return { success: false };
        }
      } catch (error: any) {
        window.$message.destroyAll();
        if (error.response) {
          console.log('wrong code:', error.response.status);
          console.log('wrong data:', error.response.data);
          
          showMessage && window.$message.info(error.response.data.message);
        } else if (error.request) {
          console.log('the request has no response:', error.request,showMessage);
          showMessage && window.$message.info('error fetching data');
        } else {
          console.log('error log:', error.message);
          showMessage && window.$message.info('no copyright');
        }
        return { success: false };
      }
      const res = await getMusicUrl(id);
      if (res.data.code === 200) {
        result.url = res.data.data[0].url + '?id=' + id;
      } else {
        showMessage && window.$message.error('cannot fetch song url!');
        return { success: false };
      }
      const lyricRes = await getNewLyric(id);
      if (res.data.code === 200) {
        result.lyric = lyricRes.data?.lrc?.lyric;
        if (result.lyric.includes('no lyrics') || !result.lyric) {
          result.isNotLyric = true;
        } else {
          result.isNotLyric = false;
        }
        result.tlyric = lyricRes.data?.tlyric?.lyric;
        if(lyricRes.data?.yrc?.lyric){
          result.yrcLyric = lyricRes.data?.yrc?.lyric;
        }
      } else {
        console.log('failed to fetch lyrics');
        window.$message.error('failed to fetch lyrics');
      }
      result.isLoading = false;
      window.$message.destroyAll();
      showMessage && window.$message.success('successfully fetched lyrics');
      data[index] = {
        ...data[index],
        ...result
      };
      return { success: true };
    },
    setMySubscribeSongList(list: any[]) {
      this.mySubscribeSongList = list;
      localStorage.mySubscribeSongList = JSON.stringify(list);
    },
    addSearchHistory(value: string) {
      if (this.searchHistory.includes(value)) {
        return;
      }
      this.searchHistory.push(value);
      localStorage.searchHistory = JSON.stringify(this.searchHistory);
    },
    removeSearchHistory(index: number) {
      this.searchHistory.splice(index, 1);
      localStorage.searchHistory = JSON.stringify(this.searchHistory);
    },
    clearSearchHistory() {
      this.searchHistory = [];
      localStorage.searchHistory = JSON.stringify([]);
    },
    setShowMusicDetail(value: boolean) {
      this.showMusicDetail = value;
    },
    toggleShowMusicDetail() {
      this.showMusicDetail = !this.showMusicDetail;
    },
    initPlayListPrevAndNextIndex() {
      const max = this.playListCount - 1;
      this.playList.forEach((item, index) => {
        const nextIndex = getNextIndex(index, max);
        const prevIndex = getPrevIndex(index, max);
        item.nextIndex = nextIndex;
        item.prevIndex = prevIndex;
      });
      localStorage.playList = JSON.stringify(this.playList);
    },
    shufflePlayList() {
      const currentPlaySong = cloneDeep(this.currentPlaySong);
      const shufflePlayList = shuffle(cloneDeep(this.playList));
      const newCurrentPlayIndex = shufflePlayList.findIndex(item => item.id === currentPlaySong.id);
      shufflePlayList.splice(newCurrentPlayIndex, 1);
      shufflePlayList.unshift(currentPlaySong);
      this.playList = shufflePlayList;
      this.initPlayListPrevAndNextIndex();
      this.currentPlayIndex = 0;
      localStorage.currentPlayIndex = 0;
      localStorage.playList = JSON.stringify(shufflePlayList);
    }
  }
});