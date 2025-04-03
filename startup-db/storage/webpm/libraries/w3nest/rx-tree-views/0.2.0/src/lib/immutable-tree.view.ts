import {
    VirtualDOM,
    AnyVirtualDOM,
    ChildrenLike,
    RxHTMLElement,
    RxChild,
    child$,
    attr$,
} from 'rx-vdom'
import {
    BehaviorSubject,
    Observable,
    of,
    ReplaySubject,
    Subject,
    Subscription,
    distinct,
    map,
    mergeMap,
    shareReplay,
    take,
    tap,
} from 'rxjs'

export type UpdatePropagationFct<NodeType> = (
    n: NodeType,
) => Record<string, unknown>
/*
Node are immutable hierarchical data structure
*/
export class Node {
    public readonly children?: Node[] | Observable<Node[]>
    public readonly factory: new (params: unknown) => Node
    public readonly id: string

    constructor({
        id,
        children,
    }: {
        id: string
        children?: Node[] | Observable<Node[]>
    }) {
        this.id = id
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        this.factory = Object.getPrototypeOf(this).constructor
        this.children = children
    }

    resolvedChildren(): Node[] {
        if (!this.children || this.children instanceof Observable) {
            throw Error('Children are not defined or have no been resolved yet')
        }
        return this.children
    }

    resolveChildren(): Observable<Node[]> {
        if (!this.children) {
            throw Error('No children to resolve')
        }
        if (Array.isArray(this.children)) {
            return of(this.children)
        }

        return this.children.pipe(
            take(1),
            tap((children: Node[]) => {
                const mutableThis = this as { children: Node[] }
                mutableThis.children = children
            }),
            map((children) => children),
            shareReplay({ bufferSize: 1, refCount: true }),
        )
    }
}

export function find<NodeType extends Node>(
    node: NodeType,
    fct: (n: NodeType) => boolean,
): NodeType | undefined {
    if (fct(node)) {
        return node
    }
    if (!node.children || node.children instanceof Observable) {
        return undefined
    }
    for (const child of node.children) {
        const target = find<NodeType>(child as NodeType, fct)
        if (target) {
            return target
        }
    }
}

export function findResolved<NodeType extends Node>(
    node: NodeType,
    fct: (n: NodeType) => boolean,
): NodeType {
    const n = find(node, fct)
    if (!n) {
        throw Error('Can not find node for given condition')
    }
    return n
}

export interface Command<NodeType extends Node> {
    readonly metadata: unknown
    execute(
        tree: State<NodeType>,
        emitUpdate: boolean,
        updatePropagationFct: UpdatePropagationFct<NodeType>,
    ): void
}

export class InitCommand<NodeType extends Node> implements Command<NodeType> {
    constructor(
        public readonly data: unknown,
        public readonly metadata: unknown = undefined,
    ) {}

    execute() {
        /* NOOP */
    }
}

export class AddChildCommand<NodeType extends Node>
    implements Command<NodeType>
{
    constructor(
        public readonly parentNode: NodeType,
        public readonly childNode: NodeType,
        public readonly metadata: unknown = undefined,
    ) {}

    execute(
        tree: State<NodeType>,
        emitUpdate = true,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
    ) {
        return tree.addChild(
            this.parentNode.id,
            this.childNode,
            emitUpdate,
            updatePropagationFct,
        )
    }
}

export class InsertChildCommand<NodeType extends Node>
    implements Command<NodeType>
{
    constructor(
        public readonly destination: {
            parent: NodeType
            insertIndex?: number
        },
        public readonly childNode: NodeType,
        public readonly metadata: unknown = undefined,
    ) {}

    execute(
        tree: State<NodeType>,
        emitUpdate = true,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
    ) {
        return tree.insertChild(
            this.destination,
            this.childNode,
            emitUpdate,
            updatePropagationFct,
        )
    }
}

export class RemoveNodeCommand<NodeType extends Node>
    implements Command<NodeType>
{
    constructor(
        public readonly parentNode: NodeType,
        public readonly removedNode: NodeType,
        public readonly metadata: unknown = undefined,
    ) {}

    execute(tree: State<NodeType>, emitUpdate = true) {
        return tree.removeNode(this.removedNode.id, emitUpdate)
    }
}

