import { combineLatest, ReplaySubject } from 'rxjs'
import { SourcePath } from './models'
import CodeMirror from 'codemirror'
import { RxHTMLElement, ChildrenLike, VirtualDOM } from 'rx-vdom'
import { IdeState } from './ide.state'
import { filter } from 'rxjs/operators'

const defaultConfig = {
    value: '',
    lineNumbers: true,
    theme: 'blackboard',
    lineWrapping: false,
    indentUnit: 4,
}
export class CodeEditorView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly editorUid = `${Math.floor(Math.random()) * 1e6}`
    public readonly ideState: IdeState
    public readonly config: { [k: string]: unknown }
    public readonly language: string
    public readonly class = 'w-100 h-100 d-flex flex-column overflow-auto'
    public readonly style = {
        fontSize: 'initial' as const,
    }
    public readonly path: SourcePath
    public readonly change$ = new ReplaySubject<CodeMirror.EditorChange[]>(1)
    public readonly cursor$ = new ReplaySubject<CodeMirror.Position>(1)
    public readonly children: ChildrenLike

    public readonly nativeEditor$ = new ReplaySubject<CodeMirror.Editor>(1)

    constructor(params: {
        ideState: IdeState
        path: SourcePath
        language: string
        config?: unknown
    }) {
        Object.assign(this, params)

        const config = {
            ...defaultConfig,
            ...this.config,
            mode: this.language,
            value: this.ideState.updates$[this.path].getValue().content,
        }
        combineLatest([
            this.ideState.updates$[this.path].pipe(
                filter((update) => update.updateOrigin.uid != this.editorUid),
            ),
            this.nativeEditor$,
        ]).subscribe(([{ content }, nativeEditor]) => {
            const cursor = nativeEditor.getCursor()
            nativeEditor.setValue(content)
            nativeEditor.setCursor(cursor)
        })

        this.children = [
            {
                tag: 'div' as const,
                id: 'code-mirror-editor',
                class: 'w-100 h-100',
                connectedCallback: (elem: RxHTMLElement<'div'>) => {
                    const editor: CodeMirror.Editor = window['CodeMirror'](
                        elem,
                        config,
                    )
                    this.nativeEditor$.next(editor)
                    // it does not hurt much, but helps to have right rendering of CM editor
                    setTimeout(() => {
                        editor.refresh()
                    }, 100)

                    editor.on('changes', (_, changeObj) => {
                        this.change$.next(changeObj)
                        if (
                            changeObj.length == 1 &&
                            changeObj[0].origin == 'setValue'
                        ) {
                            return
                        }
                        this.ideState.update({
                            path: this.path,
                            content: editor.getValue(),
                            updateOrigin: { uid: this.editorUid },
                        })
                    })
                    elem.querySelector('.CodeMirror').classList.add('h-100')
                    editor.on('cursorActivity', () => {
                        this.cursor$.next(editor.getCursor())
                    })
                },
            },
        ]
    }
}
