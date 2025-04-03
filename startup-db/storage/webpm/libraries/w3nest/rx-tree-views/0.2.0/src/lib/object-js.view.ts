import { BehaviorSubject, Observable, of, map } from 'rxjs'
import { ImmutableTree } from './'
import { VirtualDOM } from 'rx-vdom'

type DataObject = Record<string, unknown>

function nodeFactory(
    name: string,
    data: unknown,
    nestedIndex: number,
): DataNode {
    if (data === undefined) {
        return new UndefinedNode({ name, nestedIndex })
    }

    if (typeof data === 'string') {
        return new StringNode({ name, data, nestedIndex })
    }

    if (typeof data === 'number') {
        return new NumberNode({ name, data, nestedIndex })
    }

    if (typeof data === 'boolean') {
        return new BoolNode({ name, data, nestedIndex })
    }

    if (typeof data === 'function') {
        return new FunctionNode({ name, data, nestedIndex })
    }

    if (Array.isArray(data)) {
        return new ArrayNode({ name, data, nestedIndex })
    }

    if (data instanceof ArrayBuffer) {
        return new ArrayBufferNode({ name, data, nestedIndex })
    }

    if (typeof data == 'object') {
        return new ObjectNode({ name, data: data as DataObject, nestedIndex })
    }

    return new UnknownNode({ name, nestedIndex })
}

export class DataNode extends ImmutableTree.Node {
    name: string
    nestedIndex: number
    classes: string

    constructor({
        id,
        name,
        children,
        classes,
        nestedIndex,
    }: {
        id?: string
        name: string
        children?: Observable<ImmutableTree.Node[]>
        classes: string
        nestedIndex: number
    }) {
        super({ id: id ?? `${name}_${String(nestedIndex)}`, children }) // `${Math.floor(Math.random()*1e6)}`
        this.name = name
        this.classes = classes
        this.nestedIndex = nestedIndex
    }
}

export class UndefinedNode extends DataNode {
    constructor({
        name,
        nestedIndex,
        id,
    }: {
        name: string
        nestedIndex: number
        id?: string
    }) {
        super({ id, name, classes: 'fv-text-disabled', nestedIndex })
    }
}

export class UnknownNode extends DataNode {
    constructor({
        name,
        nestedIndex,
        id,
    }: {
        name: string
        nestedIndex: number
        id?: string
    }) {
        super({ id, name, classes: '', nestedIndex })
    }
}

export class ValueNode<T> extends DataNode {
    data: T
    classes: string

    constructor({
        name,
        data,
        classes,
        nestedIndex,
        id,
    }: {
        name: string
        data: T
        classes: string
        nestedIndex: number
        id?: string
    }) {
        super({ id, name, classes, nestedIndex })
        this.data = data
    }
}

export class NumberNode extends ValueNode<number> {
    constructor({
        name,
        data,
        nestedIndex,
        id,
    }: {
        name: string
        data: number
        nestedIndex: number
        id?: string
    }) {
        super({ id, name, data, classes: 'cm-number', nestedIndex })
    }
}

export class StringNode extends ValueNode<string> {
    constructor({
        name,
        data,
        nestedIndex,
        id,
    }: {
        name: string
        data: string
        nestedIndex: number
        id?: string
    }) {
        super({ id, name, data, classes: 'cm-string', nestedIndex })
    }
}

export class BoolNode extends ValueNode<boolean> {
    constructor({
        name,
        data,
        nestedIndex,
        id,
    }: {
        name: string
        data: boolean
        nestedIndex: number
        id?: string
    }) {
        super({ id, name, data, classes: 'cm-atom', nestedIndex })
    }
}

export class ArrayBufferNode extends ValueNode<ArrayBuffer> {
    constructor({
        name,
        data,
        nestedIndex,
        id,
    }: {
        name: string
        data: ArrayBuffer
        nestedIndex: number
        id?: string
    }) {
        super({ id, name, data, classes: 'cm-string', nestedIndex })
    }
}

export class FunctionNode extends DataNode {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    data: Function

    constructor({
        name,
        data,
        nestedIndex,
        id,
    }: {
        name: string
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        data: Function
        nestedIndex: number
        id?: string
    }) {
        super({ id, name, classes: 'cm-def', nestedIndex })
        this.data = data
    }
}