export class ReplaceNodeCommand<NodeType extends Node>
    implements Command<NodeType>
{
    constructor(
        public readonly oldNode: NodeType,
        public readonly newNode: NodeType,
        public readonly metadata: unknown = undefined,
    ) {}

    execute(
        tree: State<NodeType>,
        emitUpdate = true,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
    ) {
        return tree.replaceNode(
            this.oldNode.id,
            this.newNode,
            emitUpdate,
            updatePropagationFct,
        )
    }
}

export class MoveNodeCommand<NodeType extends Node>
    implements Command<NodeType>
{
    constructor(
        public readonly movedNode: NodeType,
        public readonly destination: {
            reference: NodeType
            direction?: 'above' | 'below'
        },
        public readonly metadata: unknown = undefined,
    ) {}

    execute(
        tree: State<NodeType>,
        emitUpdate = true,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
    ) {
        return tree.moveNode(
            this.movedNode.id,
            this.destination,
            emitUpdate,
            updatePropagationFct,
        )
    }
}

export class ReplaceAttributesCommand<NodeType extends Node>
    implements Command<NodeType>
{
    constructor(
        public readonly node: NodeType,
        public readonly attributes: Record<string, unknown>,
        public readonly metadata: unknown = undefined,
    ) {}

    execute(
        tree: State<NodeType>,
        emitUpdate = true,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
    ) {
        return tree.replaceAttributes(
            this.node.id,
            this.attributes,
            emitUpdate,
            updatePropagationFct,
        )
    }
}

export class Updates<NodeType extends Node> {
    replacedNodes: NodeType[]

    constructor(
        public readonly removedNodes: NodeType[],
        public readonly addedNodes: NodeType[],
        public readonly newTree: NodeType,
        public readonly command: Command<NodeType>,
    ) {
        this.replacedNodes = addedNodes.filter((newNode) =>
            removedNodes.find((oldNode) => oldNode.id === newNode.id),
        )
    }
}

export class State<NodeType extends Node> {
    public readonly root$ = new ReplaySubject<NodeType>(1)
    public readonly children$ = new Map<NodeType, ReplaySubject<NodeType[]>>()
    public readonly directUpdates$ = new ReplaySubject<Updates<NodeType>[]>()

    private root: NodeType
    private parents: Record<string, NodeType | undefined>
    private tmpUpdates = new Array<Updates<NodeType>>()
    private historic = new Array<NodeType>()
    private currentIndex = 0
    private subscriptions = new Subscription()
    expandedNodes$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(
        [],
    )
    selectedNode$: ReplaySubject<NodeType>

    constructor({
        rootNode,
        emitUpdate,
        expandedNodes,
        selectedNode,
    }: {
        rootNode: NodeType
        emitUpdate?: boolean
        expandedNodes?: string[] | BehaviorSubject<string[]>
        selectedNode?: ReplaySubject<NodeType>
    }) {
        emitUpdate = emitUpdate ?? true

        this.selectedNode$ = selectedNode ?? new ReplaySubject<NodeType>(1)

        this.expandedNodes$ =
            expandedNodes instanceof BehaviorSubject
                ? expandedNodes
                : new BehaviorSubject<string[]>(expandedNodes ?? [])

        this.subscriptions.add(
            this.root$.subscribe((root: NodeType) => {
                this.root = root
                this.children$.set(root, new ReplaySubject(1))

                const indexHistory = this.historic.indexOf(root)
                if (indexHistory === -1) {
                    if (this.currentIndex < this.historic.length - 1) {
                        this.historic = this.historic.slice(
                            0,
                            this.currentIndex + 1,
                        )
                    }
                    this.historic.push(root)
                    this.currentIndex = this.historic.length - 1
                    return
                }
                this.currentIndex = indexHistory
            }),
        )
        this.reset(rootNode, emitUpdate)
    }

    reset(root: NodeType, emitUpdate = true) {
        this.parents = {}
        this.historic = []
        this.currentIndex = 0
        this.setParentRec(root, undefined)
        this.root = root
        const update = new Updates<NodeType>(
            [],
            [],
            this.root,
            new InitCommand(root),
        )
        this.tmpUpdates.push(update)

        if (emitUpdate) {
            this.emitUpdate()
        }
    }

