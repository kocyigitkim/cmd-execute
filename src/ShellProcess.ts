import EventEmitter from "events";
import { ChildProcess, spawn } from 'child_process'
import { OutputLineReader } from "./OutputLineReader";
import jsyaml from 'js-yaml'
import { ShellProcessOptions } from "./ShellProcessOptions";
import { ShellProcessCollector } from "./ShellProcessCollector";
import { ShellProcessMatcher } from "./ShellProcessMatcher";
import { ShellProcessObjectCollector } from "./ShellProcessObjectCollector";

export class ShellProcess {
    private events: EventEmitter;
    private currentProcess: ChildProcess;
    constructor(public options: ShellProcessOptions) {
        this.events = new EventEmitter();
    }
    on(event: string, callback: Function) {
        this.events.on(event, callback as any);
        return this;
    }
    process(matcher: ShellProcessMatcher, collector: ShellProcessCollector) {
        var liner = new OutputLineReader();
        this.events.on('output', (data) => {
            liner.write(data);
            var line = null;
            while (line = liner.readline()) {
                var collection = null;
                if (collection = matcher(line)) {
                    collector(collection, line, liner.isFirstLine);
                }
            }
        });
        return this;
    }
    processJson(collector: ShellProcessObjectCollector) {
        var text = "";
        this.events.on('output', (data) => {
            text += data;
        });
        this.events.on('exit', () => {
            var json = null;
            try {
                json = JSON.parse(text);
            } catch (error) {
                if (this.events.eventNames().includes("error")) this.events.emit('error', error);
            }
            if (json) {
                collector(json);
            }
        })
        return this;
    }
    processYaml(collector: ShellProcessObjectCollector) {
        var text = "";
        this.events.on('output', (data) => {
            text += data;
        });
        this.events.on('exit', () => {
            var json = null;
            try {
                json = jsyaml.load(text);
            } catch (error) {
                if (this.events.eventNames().includes("error")) this.events.emit('error', error);
            }
            if (json) {
                collector(json);
            }
        })
        return this;
    }
    processText(collector: ShellProcessObjectCollector) {
        var text = "";
        this.events.on('output', (data) => {
            text += data;
        });
        this.events.on('exit', () => {
            collector(text);
        })
        return this;
    }
    processHeaderList(collector: ShellProcessCollector) {
        var matcher = (line: string) => {
            var parts = line.split(/[\s\t]{3,}/g);
            if (parts.length === 0) return null;
            return parts;
        };
        return this.process(matcher, collector);
    }
    async run(stdout = null, stderr = null) {
        return new Promise((resolve, reject) => {
            var process = spawn(this.options.path, this.options.args, {
                ...this.options,
                shell: true,
                env: this.options.env,
                cwd: this.options.cwd
            });
            this.currentProcess = process;

            process.stdout.on('data', (data) => {
                this.events.emit('output', data.toString());
                if (stdout) stdout(data.toString());
            });
            process.stderr.on('data', (data) => {
                if (this.events.eventNames().includes("error")) this.events.emit('error', data.toString());
                if (stderr) stderr(data.toString());
            });
            process.stdin.on('error', (error) => {
                if (this.events.eventNames().includes("error")) this.events.emit('error', error);
            });
            if (this.options.stdin) {
                process.stdin.write(this.options.stdin);
                process.stdin.write("\n");
                process.stdin.end();
            }
            process.on('exit', (code, signal) => {
                this.events.emit('exit', code, signal);
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
        });
    }
    async kill() {
        return this.currentProcess.kill();
    }
    async wait() {
        return new Promise((resolve, reject) => {
            this.currentProcess.on('exit', (code, signal) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
        });
    }
}