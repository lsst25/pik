// Plugin export
export { selectPlugin } from './lib/plugin.js';

// Types
export type { SelectConfig, ProfileMapping, ProfilesConfig } from './lib/types.js';
export type { ProfileStatus, SelectorMappingStatus } from './lib/types/profile-status.js';

// Re-export the Scanner for potential use
export { Scanner, type FileResult } from './lib/scanner.js';

// Re-export profile utilities
export {
  findSelectorByName,
  computeProfileStatus,
  computeAllProfileStatuses,
  type FoundSelector,
} from './lib/profile-utils.js';
