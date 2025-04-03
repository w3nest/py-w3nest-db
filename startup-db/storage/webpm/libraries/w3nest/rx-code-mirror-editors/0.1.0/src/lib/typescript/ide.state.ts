import { Common } from '..'

import { SourceCode } from '../common'
import { createDefaultMapFromCDN } from './vfs_default_map_cdn'
import { Observable } from 'rxjs'
import {
    createSystem,
    createVirtualTypeScriptEnvironment,
    VirtualTypeScriptEnvironment,
} from '@typescript/vfs'
import { filter, map, shareReplay } from 'rxjs/operators'
import * as ts from 'typescript'

export const compilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ES2020,
    esModuleInterop: true,
    noImplicitAny: false,
    baseUrl: '/',
}

export class IdeState extends Common.IdeState {
    public readonly environment$: Observable<{
        environment: VirtualTypeScriptEnvironment
        fsMap: Map<string, string>
    }>

    constructor(params: { files: SourceCode[] }) {
        super({
            files: params.files,
            defaultFileSystem: createDefaultMapFromCDN(
                { target: ts.ScriptTarget.ES2020 },
                '4.7.4',
            ),
        })

        this.environment$ = this.fsMap$.pipe(
            filter((fsMap) => fsMap != undefined),
            map((fsMap) => {
                const system = createSystem(fsMap)
                return {
                    fsMap,
                    environment: createVirtualTypeScriptEnvironment(
                        system,
                        [],
                        ts,
                        compilerOptions,
                    ),
                }
            }),
            shareReplay({ bufferSize: 1, refCount: true }),
        )
    }
}