    unsubscribe() {
        this.subscriptions.unsubscribe()
    }

    getParent(nodeId: string): NodeType | undefined {
        return this.parents[nodeId]
    }

    reducePath<PathType>(
        start: string | NodeType,
        extractFct: (node: NodeType) => PathType,
    ): PathType[] {
        const node = start instanceof Node ? start : this.getNodeResolved(start)
        const parent = this.getParent(node.id)
        if (parent === undefined) {
            return [extractFct(this.root)]
        }
        return this.reducePath(parent, extractFct).concat([extractFct(node)])
    }

    getChildren(
        node: NodeType,
        then?: (node: NodeType, children: NodeType[]) => void,
    ) {
        if (!node.children) {
            return
        }

        if (Array.isArray(node.children)) {
            this.getChildren$(node).next(node.children as NodeType[])
            then?.(node, node.children as NodeType[])
            return
        }
        const resolved = node.resolveChildren()
        this.subscriptions.add(
            resolved.subscribe((children: NodeType[]) => {
                children.forEach((child) => {
                    this.setParentRec(child, node)
                })
                this.getChildren$(node).next(children)
                then?.(node, children)
            }),
        )
    }

    getChildren$(node: NodeType): ReplaySubject<NodeType[]> {
        const s = this.children$.get(node)
        if (!s) {
            const newChildren$ = new ReplaySubject<NodeType[]>(1)
            this.children$.set(node, newChildren$)
            return newChildren$
        }
        return s
    }

    undo() {
        if (this.currentIndex === 0) {
            return
        }
        this.root$.next(this.historic[this.currentIndex - 1])
    }

    redo() {
        if (this.currentIndex === this.historic.length - 1) {
            return
        }
        this.root$.next(this.historic[this.currentIndex + 1])
    }

    getNode(id: string): NodeType | undefined {
        if (id === this.root.id) {
            return this.root
        }

        const parent = this.parents[id] ?? this.root

        if (!parent.children || parent.children instanceof Observable) {
            throw Error(' Can not get node od unresolved parent')
        }
        return parent.children.find((node) => node.id === id) as NodeType
    }

    getNodeResolved(id: string): NodeType {
        const n = this.getNode(id)
        if (!n) {
            throw Error(`The node ${id} is not found.`)
        }
        return n
    }

    addChild(
        parent: string | NodeType,
        childNode: NodeType,
        emitUpdate = true,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
        cmdMetadata = undefined,
    ) {
        const { parentNode } = this.insertChildBase(
            { parent },
            childNode,
            updatePropagationFct,
        )
        const update: Updates<NodeType> = new Updates<NodeType>(
            [],
            [childNode],
            this.root,
            new AddChildCommand(parentNode, childNode, cmdMetadata),
        )
        this.tmpUpdates.push(update)

        if (emitUpdate) {
            this.emitUpdate()
        }

        return { root: this.root, update }
    }

    insertChild(
        destination: { parent: string | NodeType; insertIndex?: number },
        childNode: NodeType,
        emitUpdate = true,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
        cmdMetadata = undefined,
    ) {
        const { parentNode } = this.insertChildBase(
            destination,
            childNode,
            updatePropagationFct,
        )
        const update: Updates<NodeType> = new Updates<NodeType>(
            [],
            [childNode],
            this.root,
            new InsertChildCommand(
                {
                    parent: parentNode,
                    insertIndex: destination.insertIndex,
                },
                childNode,
                cmdMetadata,
            ),
        )
        this.tmpUpdates.push(update)

        if (emitUpdate) {
            this.emitUpdate()
        }

        return { root: this.root, update }
    }

