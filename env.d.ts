import type { MessageApiInjection } from 'naive-ui/lib/message/src/MessageProvider';
/// <reference types="vite/client" />
export * from 'naive-ui/volar';
export { };

type localValue = 'zh-cn' | 'en';
declare global {
  interface Window {
    $message: MessageApiInjection;
  }
  interface ImportMeta {
    env: Record<string, string>
  }
}
declare module 'vue' {
  export interface Window {
    $message: MessageApiInjection;
  }
}
export type AnyObject = {
  [key: string]: any;
};

declare module 'rgbaster' {
  interface Opts {
    ignore?: string[];
    scale?: number;
    skipTransparentPixels?: boolean;
  }
  export default function (src: string, opts?: Opts): Promise<{
    color: string;
    count: number;
  }[]>;
  export { };
};
export type AudioIndexedData = {
  id: number;
  name: string;
  blob:Blob;
}