export class ObjectNode extends DataNode {
    getChildrenNodes(object: DataObject): ImmutableTree.Node[] {
        const attributes: DataNode[] = []
        for (const key in object) {
            attributes.push(nodeFactory(key, object[key], this.nestedIndex + 1))
        }
        let functions: FunctionNode[] = []
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            functions = Object.entries(Object.getPrototypeOf(object)).map(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
                ([k, v]: [string, Function]) =>
                    new FunctionNode({
                        name: k,
                        data: v,
                        nestedIndex: this.nestedIndex + 1,
                    }),
            )
        } catch (e) {
            console.error(
                'An error occured while trying to create FunctionNode',
                e,
            )
        }
        return [...attributes, ...functions]
    }

    data: DataObject

    constructor({
        name,
        data,
        nestedIndex,
        id,
    }: {
        name: string
        data: DataObject
        nestedIndex: number
        id?: string
    }) {
        super({
            id,
            name,
            children: of(data).pipe(map((d) => this.getChildrenNodes(d))),
            classes: '',
            nestedIndex,
        })
        this.data = data
    }
}

export class ArrayNode extends DataNode {
    data: unknown[]

    constructor({
        name,
        data,
        nestedIndex,
        id,
    }: {
        name: string
        data: unknown[]
        nestedIndex: number
        id?: string
    }) {
        super({
            id,
            name,
            children: of(data).pipe(
                map((d) =>
                    Object.entries(d).map(([k, v]) =>
                        nodeFactory(k, v, nestedIndex + 1),
                    ),
                ),
            ),
            classes: '',
            nestedIndex,
        })
        this.data = data
    }
}

export class State extends ImmutableTree.State<DataNode> {
    public readonly stringLengthLimit

    constructor({
        title,
        data,
        expandedNodes,
        ...rest
    }: {
        title: string
        data: unknown
        expandedNodes?: string[] | BehaviorSubject<string[]>
    }) {
        super({
            rootNode: nodeFactory(title, data, 0),
            expandedNodes: expandedNodes,
            ...rest,
        })
    }
}

interface TOptions {
    stringLengthLimit?: number
    containerClass?: string
    containerStyle?: Record<string, string>
}

export class View extends ImmutableTree.View<DataNode> {
    static defaultOptions = {
        containerClass: 'cm-s-blackboard',
        containerStyle: { 'white-space': 'nowrap' },
    }

    static getStyling(options: TOptions | undefined): TOptions {
        return { ...View.defaultOptions, ...(options ?? {}) }
    }

    constructor({
        state,
        options,
        ...rest
    }: {
        state: State
        options?: TOptions
    }) {
        super({
            state,
            headerView: dataNodeHeaderView,
            class: View.getStyling(options).containerClass,
            style: View.getStyling(options).containerStyle,
            ...rest,
        })
    }
}

export function dataNodeHeaderView(
    state: State,
    node: DataNode,
): VirtualDOM<'div'> {
    if (node instanceof UnknownNode) {
        return {
            tag: 'div',
            class: 'd-flex fv-text-disabled flex-wrap',
            innerText: node.name,
        }
    }
    let content = ''
    if (node instanceof ValueNode) {
        content = String(node.data)
        if (typeof node.data == 'string') {
            content = "'" + content + "'"
        }
    }

    if (node instanceof UndefinedNode) {
        content = 'undefined'
    }

    if (node instanceof FunctionNode) {
        content = `f(${String(node.data.length)} arg(s))`
    }

    if (node instanceof ObjectNode) {
        content = '{...}'
    }

    if (node instanceof ArrayNode) {
        content = '[...]'
    }

    if (node instanceof ArrayBufferNode) {
        content = `Array Buffer (${String(node.data.byteLength)} bytes)`
    }

    return {
        tag: 'div',
        class: 'd-flex fv-pointer',
        children: [
            { tag: 'div', innerText: node.name },
            {
                tag: 'div',
                class: 'px-2 w-100 ' + node.classes,
                innerHTML: `<i>${content}</i>`,
                style: {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    //"max-width": `${state.stringLengthLimit * 10}px`
                },
            },
        ],
    }
}