    private insertChildBase(
        destination: { parent: string | NodeType; insertIndex?: number },
        childNode: NodeType,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
    ) {
        const parentNode =
            destination.parent instanceof Node
                ? destination.parent
                : this.getNode(destination.parent)

        if (!parentNode) {
            throw Error('Can not find the parent to add the child')
        }

        if (!parentNode.children || parentNode.children instanceof Observable) {
            throw Error(
                'You can not add a child to a node not already resolved',
            )
        }

        const newChild = new childNode.factory({
            ...childNode,
            ...updatePropagationFct(childNode),
        }) as NodeType
        const newChildren = [
            ...parentNode.children.filter((child) => child.id !== newChild.id),
        ]
        const index = destination.insertIndex ?? parentNode.children.length
        newChildren.splice(index, 0, newChild)

        const newParent = new parentNode.factory({
            ...parentNode,
            ...{ children: newChildren },
            ...updatePropagationFct(parentNode),
        }) as NodeType
        newChildren.forEach((child: NodeType) => {
            this.setParentRec(child, newParent)
        })
        this.root = this.cloneTreeAndReplacedChild(
            parentNode,
            newParent,
            updatePropagationFct,
        )
        return { parentNode }
    }

    removeNode(
        target: string | NodeType,
        emitUpdate = true,
        updatePropagationFct:
            | UpdatePropagationFct<NodeType>
            | undefined = undefined,
        cmdMetadata: unknown = undefined,
    ) {
        if (updatePropagationFct) {
            console.error('`removeNode` does not use `updatePropagationFct`.')
        }
        const { newParent, node } = this.removeNodeBase(target)

        const update: Updates<NodeType> = new Updates<NodeType>(
            [node],
            [],
            this.root,
            new RemoveNodeCommand(newParent, node, cmdMetadata),
        )
        this.tmpUpdates.push(update)

        if (emitUpdate) {
            this.emitUpdate()
        }

        return { root: this.root, update }
    }

    private removeNodeBase(target: string | NodeType) {
        const node = target instanceof Node ? target : this.getNode(target)

        if (!node) {
            throw Error('Can not find the node to remove')
        }

        const parentNode = this.parents[node.id]

        if (!parentNode) {
            throw Error('Can not find the parent of the node to remove')
        }

        if (!parentNode.children || parentNode.children instanceof Observable) {
            throw Error(
                'You can not remove a child from a node not already resolved',
            )
        }
        const newChildren = parentNode.children.filter(
            (child) => child.id !== node.id,
        ) as NodeType[]
        const newParent = new parentNode.factory({
            ...parentNode,
            ...{
                children: newChildren,
            },
        }) as NodeType
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [node.id]: _, ...rest } = this.parents
        this.parents = rest
        newChildren.forEach((c) => (this.parents[c.id] = newParent))

        if (this.children$.has(node)) {
            this.children$.delete(node)
        }

