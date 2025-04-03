import { ReplaySubject } from 'rxjs';
import { SourcePath } from './models';
import CodeMirror from 'codemirror';
import { ChildrenLike, VirtualDOM } from 'rx-vdom';
import { IdeState } from './ide.state';
export declare class CodeEditorView implements VirtualDOM<'div'> {
    readonly tag = "div";
    readonly editorUid: string;
    readonly ideState: IdeState;
    readonly config: {
        [k: string]: unknown;
    };
    readonly language: string;
    readonly class = "w-100 h-100 d-flex flex-column overflow-auto";
    readonly style: {
        fontSize: "initial";
    };
    readonly path: SourcePath;
    readonly change$: ReplaySubject<CodeMirror.EditorChange[]>;
    readonly cursor$: ReplaySubject<CodeMirror.Position>;
    readonly children: ChildrenLike;
    readonly nativeEditor$: ReplaySubject<CodeMirror.Editor>;
    constructor(params: {
        ideState: IdeState;
        path: SourcePath;
        language: string;
        config?: unknown;
    });
}
