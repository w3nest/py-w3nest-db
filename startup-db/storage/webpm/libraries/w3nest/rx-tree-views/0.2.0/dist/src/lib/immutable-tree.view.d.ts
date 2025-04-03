import { VirtualDOM, AnyVirtualDOM, ChildrenLike, RxHTMLElement, RxChild } from 'rx-vdom';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
export type UpdatePropagationFct<NodeType> = (n: NodeType) => Record<string, unknown>;
export declare class Node {
    readonly children?: Node[] | Observable<Node[]>;
    readonly factory: new (params: unknown) => Node;
    readonly id: string;
    constructor({ id, children, }: {
        id: string;
        children?: Node[] | Observable<Node[]>;
    });
    resolvedChildren(): Node[];
    resolveChildren(): Observable<Node[]>;
}
export declare function find<NodeType extends Node>(node: NodeType, fct: (n: NodeType) => boolean): NodeType | undefined;
export declare function findResolved<NodeType extends Node>(node: NodeType, fct: (n: NodeType) => boolean): NodeType;
export interface Command<NodeType extends Node> {
    readonly metadata: unknown;
    execute(tree: State<NodeType>, emitUpdate: boolean, updatePropagationFct: UpdatePropagationFct<NodeType>): void;
}
export declare class InitCommand<NodeType extends Node> implements Command<NodeType> {
    readonly data: unknown;
    readonly metadata: unknown;
    constructor(data: unknown, metadata?: unknown);
    execute(): void;
}
export declare class AddChildCommand<NodeType extends Node> implements Command<NodeType> {
    readonly parentNode: NodeType;
    readonly childNode: NodeType;
    readonly metadata: unknown;
    constructor(parentNode: NodeType, childNode: NodeType, metadata?: unknown);
    execute(tree: State<NodeType>, emitUpdate?: boolean, updatePropagationFct?: UpdatePropagationFct<NodeType>): {
        root: NodeType;
        update: Updates<NodeType>;
    };
}
export declare class InsertChildCommand<NodeType extends Node> implements Command<NodeType> {
    readonly destination: {
        parent: NodeType;
        insertIndex?: number;
    };
    readonly childNode: NodeType;
    readonly metadata: unknown;
    constructor(destination: {
        parent: NodeType;
        insertIndex?: number;
    }, childNode: NodeType, metadata?: unknown);
    execute(tree: State<NodeType>, emitUpdate?: boolean, updatePropagationFct?: UpdatePropagationFct<NodeType>): {
        root: NodeType;
        update: Updates<NodeType>;
    };
}
export declare class RemoveNodeCommand<NodeType extends Node> implements Command<NodeType> {
    readonly parentNode: NodeType;
    readonly removedNode: NodeType;
    readonly metadata: unknown;
    constructor(parentNode: NodeType, removedNode: NodeType, metadata?: unknown);
    execute(tree: State<NodeType>, emitUpdate?: boolean): {
        root: NodeType;
        update: Updates<NodeType>;
    };
}
export declare class ReplaceNodeCommand<NodeType extends Node> implements Command<NodeType> {
    readonly oldNode: NodeType;
    readonly newNode: NodeType;
    readonly metadata: unknown;
    constructor(oldNode: NodeType, newNode: NodeType, metadata?: unknown);
    execute(tree: State<NodeType>, emitUpdate?: boolean, updatePropagationFct?: UpdatePropagationFct<NodeType>): {
        root: NodeType;
        update: Updates<NodeType>;
    };
}
export declare class MoveNodeCommand<NodeType extends Node> implements Command<NodeType> {
    readonly movedNode: NodeType;
    readonly destination: {
        reference: NodeType;
        direction?: 'above' | 'below';
    };
    readonly metadata: unknown;
    constructor(movedNode: NodeType, destination: {
        reference: NodeType;
        direction?: 'above' | 'below';
    }, metadata?: unknown);
    execute(tree: State<NodeType>, emitUpdate?: boolean, updatePropagationFct?: UpdatePropagationFct<NodeType>): {
        root: NodeType;
        update: Updates<NodeType>;
    };
}
export declare class ReplaceAttributesCommand<NodeType extends Node> implements Command<NodeType> {
    readonly node: NodeType;
    readonly attributes: Record<string, unknown>;
    readonly metadata: unknown;
    constructor(node: NodeType, attributes: Record<string, unknown>, metadata?: unknown);
    execute(tree: State<NodeType>, emitUpdate?: boolean, updatePropagationFct?: UpdatePropagationFct<NodeType>): {
        root: NodeType;
        update: Updates<NodeType>;
    };
}
export declare class Updates<NodeType extends Node> {
    readonly removedNodes: NodeType[];
    readonly addedNodes: NodeType[];
    readonly newTree: NodeType;
    readonly command: Command<NodeType>;
    replacedNodes: NodeType[];
    constructor(removedNodes: NodeType[], addedNodes: NodeType[], newTree: NodeType, command: Command<NodeType>);
}
export declare class State<NodeType extends Node> {
    readonly root$: ReplaySubject<NodeType>;
    readonly children$: Map<NodeType, ReplaySubject<NodeType[]>>;
    readonly directUpdates$: ReplaySubject<Updates<NodeType>[]>;
    private root;
    private parents;
    private tmpUpdates;
    private historic;
    private currentIndex;
    private subscriptions;
    expandedNodes$: BehaviorSubject<string[]>;
    selectedNode$: ReplaySubject<NodeType>;
    constructor({ rootNode, emitUpdate, expandedNodes, selectedNode, }: {
        rootNode: NodeType;
        emitUpdate?: boolean;
        expandedNodes?: string[] | BehaviorSubject<string[]>;
        selectedNode?: ReplaySubject<NodeType>;
    });
    reset(root: NodeType, emitUpdate?: boolean): void;
    unsubscribe(): void;
    getParent(nodeId: string): NodeType | undefined;
    reducePath<PathType>(start: string | NodeType, extractFct: (node: NodeType) => PathType): PathType[];
    getChildren(node: NodeType, then?: (node: NodeType, children: NodeType[]) => void): void;
    getChildren$(node: NodeType): ReplaySubject<NodeType[]>;
    undo(): void;
    redo(): void;
    getNode(id: string): NodeType | undefined;
    getNodeResolved(id: string): NodeType;
    addChild(parent: string | NodeType, childNode: NodeType, emitUpdate?: boolean, updatePropagationFct?: UpdatePropagationFct<NodeType>, cmdMetadata?: undefined): {
        root: NodeType;
        update: Updates<NodeType>;
    };
    insertChild(destination: {
        parent: string | NodeType;
        insertIndex?: number;
    }, childNode: NodeType, emitUpdate?: boolean, updatePropagationFct?: UpdatePropagationFct<NodeType>, cmdMetadata?: undefined): {
        root: NodeType;
        update: Updates<NodeType>;
    };
    private insertChildBase;
    removeNode(target: string | NodeType, emitUpdate?: boolean, updatePropagationFct?: UpdatePropagationFct<NodeType> | undefined, cmdMetadata?: unknown): {
        root: NodeType;
        update: Updates<NodeType>;
    };
    private removeNodeBase;
    replaceNode(target: string | NodeType, newNode: NodeType, emitUpdate?: boolean, updatePropagationFct?: UpdatePropagationFct<NodeType>, cmdMetadata?: unknown): {
        root: NodeType;
        update: Updates<NodeType>;
    };
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
    moveNode(target: string | NodeType, destination: {
        reference: string | NodeType;
        direction?: 'above' | 'below';
    }, emitUpdate?: boolean, updatePropagationFct?: UpdatePropagationFct<NodeType>, cmdMetadata?: unknown): {
        root: NodeType;
        update: Updates<NodeType>;
    };
    replaceAttributes(target: string | NodeType, newAttributes: Record<string, unknown>, emitUpdate?: boolean, updatePropagationFct?: UpdatePropagationFct<NodeType>, cmdMetadata?: unknown): {
        root: NodeType;
        update: Updates<NodeType>;
    };
    emitUpdate(): void;
    resolvePath(path: string[]): Observable<NodeType[]>;
    private cloneTreeAndReplacedChild;
    private setParentRec;
    selectNodeAndExpand(node: NodeType): void;
}
export interface AutoScrollMode {
    trigger: 'never' | 'always' | 'not-visible';
    top: number;
}
export interface TOptions {
    classes?: {
        header: string | ((node: Node, depth: number) => string);
        headerSelected: string;
    };
    stepPadding?: number;
    autoScroll?: AutoScrollMode;
}
export type THeaderView<NodeType extends Node> = (state: State<NodeType>, node: NodeType, root: NodeType) => AnyVirtualDOM;
export type TDropAreaView<NodeType extends Node> = (state: State<NodeType>, parent: NodeType, children: NodeType[], insertIndex: number) => AnyVirtualDOM;
export declare class View<NodeType extends Node> implements VirtualDOM<'div'> {
    static readonly staticOptions: Required<TOptions>;
    readonly state: State<NodeType>;
    readonly tag = "div";
    readonly children: ChildrenLike;
    readonly contextMenu$: Subject<{
        event: MouseEvent;
        data: {
            state: State<Node>;
            node: NodeType;
            root: NodeType;
        };
    }>;
    readonly selectedElement$: ReplaySubject<HTMLDivElement>;
    private readonly toggledNode$;
    private readonly subscriptions;
    private readonly headerView;
    private readonly dropAreaView;
    private readonly options;
    private readonly headerClassesFct;
    private scrollableParent;
    connectedCallback: (elem: RxHTMLElement<"div">) => void;
    constructor({ state, headerView, dropAreaView, options, ...rest }: {
        state: State<NodeType>;
        headerView: THeaderView<NodeType>;
        dropAreaView?: TDropAreaView<NodeType>;
        options?: TOptions;
        [_k: string]: unknown;
    });
    private onConnectedCallbackRoot;
    protected nodeView(root: NodeType, node: NodeType, depth: number): VirtualDOM<'div'> | undefined;
    protected rowView(root: NodeType, node: NodeType, nodeExpanded$: Observable<boolean>, depth: number): VirtualDOM<'div'> | undefined;
    protected arianeLine(depth: number, isLeaf: boolean): {
        tag: "div";
        class: string;
        style: {
            position: "absolute";
            top: string;
            left: string;
            'border-left': string;
            'border-left-width': string;
            height: string;
        };
    };
    protected handleView(node: NodeType, nodeExpanded$: Observable<boolean>): VirtualDOM<'div'> | VirtualDOM<'i'>;
    protected leftSpacing(depth: number): number;
    protected expandedContent$(root: NodeType, node: NodeType, nodeExpanded$: Observable<boolean>, depth: number): RxChild<NodeType[], VirtualDOM<'div'>>;
    private scrollNav;
}