        this.root = this.cloneTreeAndReplacedChild(
            parentNode,
            newParent,
            () => ({}),
        )
        return { newParent, node }
    }

    replaceNode(
        target: string | NodeType,
        newNode: NodeType,
        emitUpdate = true,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
        cmdMetadata: unknown = undefined,
    ) {
        const oldNode = target instanceof Node ? target : this.getNode(target)

        if (!oldNode) {
            throw Error('Can not find the node to remove')
        }

        if (Array.isArray(newNode.children)) {
            newNode.children.forEach((child: NodeType) => {
                this.setParentRec(child, newNode)
            })
        }

        this.root = this.cloneTreeAndReplacedChild(
            oldNode,
            newNode,
            updatePropagationFct,
        )
        const update: Updates<NodeType> = new Updates<NodeType>(
            [oldNode],
            [newNode],
            this.root,
            new ReplaceNodeCommand(oldNode, newNode, cmdMetadata),
        )
        this.tmpUpdates.push(update)

        if (emitUpdate) {
            this.emitUpdate()
        }

        return { root: this.root, update }
    }

    /**
     * @param target the node to move
     * @param destination
     * @param destination.reference a node used as reference
     * @param destination.direction
     *   * if 'above': put the node above the reference
     *   * if 'below'; put the node below the reference
     *   * if 'none': add the node as child of reference
     * @param emitUpdate whether or not to notify the update
     * @param updatePropagationFct a function that is called to append properties on node
     * @param cmdMetadata metadata to add to the command
     * */
    moveNode(
        target: string | NodeType,
        destination: {
            reference: string | NodeType
            direction?: 'above' | 'below'
        },
        emitUpdate = true,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
        cmdMetadata: unknown = undefined,
    ) {
        const movedNode = target instanceof Node ? target : this.getNode(target)
        if (!movedNode) {
            throw Error('Can not find the node to move')
        }
        this.removeNodeBase(movedNode)
        const reference =
            destination.reference instanceof Node
                ? destination.reference
                : this.getNode(destination.reference)

        if (!reference) {
            throw Error('Can not find the reference node to move into')
        }

        const parentNode = destination.direction
            ? this.getParent(reference.id)
            : reference

        if (!parentNode) {
            throw Error('Can not find the reference node to move into')
        }
        if (destination.direction) {
            const resolvedChildren = parentNode.resolvedChildren()
            const insertIndex =
                resolvedChildren.indexOf(reference) +
                (destination.reference === 'above' ? -1 : 0)
            this.insertChildBase(
                { parent: parentNode, insertIndex },
                movedNode,
                updatePropagationFct,
            )
        } else {
            this.insertChildBase(
                { parent: parentNode },
                movedNode,
                updatePropagationFct,
            )
        }

        const update: Updates<NodeType> = new Updates<NodeType>(
            [movedNode],
            [this.getNodeResolved(movedNode.id)],
            this.root,
            new MoveNodeCommand(
                movedNode,
                {
                    reference: this.getNodeResolved(reference.id),
                    direction: destination.direction,
                },
                cmdMetadata,
            ),
        )
        this.tmpUpdates.push(update)

        if (emitUpdate) {
            this.emitUpdate()
        }

        return { root: this.root, update }
    }

    replaceAttributes(
        target: string | NodeType,
        newAttributes: Record<string, unknown>,
        emitUpdate = true,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
        cmdMetadata: unknown = undefined,
    ) {
        const node = target instanceof Node ? target : this.getNode(target)

        if (!node) {
            throw Error('Can not find the node to remove')
        }

        const newNode = new node.factory({
            ...node,
            ...newAttributes,
            ...updatePropagationFct(node),
        }) as NodeType
        const newChildren = newNode.children as NodeType[]
        newChildren.forEach((c) => (this.parents[c.id] = newNode))
        this.root = this.cloneTreeAndReplacedChild(
            node,
            newNode,
            updatePropagationFct,
        )
        const update: Updates<NodeType> = new Updates<NodeType>(
            [node],
            [newNode],
            this.root,
            new ReplaceAttributesCommand(node, newAttributes, cmdMetadata),
        )
        this.tmpUpdates.push(update)

        if (emitUpdate) {
            this.emitUpdate()
        }

        return { root: this.root, update }
    }

    emitUpdate() {
        this.root$.next(this.root)
        this.directUpdates$.next(this.tmpUpdates)
        this.tmpUpdates = []
    }

    resolvePath(path: string[]): Observable<NodeType[]> {
        const resolveChildrenRec = () => {
            return (
                source$: Observable<{
                    index: number
                    nodesResolved: NodeType[]
                }>,
            ) => {
                return source$.pipe(
                    take(1),
                    mergeMap(({ index, nodesResolved }) => {
                        if (index === path.length) {
                            return of(nodesResolved)
                        }
                        const node = this.getNodeResolved(path[index])
                        this.getChildren(node)
                        return this.getChildren$(node).pipe(
                            take(1),
                            map(() => {
                                return {
                                    index: index + 1,
                                    nodesResolved: [...nodesResolved, node],
                                }
                            }),
                            resolveChildrenRec(),
                        )
                    }),
                )
            }
        }
        const indexUnresolved = path.findIndex(
            (childId) => this.getNode(childId) === undefined,
        )
        return of({
            index: Math.max(0, indexUnresolved - 1),
            nodesResolved: [],
        }).pipe(resolveChildrenRec())
    }

    private cloneTreeAndReplacedChild(
        oldChild: NodeType,
        newChild: NodeType,
        updatePropagationFct: UpdatePropagationFct<NodeType> = () => ({}),
    ): NodeType {
        const oldParent = this.parents[oldChild.id]
        if (oldParent === undefined) {
            return newChild
        }

        if (!oldParent.children || oldParent.children instanceof Observable) {
            throw Error(
                'You can not add a child to a node not already resolved',
            )
        }
        const newChildren = oldParent.children.map((child) =>
            child.id === oldChild.id ? newChild : child,
        ) as NodeType[]

        const newParent = new oldParent.factory({
            ...oldParent,
            ...{
                children: newChildren,
            },
            ...updatePropagationFct(oldParent),
        }) as NodeType
        newChildren.forEach((child) => (this.parents[child.id] = newParent))

        if (this.children$.has(oldChild)) {
            this.children$.delete(oldChild)
            this.getChildren$(newChild)
        }

        // noinspection TailRecursionJS
        return this.cloneTreeAndReplacedChild(
            oldParent,
            newParent,
            updatePropagationFct,
        )
    }

    private setParentRec(node: NodeType, parentNode: NodeType | undefined) {
        this.parents[node.id] = parentNode
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child) => {
                this.setParentRec(child as NodeType, node)
            })
        }
    }

    selectNodeAndExpand(node: NodeType): void {
        this.selectedNode$.next(node)

        // Expand tree to show this node. This could (should ?) be implemented in immutable-tree.view.ts
        const ensureExpanded: string[] = [node.id]

        // Ensure parents nodes are also expanded
        let parent = this.getParent(node.id)
        while (parent !== undefined) {
            ensureExpanded.push(parent.id)
            parent = this.getParent(parent.id)
        }
        // Put parents at the beginning
        ensureExpanded.reverse()

        // Currently expanded nodes
        const actualExpanded = this.expandedNodes$.getValue()

        // One-liner for filtering unique values of an array
        const arrayUniq = (v: string, i: number, s: string[]) =>
            s.indexOf(v) === i
        // What we want
        const expectedExpanded = actualExpanded
            .concat(ensureExpanded)
            .filter(arrayUniq)

        // Update tree expanded nodes
        this.expandedNodes$.next(expectedExpanded)
    }
}

