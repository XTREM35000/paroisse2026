// Re-export the internal providers/ package (streamManager, types, ProviderManager, etc.)
// Re-export `streamManager` directly from its implementation to avoid reading
// the property off a module object during initialization (avoids TDZ errors).
export { streamManager } from './providers/StreamManager';

export * from './providers';
export * from './providers/ProviderManager';

