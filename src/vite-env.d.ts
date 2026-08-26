/// <reference types="vite/client" />

declare module 'qrcode' {
  export interface QRCodeRenderersOptions {
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H';
    version?: number;
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toDataURL(text: string, options?: QRCodeRenderersOptions): Promise<string>;
  export function toString(text: string, options?: QRCodeRenderersOptions): Promise<string>;
  export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRCodeRenderersOptions): Promise<void>;
}

interface ElectronAPI {
  readLocalData: <T>(key: string) => Promise<T | null>;
  writeLocalData: <T>(key: string, data: T) => Promise<{ success: boolean; path?: string; message?: string }>;
  openDataFolder: () => Promise<string | null>;
  getDataDirPath: () => Promise<string>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
