/// <reference types="vite/client" />

declare module "js-yaml" {
  const yaml: {
    load(input: string, options?: { schema?: unknown }): unknown;
    FAILSAFE_SCHEMA: unknown;
  };
  export default yaml;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.wav" {
  const src: string;
  export default src;
}
