
export interface ShellProcessMatcher {
    (line: string): string[] | null;
}
