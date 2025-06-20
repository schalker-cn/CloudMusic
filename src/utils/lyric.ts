interface MetaItem {
  t: number;
  c: { tx: string }[];
}
function paseMetaData(lyric: string) {
  const metaReg = /{.*?"t":\s*(\d+)(?!.*?"tx":\s*"").*?"c":\s*(\[\{.*?\}\])/g;
  const metadata: MetaItem[] = [];
  let metaMatch;
  while ((metaMatch = metaReg.exec(lyric)) !== null) {
    const time = Number(metaMatch[1]); 
    const contentJson = metaMatch[2]; 
    try {
      const metaItem = {
        t: time,
        c: JSON.parse(contentJson)
      };
      if (contentJson) {
        metadata.push(metaItem);
      }
    } catch (error) {
      console.error('Error parsing meta data:', error);
    }
  }
  return metadata
}
export function parseLyric(lrc: string, yrcLyric?: string): LyricItem[] {

  let lrcObj: LyricItem[] = [];
  let yrcLyricResult: string | any[] = [];
  const metadata = paseMetaData(lrc);
  
  let metaResult = metadata.map(item => {
    const { t, c } = item;
    let content: string = '';
    c.forEach(item => {
      content += item.tx
    });
    return {
      time: t,
      content,
      translateContent: ''
    }
  });

  if (yrcLyric) {
    yrcLyricResult = parseLyricWithWords(yrcLyric);
    return [...metaResult, ...yrcLyricResult];
  } else {
    lrcObj = parseBaseLyric(lrc);
    return [...metaResult, ...lrcObj];
  }


}

export function parseBaseLyric(lyric: string) {
  const lyrics = lyric.split('\n');
  let lrcObj: LyricItem[] = [];
  for (let i = 0; i < lyrics.length; i++) {
    const lyric = decodeURIComponent(lyrics[i]);
    const timeReg = /\[\d*:\d*((\.|:)\d*)*\]/g;
    const timeRegExpArr = lyric.match(timeReg);

    if (!timeRegExpArr) continue;
    const content = lyric.replace(timeReg, '');
    for (let k = 0, h = timeRegExpArr.length; k < h; k++) {
      const t = timeRegExpArr[k];

      const min = Number(String(t.match(/\[\d*/i)).slice(1));
      let sec: number;
      const secondMatch = t.match(/:(\d{2}\.\d*)/);
      if (secondMatch) {
        sec = +secondMatch[1];
      } else {
        sec = 0;
      }
      const newTime = Math.round(min * 60 * 1000 + sec * 1000);
      if (content !== '') {
        lrcObj.push({
          time: newTime, content,
        });
      }
    }
  }
  return lrcObj.map((item, index) => ({ ...item, index: index }))
}

export function parseRangeLyric(lyricList: LyricItem[]) {
  const map = new Map<number, RangeLyricItem>();
  let currentIndex = 0;
  let nextIndex = 1;

  if (lyricList[currentIndex]?.time !== 0 && lyricList[currentIndex]?.content !== 'No lyrics for this song') {
    lyricList.unshift({
      ...lyricList[currentIndex],
      time: 0
    });
  }
  while (currentIndex !== lyricList.length - 1) {
    const cur = lyricList[currentIndex];
    const next = lyricList[nextIndex];
    for (let start = cur.time; start < next.time; start++) {
      map.set(start, {
        ...cur,
        index: currentIndex
      });
    }
    if (next) {
      currentIndex++;
      nextIndex++;
    }
    if (currentIndex === lyricList.length - 1) {
      map.set(next.time, {
        ...next,
        index: currentIndex
      });
    }
  }
  return map;
}
export interface LyricItem {
  time: number;
  content: string;
  translateContent?: string;
  lineStartTime?: number, lineDuration?: number, words?: WordData[],
  index?: number,
}
export interface RangeLyricItem extends LyricItem {
  index: number;
}

interface WordData {
  content: string;
  startTime: number;
  duration: number;
}

export function parseLyricWithWords(input: string): { lineStartTime: number, lineDuration: number, words: WordData[], index: number }[] {
  const result: { lineStartTime: number, lineDuration: number, words: WordData[], content: string, time: number, index: number }[] = [];

  const lineRegex = /\[(\d+),(\d+)\]/g;

  const wordTimeRegex = /\((\d+),(\d+),\d+\)([^\(\)\n]+)/g;

  let lineMatch;
  let index = 0;
  while ((lineMatch = lineRegex.exec(input)) !== null) {
    const lineStartTime = parseInt(lineMatch[1]);
    const lineDuration = parseInt(lineMatch[2]);

    const lineContent = input.slice(lineRegex.lastIndex, input.indexOf('\n', lineRegex.lastIndex) !== -1 ? input.indexOf('\n', lineRegex.lastIndex) : undefined).trim();

    const words: WordData[] = [];
    let wordMatch;

    while ((wordMatch = wordTimeRegex.exec(lineContent)) !== null) {
      const wordStartTime = parseInt(wordMatch[1]);
      const wordDuration = parseInt(wordMatch[2]);
      const wordContent = wordMatch[3];

      if (wordStartTime >= lineStartTime && wordStartTime < (lineStartTime + lineDuration)) {
        words.push({ content: wordContent, startTime: wordStartTime, duration: wordDuration });
      }
    }

    result.push({
      lineStartTime,
      lineDuration,
      words,
      time: lineStartTime,
      index,
      content: words.map(item => item.content).join('')
    });
    index++;
  }

  return result;
}
