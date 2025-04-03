export * as Common from './common';
export type TsCodeEditorModule = typeof import('./typescript');
export declare function TypescriptModule({ installParameters, }?: {
    installParameters?: any;
}): Promise<TsCodeEditorModule>;
