import { Common } from '..'
import { SourcePath, SrcHighlight } from '../common'

import CodeMirror from 'codemirror'
import { getHighlights } from './utils'
import { BehaviorSubject } from 'rxjs'
import { mergeMap, take, tap } from 'rxjs/operators'
import { IdeState } from './ide.state'

export class CodeEditorView extends Common.CodeEditorView {
    public readonly highlights$ = new BehaviorSubject<SrcHighlight[]>([])
    public readonly ideState: IdeState

    constructor(params: {
        ideState: IdeState
        path: SourcePath
        config: { [k: string]: unknown }
    }) {
        super({
            ...params,
            language: 'text/typescript',
            config: {
                ...params.config,
                gutters: ['CodeMirror-lint-markers'],
                lint: {
                    options: {
                        editorKind: 'TsCodeEditorView',
                        esversion: 2021,
                    },
                },
            },
        })

        this.ideState.environment$
            .pipe(
                take(1),
                tap(({ fsMap }) => {
                    const highlights = getHighlights(
                        fsMap,
                        fsMap.get(params.path),
                    )
                    this.highlights$.next(highlights)
                }),
                mergeMap(() => this.nativeEditor$),
            )
            .subscribe((editor) => {
                editor.setValue(editor.getValue())
            })

        CodeMirror.registerHelper('lint', 'javascript', (text, options) => {
            const fsMapBase = this.ideState.fsMap$.getValue()

            if (options.editorKind != 'TsCodeEditorView' || !fsMapBase) {
                return []
            }
            const highlights = getHighlights(fsMapBase, text)
            this.highlights$.next(highlights)
            return highlights.map((highlight) => ({
                ...highlight,
                message: highlight.messageText,
            }))
        })
    }
}
