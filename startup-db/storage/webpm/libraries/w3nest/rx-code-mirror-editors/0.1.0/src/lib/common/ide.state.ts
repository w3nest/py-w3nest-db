import { BehaviorSubject } from 'rxjs'
import { UpdateOrigin, SourceCode, SourceContent, SourcePath } from './models'
import { debounceTime, filter } from 'rxjs/operators'

export class IdeState {
    public readonly fsMap$ = new BehaviorSubject<Map<string, string>>(undefined)

    public readonly updates$: {
        [k: string]: BehaviorSubject<{
            path: SourcePath
            content: SourceContent
            updateOrigin: UpdateOrigin
        }>
    }

    constructor(params: {
        files: SourceCode[]
        defaultFileSystem: Promise<Map<string, string>>
    }) {
        Object.assign(this, params)

        this.fsMap$
            .pipe(
                filter((fsMap) => fsMap != undefined),
                debounceTime(500),
            )
            .subscribe(() => {})

        params.defaultFileSystem.then((defaultFsMap) => {
            const fsMap = new Map(defaultFsMap)
            params.files.forEach((file) => {
                fsMap.set(file.path, file.content)
            })
            this.fsMap$.next(fsMap)
        })
        this.updates$ = params.files.reduce((acc, e) => {
            return {
                ...acc,
                [e.path]: new BehaviorSubject({
                    path: e.path,
                    content: e.content,
                    updateOrigin: { uid: 'IdeState' },
                }),
            }
        }, {})
    }

    update({
        path,
        content,
        updateOrigin,
    }: {
        path: SourcePath
        content: SourceContent
        updateOrigin: UpdateOrigin
    }) {
        const fsMap = this.fsMap$.value
        fsMap.set(path, content)
        this.fsMap$.next(fsMap)
        this.updates$[path].next({
            path,
            content,
            updateOrigin: updateOrigin,
        })
    }

    addFile(source: SourceCode) {
        const fsMap = this.fsMap$.value
        fsMap.set(source.path, source.content)
        this.fsMap$.next(fsMap)
        this.updates$[source.path] = new BehaviorSubject({
            ...source,
            updateOrigin: { uid: 'IdeState' },
        })
    }

    removeFile(path: string) {
        const fsMap = this.fsMap$.value
        fsMap.delete(path)
        this.fsMap$.next(fsMap)
        delete this.updates$[path]
    }

    moveFile(oldPath: string, newPath: string) {
        const fsMap = this.fsMap$.value
        const content = fsMap.get(oldPath)
        fsMap.set(newPath, content)
        fsMap.delete(oldPath)
        this.fsMap$.next(fsMap)
        delete this.updates$[oldPath]
        this.updates$[newPath] = new BehaviorSubject({
            path: newPath,
            content,
            updateOrigin: { uid: 'IdeState' },
        })
    }
}
