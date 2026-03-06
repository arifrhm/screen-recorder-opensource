import pkgcloud from 'pkgcloud';
import { IStorageProvider, StorageProviderOptions, UploadResult, UploadProgress } from '../interfaces/IStorageProvider';

export class OpenStackSwiftProvider implements IStorageProvider {
  private client: any;
  private container: string;

  constructor(config: {
    authUrl: string;
    username: string;
    password: string;
    tenantId?: string;
    region?: string;
    container: string;
  }) {
    this.client = pkgcloud.storage.createClient({
      provider: 'openstack',
      authUrl: config.authUrl,
      username: config.username,
      password: config.password,
      tenantId: config.tenantId,
      region: config.region,
    });
    this.container = config.container;
  }

  async createUpload(options: StorageProviderOptions): Promise<UploadResult> {
    const uploadId = options.uploadId || `upload_${Date.now()}`;
    const fileName = `uploads/${uploadId}/${uploadId}.mp4`;

    return {
      uploadId,
      url: await this.getSignedUrl(fileName),
      assetId: uploadId,
    };
  }

  async getUploadStatus(uploadId: string): Promise<{ status: string; assetId?: string }> {
    try {
      const fileName = `uploads/${uploadId}/${uploadId}.mp4`;
      const file = await this.client.getFile(this.container, fileName);
      return { status: 'ready', assetId: uploadId };
    } catch (error) {
      return { status: 'waiting' };
    }
  }

  async deleteAsset(assetId: string): Promise<void> {
    const files = await this.listFiles(assetId);
    for (const file of files) {
      await this.client.removeFile(this.container, file.name);
    }
  }

  async getSignedUrl(assetId: string, expiresIn: number = 3600): Promise<string> {
    const fileName = `uploads/${assetId}/${assetId}.mp4`;
    return await this.client.getSignedUrl({
      container: this.container,
      file: fileName,
      expires: expiresIn,
    });
  }

  async uploadFile(assetId: string, filePath: string, contentType: string = 'video/mp4'): Promise<void> {
    const fileName = `uploads/${assetId}/${assetId}.mp4`;
    const stream = await this.client.upload({
      container: this.container,
      remote: fileName,
      contentType,
    });

    stream.on('error', (err: Error) => {
      console.error('Upload error:', err);
    });

    stream.on('success', () => {
      console.log('Upload completed');
    });
  }

  private async listFiles(assetId: string): Promise<any[]> {
    const files: any[] = [];
    const stream = this.client.listFiles(this.container, {
      prefix: `uploads/${assetId}/`,
    });

    return new Promise((resolve, reject) => {
      stream.on('data', (file: any) => files.push(file));
      stream.on('end', () => resolve(files));
      stream.on('error', reject);
    });
  }
}
