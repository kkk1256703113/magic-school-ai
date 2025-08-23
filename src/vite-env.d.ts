/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_VISION_API_KEY: string
  readonly VITE_GOOGLE_VISION_ENDPOINT: string
  readonly VITE_MATHPIX_APP_ID: string
  readonly VITE_MATHPIX_APP_KEY: string
  readonly VITE_MATHPIX_ENDPOINT: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_ENDPOINT: string
  readonly VITE_CLOUDFLARE_R2_ACCOUNT_ID: string
  readonly VITE_CLOUDFLARE_R2_ACCESS_KEY_ID: string
  readonly VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY: string
  readonly VITE_CLOUDFLARE_R2_BUCKET_NAME: string
  readonly VITE_CLOUDFLARE_R2_ENDPOINT: string
  readonly VITE_CLOUDINARY_CLOUD_NAME: string
  readonly VITE_CLOUDINARY_API_KEY: string
  readonly VITE_CLOUDINARY_API_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
