// Minimal shims to satisfy the TypeScript language server in the tests folder
// These are intentionally permissive and only used for IDE diagnostics.

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

declare module '@testing-library/react' {
  export const renderHook: any;
  export const act: any;
  export function render(...args: any[]): any;
  export function cleanup(): void;
}

declare module '@/hooks/useUnreadNotifications' {
  const hook: any;
  export default hook;
}

export {};
