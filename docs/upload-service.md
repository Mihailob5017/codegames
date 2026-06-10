# Upload Service — MinIO Integration

## What is MinIO?

MinIO is a self-hosted, S3-compatible object storage server that runs as a Docker container.
It uses the exact same API as AWS S3, so we interact with it using the official `@aws-sdk/client-s3` package.
If you ever migrate to AWS S3, Cloudflare R2, or DigitalOcean Spaces — you just change the endpoint URL. Zero code changes.

## Architecture Overview

```
Browser                    Express API                     MinIO (Docker)
  |                           |                               |
  |  POST /upload/:folder     |                               |
  |  (multipart/form-data) -->|                               |
  |                           |                               |
  |                     multer parses file                    |
  |                     into memory buffer                    |
  |                           |                               |
  |                     UploadService.upload()                |
  |                           |--- PutObjectCommand --------->|
  |                           |                               | stores file
  |                           |<-- success -------------------|
  |                           |                               |
  |  { key, url }  <----------|                               |
  |                                                           |
  |  GET http://localhost:9000/codegames/problem-images/x.png |
  |---------------------------------------------------------->|
  |  <-- image served directly from MinIO --------------------|
```

**Key point:** Uploads go through Express. Reads (fetching images) go directly to MinIO from the browser.

## File Structure

```
codegames-api/
├── infrastructure/
│   └── s3-client.ts          # S3Client singleton
└── upload/
    ├── index.ts              # Barrel exports
    ├── multer-config.ts      # Multer middleware config
    ├── upload.controller.ts  # HTTP handlers
    ├── upload.route.ts       # Route definitions
    └── upload.service.ts     # Business logic
```

## How Each File Works

### 1. `infrastructure/s3-client.ts` — The Connection

Creates a singleton `S3Client` that talks to MinIO. Key config:

- **`endpoint`**: Points to MinIO inside Docker (`http://minio:9000`)
- **`region`**: Set to `us-east-1` — MinIO ignores this but the SDK requires it
- **`forcePathStyle: true`**: This is **mandatory** for MinIO. Without it, the SDK tries to access `bucket.minio:9000` (virtual-hosted style) instead of `minio:9000/bucket` (path style). MinIO only supports path style.

### 2. `upload/multer-config.ts` — File Validation

Multer handles parsing `multipart/form-data` requests. Our config:

- **Memory storage**: Files are held in a Buffer (`req.file.buffer`), not written to disk. We then manually send that buffer to MinIO. This avoids temp file cleanup and gives us full control.
- **5MB file size limit**: Multer rejects anything bigger before it even reaches the controller.
- **MIME type whitelist**: Only allows `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`. Anything else gets a 400 error.

**Why memory storage instead of `multer-s3`?**
`multer-s3` streams directly to S3 during parsing. Sounds nice, but:

- It's a third-party wrapper that lags behind SDK updates
- We lose control over the key naming and error handling
- The manual approach is only ~5 extra lines of code

### 3. `upload/upload.service.ts` — The Core Logic

**`ensureBucket()`** — Called once on server startup (`index.ts`):

- Checks if the `codegames` bucket exists (HeadBucketCommand)
- If not, creates it and applies a public-read policy
- The public-read policy allows anyone to GET objects (so the browser can load images directly from `http://localhost:9000/codegames/...`)
- This is idempotent — safe to call every time the server starts

**`upload(file, folder)`** — Stores a file:

- Generates a unique key: `{folder}/{uuid}.{ext}` (e.g., `problem-images/a1b2c3d4.png`)
- UUID prevents filename collisions
- Sends the file buffer to MinIO via `PutObjectCommand`
- Returns `{ key, url }` where:
    - `key` is the storage path (used for deletion later)
    - `url` is the browser-accessible URL using `MINIO_PUBLIC_URL`

**`delete(key)`** — Removes a file by its key.

**The two URLs explained:**

- `MINIO_ENDPOINT` (`http://minio:9000`) — Used by the API container to talk to MinIO inside Docker's network
- `MINIO_PUBLIC_URL` (`http://localhost:9000`) — Used to build URLs that the browser can access from outside Docker

### 4. `upload/upload.controller.ts` — HTTP Handlers

Follows the same pattern as `CodeController` — static class with static methods.

- **`uploadFile`**: Validates the `:folder` param with Zod, checks `req.file` exists, calls the service
- **`uploadMultiple`**: Same but for `req.files` (array of up to 10)
- **`deleteFile`**: Takes `{ key }` from request body, calls service to delete

### 5. `upload/upload.route.ts` — Route Definitions

```
POST   /:folder       — single file upload (form field: "file")
POST   /:folder/bulk  — multi file upload  (form field: "files", max 10)
DELETE /               — delete a file by key
```

Multer middleware runs **before** the controller on upload routes — it parses the multipart body and attaches `req.file` / `req.files`.

## Bucket & Folder Strategy

Single bucket (`codegames`) with folder prefixes:

```
codegames/
├── problem-images/    # Diagrams, examples for coding problems
│   ├── a1b2c3.png
│   └── d4e5f6.jpg
├── company-logos/     # Company logos
│   └── g7h8i9.svg
└── user-avatars/      # Profile pictures
    └── j0k1l2.webp
```

These aren't real directories — S3/MinIO uses flat key-value storage. The `/` in keys is just a convention that the MinIO console displays as folders.

## How Other Features Use This

The upload service is **decoupled** from entity CRUD. The workflow is two steps:

1. **Upload first**: `POST /api/v1/upload/problem-images` with the image file
    - Returns `{ key: "problem-images/abc.png", url: "http://localhost:9000/codegames/problem-images/abc.png" }`

2. **Associate the URL**: Send the `url` to the relevant create/update endpoint
    - e.g., `POST /api/v1/admin/problems` with `url` in the `ProblemImage` field
    - The database stores the URL string, not the file itself

This means the upload service doesn't need to know about problems, companies, or users.

## API Usage Examples

**Single upload:**

```bash
curl -X POST http://localhost:4000/api/v1/upload/problem-images \
  -F "file=@./my-diagram.png"
```

Response:

```json
{
	"status": "success",
	"data": {
		"key": "problem-images/550e8400-e29b-41d4-a716-446655440000.png",
		"url": "http://localhost:9000/codegames/problem-images/550e8400-e29b-41d4-a716-446655440000.png"
	}
}
```

**Bulk upload (up to 10 files):**

```bash
curl -X POST http://localhost:4000/api/v1/upload/problem-images/bulk \
  -F "files=@./img1.png" \
  -F "files=@./img2.png"
```

**Delete:**

```bash
curl -X DELETE http://localhost:4000/api/v1/upload \
  -H "Content-Type: application/json" \
  -d '{"key": "problem-images/550e8400-e29b-41d4-a716-446655440000.png"}'
```

**View uploaded image in browser:**

```
http://localhost:9000/codegames/problem-images/550e8400-e29b-41d4-a716-446655440000.png
```

## MinIO Web Console

Available at `http://localhost:9001` after running `docker compose up`.
Login: the `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` from your `.env.local`.

From the console you can:

- Browse all buckets and files
- Upload/download/delete files manually
- View bucket policies
- Monitor storage usage

## Adding a New Upload Folder

To support a new type (e.g., `blog-thumbnails`):

1. Add it to the `UploadFolder` type in `upload.service.ts`
2. Add it to the Zod enum in `upload.controller.ts`

That's it — no new routes or service methods needed.
