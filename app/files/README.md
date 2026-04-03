# File Upload Service

This module handles secure athlete file uploads for videos, medical reports, documents, profile photos, and training plans.

## Local Development

The service uses MinIO when `S3_ENDPOINT_URL` is configured. Otherwise it falls back to local filesystem storage under `FILE_STORAGE_PATH`.

Start MinIO locally with Docker Compose and create the bucket:

```bash
docker compose up -d minio
docker compose --profile storage up minio_create_bucket
```

Default MinIO console:

- API: `http://localhost:9000`
- Console: `http://localhost:9001`
- Access key: `athleteos`
- Secret key: `athleteos123`

## S3 Migration

To switch from local dev storage to S3-compatible object storage:

1. Set `S3_ENDPOINT_URL`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`.
2. Ensure the target bucket exists.
3. Restart the API and worker services.

Stored object keys use:

```text
{athlete_id}/{file_type}/{uuid4}.{ext}
```

## Injury Keywords Config

`app/files/config/injury_keywords.yaml`

Schema:

```yaml
injury_keywords:
  - fracture
  - tear
  - ligament
  - strain
```

If a medical report preview contains any configured keyword, the service auto-tags the file with `injury_related` and emits a `medical_document_uploaded` event into UADP.
