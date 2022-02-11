export class OutputLineReader {
    private text: string = "";
    private lines: string[] = [];
    private firstline: boolean | null = null;
    public write(value: string) {
        this.text += value;
        var i = this.text.indexOf('\n');
        while (i !== -1) {
            var line = this.text.substring(0, i);
            this.text = this.text.substring(i + 1);
            this.lines.push(line);
            i = this.text.indexOf('\n');
        }

        if (this.firstline === true) this.firstline = false;
        if (this.firstline === null) this.firstline = true;
        return this;
    }
    public get isFirstLine() {
        return this.firstline === true;
    }
    public get lineCount() {
        return this.lines.length;
    }
    public readline() {
        if (this.lines.length > 0) {
            return this.lines.shift();
        }
        return null;
    }
}