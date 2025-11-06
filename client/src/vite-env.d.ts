/// <reference types="vite/client" />

declare module "*.svg" {
  const content: any;
  export default content;
}

declare module "*.png" {
  const content: any;
  export default content;
}

declare module "*.jpg" {
  const content: any;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // adicione outras variáveis de ambiente aqui
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}