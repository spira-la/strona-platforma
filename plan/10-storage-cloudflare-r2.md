# Storage - Cloudflare R2

## Por qué R2

- **Dominio ya está en Cloudflare** → configuración directa, sin DNS extra
- **Sin egress fees** → Firebase Storage y S3 cobran por descarga, R2 no
- **CDN integrado** → Cloudflare CDN gratis para servir assets
- **S3-compatible API** → el SDK de AWS S3 funciona directamente con R2
- **Custom domains** → servir desde media.spira-la.com o similar

## Arquitectura

```
Uploads → Backend (NestJS) → Cloudflare R2 (via S3 API)
                                    ↓
                            Cloudflare CDN → Usuario
```

## Configuración R2

### Dashboard de Cloudflare
1. Crear bucket: `spirala-media` (o `spirala-uploads`)
2. Configurar custom domain: `media.spira-la.com` → apunta al bucket
3. Crear API token con permisos R2

### Variables de entorno
```env
# R2 Storage
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_BUCKET_NAME=spirala-media
R2_PUBLIC_URL=https://media.spira-la.com
# Endpoint S3-compatible
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

## Backend - Servicio de storage

```typescript
// core/storage.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.get('R2_ENDPOINT'),
      credentials: {
        accessKeyId: config.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.get('R2_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = config.get('R2_BUCKET_NAME');
    this.publicUrl = config.get('R2_PUBLIC_URL');
  }

  async upload(path: string, file: Buffer, contentType: string): Promise<string> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: file,
      ContentType: contentType,
    }));
    return `${this.publicUrl}/${path}`;
  }

  async delete(path: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    }));
  }

  async getSignedUploadUrl(path: string, contentType: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(this.s3, new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      ContentType: contentType,
    }), { expiresIn });
  }

  async getSignedDownloadUrl(path: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(this.s3, new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    }), { expiresIn });
  }

  getPublicUrl(path: string): string {
    return `${this.publicUrl}/${path}`;
  }
}
```

## Estructura de archivos en R2

```
spirala-media/
├── images/
│   ├── blog/           # Cover images de blog posts
│   ├── coaches/        # Fotos de perfil de coaches
│   ├── services/       # Imágenes de servicios
│   └── general/        # Imágenes generales del sitio
├── invoices/
│   └── pdf/            # Facturas generadas
├── content/            # Para cuando se reactiven audio/ebooks
│   ├── audio/
│   └── ebooks/
└── uploads/            # Uploads temporales/generales
```

## Frontend - Upload directo (opcional)

Para uploads grandes, se puede usar presigned URLs para subir directo del browser a R2:

```typescript
// 1. Frontend pide URL firmada al backend
const { uploadUrl, publicUrl } = await api.getUploadUrl({ filename, contentType });

// 2. Frontend sube directo a R2
await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } });

// 3. Frontend usa publicUrl para mostrar la imagen
```

## Migración desde Firebase Storage

Si hay assets existentes en Firebase Storage de BeWonderMe:

```bash
# 1. Exportar de Firebase Storage
gsutil -m cp -r gs://bewonderme-d94a1.firebasestorage.app/ ./firebase-export/

# 2. Subir a R2 via rclone o wrangler
npx wrangler r2 object put spirala-media/ --file=./firebase-export/ --recursive

# 3. O usar rclone (más flexible)
rclone sync ./firebase-export/ r2:spirala-media/
```

## Dependencias npm

```json
{
  "@aws-sdk/client-s3": "^3.x",
  "@aws-sdk/s3-request-presigner": "^3.x"
}
```

Reemplaza:
- `@google-cloud/storage` (backend)
- `firebase/storage` (frontend)

## Procesamiento de imágenes

Sharp (que ya usa el backend) sigue funcionando igual. El flujo es:
1. Upload llega al backend
2. Sharp procesa/optimiza la imagen
3. Se sube a R2 el resultado
4. Se devuelve la URL pública

## Cache y CDN

Con Cloudflare como CDN frente a R2:
- **Cache automático** para assets públicos
- **Cache-Control headers** configurables por tipo de archivo
- **Transformaciones de imagen** con Cloudflare Images (opcional, $5/mo)
- **Custom cache rules** en Cloudflare dashboard si se necesita

## Comparación de costos

| | Firebase Storage | Cloudflare R2 |
|---|---|---|
| Storage | $0.026/GB | $0.015/GB |
| Egress | $0.12/GB | **$0.00/GB** |
| Operations | $0.05/10k | $0.0045/1M (class A) |
| CDN | No incluido | Incluido gratis |

Para un sitio con imágenes de blog + fotos de perfil, el costo de R2 será prácticamente $0.
