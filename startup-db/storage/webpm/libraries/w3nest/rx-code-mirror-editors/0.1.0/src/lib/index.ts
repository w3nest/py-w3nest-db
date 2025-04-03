import * as webpmClient from '@w3nest/webpm-client'
import { setup } from '../auto-generated'
export * as Common from './common'

export type TsCodeEditorModule = typeof import('./typescript')

export function TypescriptModule({
    installParameters,
}: { installParameters? } = {}): Promise<TsCodeEditorModule> {
    const parameters = installParameters || {}
    const scripts = [
        ...(parameters.scripts || []),
        '' + 'codemirror#5.52.0~mode/javascript.min.js',
        'codemirror#5.52.0~addons/lint/lint.js',
    ]
    const css = [
        ...(parameters.css || []),
        'codemirror#5.52.0~codemirror.min.css',
        'codemirror#5.52.0~addons/lint/lint.css',
        'codemirror#5.52.0~theme/blackboard.min.css', // default theme
    ]

    return setup
        .installAuxiliaryModule({
            name: 'typescript-addon',
            cdnClient: webpmClient,
            installParameters: {
                ...parameters,
                scripts,
                css,
            },
        })
        .then((m) => {
            return m
        })
}