//-------------------------------------------------------------------------
//-------------------------------------------------------------------------

export interface AutoScrollMode {
    trigger: 'never' | 'always' | 'not-visible'
    // in % of the scrollable parent height
    top: number
}
export interface TOptions {
    classes?: {
        header: string | ((node: Node, depth: number) => string)
        headerSelected: string
    }
    stepPadding?: number
    autoScroll?: AutoScrollMode
}

export type THeaderView<NodeType extends Node> = (
    state: State<NodeType>,
    node: NodeType,
    root: NodeType,
) => AnyVirtualDOM

export type TDropAreaView<NodeType extends Node> = (
    state: State<NodeType>,
    parent: NodeType,
    children: NodeType[],
    insertIndex: number,
) => AnyVirtualDOM

export class View<NodeType extends Node> implements VirtualDOM<'div'> {
    static readonly staticOptions: Required<TOptions> = {
        classes: {
            header: (_, depth: number) =>
                `d-flex align-items-baseline rxtree-header rxtree-depth-${String(depth)} `,
            headerSelected: 'rxtree-selected',
        },
        stepPadding: 15,
        autoScroll: { trigger: 'not-visible' as const, top: 50 },
    }

    public readonly state: State<NodeType>
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    public readonly contextMenu$ = new Subject<{
        event: MouseEvent
        data: { state: State<Node>; node: NodeType; root: NodeType }
    }>()
    public readonly selectedElement$ = new ReplaySubject<HTMLDivElement>(1)
    private readonly toggledNode$ = new Subject<string>()
    private readonly subscriptions = new Array<Subscription>()

    private readonly headerView: THeaderView<NodeType>
    private readonly dropAreaView: TDropAreaView<NodeType> | undefined
    private readonly options: Required<TOptions>
    private readonly headerClassesFct: (n: NodeType, depth: number) => string
    private scrollableParent: HTMLElement | undefined

    connectedCallback = (elem: RxHTMLElement<'div'>) => {
        elem.subscriptions = elem.subscriptions.concat(this.subscriptions)
    }

