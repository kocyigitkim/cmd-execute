import { CommonSpawnOptions } from "child_process";

export interface ShellProcessOptions extends CommonSpawnOptions {
    path: string;
    args?: string[];
    env?: { [key: string]: string; };
    cwd?: string;
    stdin?: string;
}
