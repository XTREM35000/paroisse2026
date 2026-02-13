/**
 * Legacy Compatibility Export
 * 
 * This file provides backward compatibility for code that previously
 * imported extractYoutubeId and other utilities directly from the providers module.
 */

import { streamManager } from './StreamManager';

/**
 * Extract YouTube video ID from various URL formats
 * Legacy export for backward compatibility
 * 
 * @deprecated Use streamManager.extractYoutubeId() instead
 */
export function extractYoutubeId(input: string): string | null {
  return streamManager.extractYoutubeId(input);
}
