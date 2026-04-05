/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional YOLO FastAPI base URL, e.g. `http://127.0.0.1:8000` or `/api` (with Vite proxy). If unset, browser COCO-SSD is used. */
  readonly VITE_DETECTION_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
