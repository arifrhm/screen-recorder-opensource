export interface UploadResult {
  uploadId: string;
  url: string;
  assetId?: string;
}

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

export interface StorageProviderOptions {
  uploadId: string;
  corsOrigin?: string;
  onProgress?: (progress: UploadProgress) => void;
}

export interface IStorageProvider {
  createUpload(options: StorageProviderOptions): Promise<UploadResult>;
  getUploadStatus(uploadId: string): Promise<{ status: string; assetId?: string }>;
  deleteAsset(assetId: string): Promise<void>;
  getSignedUrl(assetId: string, expiresIn?: number): Promise<string>;
}
