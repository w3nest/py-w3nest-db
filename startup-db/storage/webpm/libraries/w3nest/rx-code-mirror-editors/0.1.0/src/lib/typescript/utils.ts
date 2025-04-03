import * as ts from 'typescript'
import { compilerOptions } from './ide.state'
import {
    createSystem,
    createVirtualTypeScriptEnvironment,
} from '@typescript/vfs'
import { SrcHighlight } from '../common'

export function parseTypescript(tsSrc: string) {
    const transpiled = ts
        .transpileModule(tsSrc, {
            compilerOptions,
        })
        .outputText.replace('export {};', '')

    return {
        tsSrc: tsSrc,
        jsSrc: transpiled,
    }
}

export function getHighlights(fsMap, src) {
    const filename = 'tmp-entry-to-be-analyzed.ts'
    fsMap.set(filename, `${src}`)
    const system = createSystem(fsMap)
    const env = createVirtualTypeScriptEnvironment(
        system,
        [filename],
        ts,
        compilerOptions,
    )

    return [
        ...env.languageService.getSyntacticDiagnostics(filename),
        ...env.languageService.getSemanticDiagnostics(filename),
    ]
        .map((d) => new SrcHighlight(d))
        .filter((highlight) => highlight.diagnostic.code != 1108)
}
