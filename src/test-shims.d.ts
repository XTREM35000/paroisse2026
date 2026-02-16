// Test shims included in src so TypeScript picks them up during IDE checks
declare global {
  const describe: any;
  const it: any;
  const test: any;
  const beforeEach: any;
  const afterEach: any;
  const expect: any;
  const vi: any;
}

declare module 'vitest' {
  export const vi: any;
  export const describe: any;
  export const it: any;
  export const test: any;
  export const beforeEach: any;
  export const afterEach: any;
  export const expect: any;
}

declare module '@/hooks/useUnreadNotifications' {
  const hook: any;
  export default hook;
}

export {};
