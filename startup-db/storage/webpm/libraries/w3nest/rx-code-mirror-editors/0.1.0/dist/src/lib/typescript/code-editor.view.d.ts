import { Common } from '..';
import { SourcePath } from '../common';
import { BehaviorSubject } from 'rxjs';
import { IdeState } from './ide.state';
export declare class CodeEditorView extends Common.CodeEditorView {
    readonly highlights$: BehaviorSubject<Common.SrcHighlight[]>;
    readonly ideState: IdeState;
    constructor(params: {
        ideState: IdeState;
        path: SourcePath;
        config: {
            [k: string]: unknown;
        };
    });
}