    constructor({
        state,
        headerView,
        dropAreaView,
        options,
        ...rest
    }: {
        state: State<NodeType>
        headerView: THeaderView<NodeType>
        dropAreaView?: TDropAreaView<NodeType>
        options?: TOptions
        [_k: string]: unknown
    }) {
        Object.assign(this, rest)
        this.options = Object.assign(View.staticOptions, options)
        this.headerClassesFct =
            typeof this.options.classes.header == 'string'
                ? () => this.options.classes.header as string
                : this.options.classes.header

        this.state = state
        this.headerView = headerView
        this.dropAreaView = dropAreaView

        const content$ = child$({
            source$: this.state.root$,
            vdomMap: (root) => {
                const rootView = this.nodeView(root, root, 0)
                if (!rootView) {
                    throw Error('Failed to retrieve the view of the root node.')
                }
                rootView.connectedCallback = (elem: RxHTMLElement<'div'>) => {
                    this.onConnectedCallbackRoot(elem)
                }
                return rootView
            },
        })
        this.children = [content$]
        if (this.options.autoScroll.trigger !== 'never') {
            this.connectedCallback = (elem: RxHTMLElement<'div'>) => {
                elem.ownSubscriptions(
                    this.selectedElement$.subscribe((selected) => {
                        this.scrollNav(selected)
                    }),
                )
            }
        }
    }

    private onConnectedCallbackRoot(elem: RxHTMLElement<'div'>) {
        elem.subscriptions.push(
            this.toggledNode$.subscribe((nodeId) => {
                const actualValues = this.state.expandedNodes$.getValue()
                if (actualValues.includes(nodeId)) {
                    this.state.expandedNodes$.next(
                        actualValues.filter((n) => n !== nodeId),
                    )
                    return
                }
                this.state.expandedNodes$.next([...actualValues, nodeId])
            }),
        )
    }

    protected nodeView(
        root: NodeType,
        node: NodeType,
        depth: number,
    ): VirtualDOM<'div'> | undefined {
        const isLeaf = node.children === undefined
        const nodeExpanded$ = this.state.expandedNodes$.pipe(
            map((expandedNodes) => expandedNodes.includes(node.id)),
            tap((expanded) => {
                if (expanded) {
                    this.state.getChildren(node)
                }
                return expanded // expanded ? this.state.getChildren(node) : {}
            }),
        )
        const rowView = this.rowView(root, node, nodeExpanded$, depth)
        if (rowView === undefined) {
            return undefined
        }

        return {
            tag: 'div',
            id: 'node-' + node.id,
            style: { position: 'relative' },
            children: [
                rowView,
                this.expandedContent$(root, node, nodeExpanded$, depth),
                this.arianeLine(depth, isLeaf),
            ],
        }
    }

    protected rowView(
        root: NodeType,
        node: NodeType,
        nodeExpanded$: Observable<boolean>,
        depth: number,
    ): VirtualDOM<'div'> | undefined {
        const space = this.leftSpacing(depth)
        const itemHeader = this.headerView(this.state, node, root)

        const class$ = attr$({
            source$: this.state.selectedNode$,
            vdomMap: (selected): string =>
                selected.id === node.id
                    ? this.options.classes.headerSelected || ''
                    : '',
            wrapper: (d) => this.headerClassesFct(node, depth) + ' ' + d,
            untilFirst: this.headerClassesFct(node, depth),
        })

        return {
            tag: 'div',
            class: class$,
            children: [
                { tag: 'div', style: { minWidth: `${String(space)}px` } },
                this.handleView(node, nodeExpanded$),
                itemHeader,
            ],
            oncontextmenu: (event) => {
                event.preventDefault()
                this.state.selectedNode$.next(node)
                this.contextMenu$.next({
                    event,
                    data: { node, state: this.state, root },
                })
            },
            onclick: () => {
                this.state.selectedNode$.next(node)
                if (!this.state.expandedNodes$.getValue().includes(node.id)) {
                    this.toggledNode$.next(node.id)
                }
            },
            connectedCallback: (elem) => {
                elem.ownSubscriptions(
                    this.state.selectedNode$.subscribe((selected) => {
                        if (selected === node) {
                            setTimeout(() => {
                                this.selectedElement$.next(elem)
                            }, 0)
                        }
                    }),
                )
            },
        }
    }

    protected arianeLine(depth: number, isLeaf: boolean) {
        const space = this.leftSpacing(depth)
        const stepPaddingStr = String(this.options.stepPadding)
        return {
            tag: 'div' as const,
            class: 'fv-tree-arianeLine',
            style: {
                position: 'absolute' as const,
                top: `${stepPaddingStr}px`,
                left: `${String(space)}px`,
                'border-left': isLeaf ? 'none' : 'solid',
                'border-left-width': '1px',
                height: `calc(100% - ${stepPaddingStr}px)`,
            },
        }
    }

