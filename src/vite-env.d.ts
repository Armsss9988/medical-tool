/// <reference types="vite/client" />

declare module 'qrcode' {
  export function toDataURL(text: string, options?: any): Promise<string>;
  export function toString(text: string, options?: any): Promise<string>;
  export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: any): Promise<void>;
}

interface ElectronAPI {
  readLocalData: (key: string) => Promise<any>;
  writeLocalData: (key: string, data: any) => Promise<{ success: boolean; path?: string; message?: string }>;
  openDataFolder: () => Promise<string | null>;
  getDataDirPath: () => Promise<string>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
