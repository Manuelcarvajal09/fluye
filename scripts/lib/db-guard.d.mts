export const MARKER_TABLE: string;
export function isDevDatabase(url?: string): Promise<boolean>;
export function assertDevDatabase(what?: string): Promise<void>;
export function assertClerkTestKeys(): void;
