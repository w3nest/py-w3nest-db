import { Common } from '..';
import { SourceCode } from '../common';
import { Observable } from 'rxjs';
import { VirtualTypeScriptEnvironment } from '@typescript/vfs';
import * as ts from 'typescript';
export declare const compilerOptions: {
    target: ts.ScriptTarget;
    module: ts.ModuleKind;
    esModuleInterop: boolean;
    noImplicitAny: boolean;
    baseUrl: string;
};
export declare class IdeState extends Common.IdeState {
    readonly environment$: Observable<{
        environment: VirtualTypeScriptEnvironment;
        fsMap: Map<string, string>;
    }>;
    constructor(params: {
        files: SourceCode[];
    });
}
