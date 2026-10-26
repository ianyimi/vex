export type ScaffoldMode = 'bare' | 'full';

export declare const EXPECTED_TREE: Record<ScaffoldMode, { required: string[]; forbidden: string[] }>;

export declare const PROHIBITED_PATTERNS: Array<{ label: string; test: (source: string) => boolean }>;

export declare function assertScaffold(props: { targetDir: string; mode: ScaffoldMode }): {
  ok: boolean;
  errors: string[];
};
