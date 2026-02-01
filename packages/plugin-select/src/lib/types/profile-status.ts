/**
 * Status of a single selector mapping within a profile
 */
export interface SelectorMappingStatus {
  /** Name of the selector */
  selectorName: string;
  /** Expected option from the profile */
  expectedOption: string;
  /** Current active option in the file */
  currentOption: string | null;
  /** Path to the file containing the selector */
  filePath: string;
  /** Whether the current option matches the expected option */
  isMatched: boolean;
  /** Error message if selector or option not found */
  error?: string;
}

/**
 * Status of a profile
 */
export interface ProfileStatus {
  /** Profile name */
  name: string;
  /** Status of each selector mapping */
  mappings: SelectorMappingStatus[];
  /** All mappings match their expected options */
  isFullyActive: boolean;
  /** Some mappings match their expected options */
  isPartiallyActive: boolean;
  /** Number of matched mappings */
  matchedCount: number;
  /** Total number of mappings in the profile */
  totalCount: number;
}
