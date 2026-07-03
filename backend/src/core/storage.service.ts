import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('R2_ENDPOINT');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('R2_BUCKET') ?? '';
    this.publicUrl = (this.config.get<string>('R2_PUBLIC_URL') ?? '').replace(
      /\/$/,
      '',
    );

    this.s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });
  }

  async upload(
    path: string,
    file: Buffer | Uint8Array | string,
    contentType: string,
  ): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: file,
        ContentType: contentType,
      }),
    );

    this.logger.debug(`Uploaded file: ${path}`);
    return this.getPublicUrl(path);
  }

  async delete(path: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }),
    );

    this.logger.debug(`Deleted file: ${path}`);
  }

  /**
   * Generates a GetObject presigned URL.
   * For private buckets use @aws-sdk/s3-request-presigner.
   * For public R2 buckets, this returns the public CDN URL directly.
   */
  getPublicUrl(path: string): string {
    return `${this.publicUrl}/${path}`;
  }

  /**
   * Streams a file from R2 and returns it as a Buffer.
   * Useful for server-side processing (e.g. PDF generation).
   */
  async download(path: string): Promise<Buffer> {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }),
    );

    if (!response.Body) {
      throw new Error(`Empty body for key: ${path}`);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
}
