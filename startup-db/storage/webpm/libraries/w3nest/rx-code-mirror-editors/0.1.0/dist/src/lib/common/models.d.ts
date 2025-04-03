import * as ts from 'typescript';
export type SourcePath = string;
export type SourceContent = string;
export declare class SourceCode {
    path: SourcePath;
    content: SourceContent;
}
export declare class UpdateOrigin {
    uid: string;
}
export interface SrcPosition {
    line: number;
    ch: number;
}
export declare class SrcHighlight {
    readonly diagnostic: ts.Diagnostic;
    readonly messageText: string;
    readonly from: SrcPosition;
    readonly to: SrcPosition;
    constructor(diagnostic: ts.Diagnostic);
}
