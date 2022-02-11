
export interface ShellProcessOptions {
    path: string;
    args?: string[];
    env?: { [key: string]: string; };
    cwd?: string;
    stdin?: string;
}
