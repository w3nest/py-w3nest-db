import { BehaviorSubject } from 'rxjs';
import { UpdateOrigin, SourceCode, SourceContent, SourcePath } from './models';
export declare class IdeState {
    readonly fsMap$: BehaviorSubject<Map<string, string>>;
    readonly updates$: {
        [k: string]: BehaviorSubject<{
            path: SourcePath;
            content: SourceContent;
            updateOrigin: UpdateOrigin;
        }>;
    };
    constructor(params: {
        files: SourceCode[];
        defaultFileSystem: Promise<Map<string, string>>;
    });
    update({ path, content, updateOrigin, }: {
        path: SourcePath;
        content: SourceContent;
        updateOrigin: UpdateOrigin;
    }): void;
    addFile(source: SourceCode): void;
    removeFile(path: string): void;
    moveFile(oldPath: string, newPath: string): void;
}
