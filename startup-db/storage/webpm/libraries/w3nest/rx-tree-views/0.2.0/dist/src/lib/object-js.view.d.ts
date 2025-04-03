import { BehaviorSubject, Observable } from 'rxjs';
import { ImmutableTree } from './';
import { VirtualDOM } from 'rx-vdom';
type DataObject = Record<string, unknown>;
export declare class DataNode extends ImmutableTree.Node {
    name: string;
    nestedIndex: number;
    classes: string;
    constructor({ id, name, children, classes, nestedIndex, }: {
        id?: string;
        name: string;
        children?: Observable<ImmutableTree.Node[]>;
        classes: string;
        nestedIndex: number;
    });
}
export declare class UndefinedNode extends DataNode {
    constructor({ name, nestedIndex, id, }: {
        name: string;
        nestedIndex: number;
        id?: string;
    });
}
export declare class UnknownNode extends DataNode {
    constructor({ name, nestedIndex, id, }: {
        name: string;
        nestedIndex: number;
        id?: string;
    });
}
export declare class ValueNode<T> extends DataNode {
    data: T;
    classes: string;
    constructor({ name, data, classes, nestedIndex, id, }: {
        name: string;
        data: T;
        classes: string;
        nestedIndex: number;
        id?: string;
    });
}
export declare class NumberNode extends ValueNode<number> {
    constructor({ name, data, nestedIndex, id, }: {
        name: string;
        data: number;
        nestedIndex: number;
        id?: string;
    });
}
export declare class StringNode extends ValueNode<string> {
    constructor({ name, data, nestedIndex, id, }: {
        name: string;
        data: string;
        nestedIndex: number;
        id?: string;
    });
}
export declare class BoolNode extends ValueNode<boolean> {
    constructor({ name, data, nestedIndex, id, }: {
        name: string;
        data: boolean;
        nestedIndex: number;
        id?: string;
    });
}
export declare class ArrayBufferNode extends ValueNode<ArrayBuffer> {
    constructor({ name, data, nestedIndex, id, }: {
        name: string;
        data: ArrayBuffer;
        nestedIndex: number;
        id?: string;
    });
}
export declare class FunctionNode extends DataNode {
    data: Function;
    constructor({ name, data, nestedIndex, id, }: {
        name: string;
        data: Function;
        nestedIndex: number;
        id?: string;
    });
}
export declare class ObjectNode extends DataNode {
    getChildrenNodes(object: DataObject): ImmutableTree.Node[];
    data: DataObject;
    constructor({ name, data, nestedIndex, id, }: {
        name: string;
        data: DataObject;
        nestedIndex: number;
        id?: string;
    });
}
export declare class ArrayNode extends DataNode {
    data: unknown[];
    constructor({ name, data, nestedIndex, id, }: {
        name: string;
        data: unknown[];
        nestedIndex: number;
        id?: string;
    });
}
export declare class State extends ImmutableTree.State<DataNode> {
    readonly stringLengthLimit: any;
    constructor({ title, data, expandedNodes, ...rest }: {
        title: string;
        data: unknown;
        expandedNodes?: string[] | BehaviorSubject<string[]>;
    });
}
interface TOptions {
    stringLengthLimit?: number;
    containerClass?: string;
    containerStyle?: Record<string, string>;
}
export declare class View extends ImmutableTree.View<DataNode> {
    static defaultOptions: {
        containerClass: string;
        containerStyle: {
            'white-space': string;
        };
    };
    static getStyling(options: TOptions | undefined): TOptions;
    constructor({ state, options, ...rest }: {
        state: State;
        options?: TOptions;
    });
}
export declare function dataNodeHeaderView(state: State, node: DataNode): VirtualDOM<'div'>;
export {};
