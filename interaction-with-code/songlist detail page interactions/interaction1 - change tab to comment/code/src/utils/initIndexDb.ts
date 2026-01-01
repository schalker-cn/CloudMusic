

let request = indexedDB.open('audioDB', 1);
const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'
import { FFmpeg } from '@ffmpeg/ffmpeg'

import { fetchFile, toBlobURL } from '@ffmpeg/util'
const ffmpeg = new FFmpeg();
let currentResolve: () => void;
let isInit = false;

ffmpeg.on('log', ({ message: msg }: { message: string }) => {
  console.log('ffmpeg-message:' + msg);
})
ffmpeg.on('progress', (e) => {
  console.log('ffmpeg-progress:' + e);
});

let dbInstance: IDBDatabase | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
    } else {
      const request = indexedDB.open('audioDB', 1);
      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBRequest).result as IDBDatabase;
        resolve(dbInstance);
      };
      request.onerror = (event) => {
        reject(event);
      };
    }
  });
}


request.onupgradeneeded = function (event) {
  const db = (event.target! as IDBRequest).result as IDBDatabase;

  const store = db.createObjectStore('audioFiles', { keyPath: 'id' });
  store.createIndex('idIndex', 'id', { unique: true });
  store.createIndex('name', 'name', { unique: false });
};
export async function saveSong(data: { id: number, name: string, url: string }) {
  if (!isInit) {
    currentResolve = () => callback(data)
    return;
  };
  callback(data)
}
async function callback(data: { id: number, name: string, url: string }) {
 await ffmpeg.writeFile(`${data.name}.mp3`, await fetchFile(data.url));
  await ffmpeg.exec(['-i', `${data.name}.mp3`,'-strict','-2', '-c:a', 'opus', '-b:a', '48k', `${data.name}.opus`])
  const result = await ffmpeg.readFile(`${data.name}.opus`) as Uint8Array;
  storeOpusBlobData({
    blob: result,
    id: data.id,
    name: data.name,
  })
}
request.onsuccess = async function () {
  try {
    console.log('open db succeed');
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
  });
  isInit = true;
  console.log('ffmpeg init succeed');
  currentResolve && currentResolve();
  } catch (error) {
    console.log('ffmpeg load error',error);
  }
};

request.onerror = function (event) {
  const target = event.target as IDBRequest
  console.error('Database error:', target.error);
};

function storeOpusBlobData(data: { blob: Uint8Array, id: number, name: string }) {
  const transaction = dbInstance!.transaction(['audioFiles'], 'readwrite');
  const store = transaction.objectStore('audioFiles');

  const opusBlob = new Blob([data.blob], { type: 'audio/opus' });

  const audioData = {
    id: data.id,
    name: data.name,
    blob: opusBlob
  };

  const requestResult = store.put(audioData);

  requestResult.onsuccess = function () {
    console.log('OPUS audio data added to IndexedDB successfully');
  };

  requestResult.onerror = function (event) {
    const target = event.target as IDBRequest
    console.error('Error adding OPUS audio data to IndexedDB:', target.error);
  };
}
export function getOpusBlobDataByIdUsingIndex(id: number) {
  return new Promise((resolve, reject) => {
    if (id == undefined) return resolve(null);
    if (!dbInstance) return resolve(null);
    const transaction = dbInstance!.transaction(['audioFiles'], 'readonly');
    const store = transaction.objectStore('audioFiles');
    const index = store.index('idIndex');
    const requestResult = index.get(id);

    requestResult.onsuccess = function (event) {
      const result = (event.target! as IDBRequest).result as IDBDatabase;
      if (result) {
        resolve(result);
      } else {
        resolve(null);
      }
    };

    requestResult.onerror = function (event) {
      const target = event.target as IDBRequest
      reject(target.error);
    };
  });
}