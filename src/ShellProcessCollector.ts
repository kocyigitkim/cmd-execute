
export interface ShellProcessCollector {
    (match: string[], line: string, isFirstLine?: boolean): void;
}
