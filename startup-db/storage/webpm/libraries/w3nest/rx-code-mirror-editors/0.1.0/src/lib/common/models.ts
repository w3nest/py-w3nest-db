import * as ts from 'typescript'

export type SourcePath = string
export type SourceContent = string

export class SourceCode {
    path: SourcePath
    content: SourceContent
}

export class UpdateOrigin {
    uid: string
}

export interface SrcPosition {
    line: number
    ch: number
}

export class SrcHighlight {
    public readonly messageText: string
    public readonly from: SrcPosition
    public readonly to: SrcPosition

    constructor(public readonly diagnostic: ts.Diagnostic) {
        this.messageText = diagnostic.messageText as string
        if (this.messageText['messageText']) {
            this.messageText = this.messageText['messageText']
        }
        const from_location = diagnostic.file.getLineAndCharacterOfPosition(
            diagnostic.start,
        )
        this.from = {
            line: from_location.line,
            ch: from_location.character,
        }
        const to_location = diagnostic.file.getLineAndCharacterOfPosition(
            diagnostic.start + diagnostic.length,
        )
        this.to = { line: to_location.line, ch: to_location.character }
    }
}