    protected handleView(
        node: NodeType,
        nodeExpanded$: Observable<boolean>,
    ): VirtualDOM<'div'> | VirtualDOM<'i'> {
        const isLeaf = node.children === undefined

        return isLeaf
            ? { tag: 'div' as const }
            : {
                  tag: 'i' as const,
                  class: attr$({
                      source$: nodeExpanded$,
                      vdomMap: (expanded): string => {
                          if (expanded) {
                              return 'fa-caret-down fv-tree-expanded'
                          }
                          return 'fa-caret-right'
                      },
                      wrapper: (d) => 'pr-2 fas fv-tree-expand ' + d,
                  }),
                  onclick: (event) => {
                      this.toggledNode$.next(node.id)
                      event.stopPropagation()
                  },
              }
    }

    protected leftSpacing(depth: number) {
        return depth * this.options.stepPadding + 5
    }

    protected expandedContent$(
        root: NodeType,
        node: NodeType,
        nodeExpanded$: Observable<boolean>,
        depth: number,
    ): RxChild<NodeType[], VirtualDOM<'div'>> {
        const children$ = this.state.getChildren$(node).pipe(distinct())
        return child$({
            source$: children$,
            vdomMap: (children) => {
                const filteredViews = children
                    .map((child) => {
                        return {
                            child,
                            view: this.nodeView(root, child, depth + 1),
                        }
                    })
                    .filter(({ view }) => view !== undefined)
                const filteredChildren = filteredViews.map(({ child }) => child)

                return {
                    tag: 'div',
                    class: attr$({
                        source$: nodeExpanded$,
                        vdomMap: (expanded) =>
                            expanded ? 'd-block' : 'd-none',
                    }),
                    children: filteredViews
                        .map(({ view }, i) => {
                            const dropView = (insertIndex: number) =>
                                this.dropAreaView
                                    ? this.dropAreaView(
                                          this.state,
                                          node,
                                          filteredChildren,
                                          insertIndex,
                                      )
                                    : undefined
                            return [
                                dropView(i),
                                view,
                                i === children.length - 1
                                    ? dropView(children.length)
                                    : undefined,
                            ]
                        })
                        .flat()
                        .filter((d) => d !== undefined),
                }
            },
        })
    }

    private scrollNav(selected: HTMLDivElement) {
        if (!this.scrollableParent) {
            this.scrollableParent = getNearestScrollableParent(selected)
        }
        const scrollable = this.scrollableParent
        if (!scrollable) {
            return
        }
        if (
            this.options.autoScroll.trigger === 'not-visible' &&
            isElementInViewport(selected)
        ) {
            return
        }
        let targetOffsetTop = selected.offsetTop
        let parent = selected.offsetParent
        while (parent instanceof HTMLElement && parent !== scrollable) {
            targetOffsetTop += parent.offsetTop
            parent = parent.offsetParent
        }
        const br = scrollable.getBoundingClientRect()
        scrollable.scrollTo({
            top:
                targetOffsetTop -
                br.top -
                (this.options.autoScroll.top / 100) * (br.bottom - br.top),
            left: 0,
            behavior: 'smooth',
        })
    }
}

function getNearestScrollableParent(
    element: HTMLElement,
): HTMLElement | undefined {
    let parent = element.parentElement

    while (parent) {
        const overflowY = window.getComputedStyle(parent).overflowY
        if (overflowY === 'auto' || overflowY === 'scroll') {
            return parent
        }
        parent = parent.parentElement
    }

    return undefined
}

function isElementInViewport(element: HTMLElement) {
    const { top, left, bottom, right } = element.getBoundingClientRect()
    const hMax = window.innerHeight || document.documentElement.clientHeight
    const wMax = window.innerWidth || document.documentElement.clientWidth
    const inViewPortY = top >= 0 && bottom <= hMax
    const inViewPortX = left >= 0 && right <= wMax

    return inViewPortX && inViewPortY
}
