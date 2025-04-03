import { SrcHighlight } from '../common';
export declare function parseTypescript(tsSrc: string): {
    tsSrc: string;
    jsSrc: string;
};
export declare function getHighlights(fsMap: any, src: any): SrcHighlight[];
