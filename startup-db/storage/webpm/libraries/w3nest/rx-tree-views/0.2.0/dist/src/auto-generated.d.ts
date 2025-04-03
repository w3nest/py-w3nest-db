export declare const setup: {
    name: string;
    assetId: string;
    version: string;
    shortDescription: string;
    developerDocumentation: string;
    npmPackage: string;
    sourceGithub: string;
    userGuide: string;
    apiVersion: string;
    runTimeDependencies: {
        externals: {
            "rx-vdom": string;
            rxjs: string;
        };
        includedInBundle: {};
    };
    externals: {
        "rx-vdom": {
            commonjs: string;
            commonjs2: string;
            root: string;
        };
        rxjs: {
            commonjs: string;
            commonjs2: string;
            root: string;
        };
    };
    exportedSymbols: {
        "rx-vdom": {
            apiKey: string;
            exportedSymbol: string;
        };
        rxjs: {
            apiKey: string;
            exportedSymbol: string;
        };
    };
    entries: {
        '@w3nest/rx-tree-views': string;
    };
    secondaryEntries: {
        [k: string]: {
            entryFile: string;
            name: string;
            loadDependencies: string[];
        };
    };
    getDependencySymbolExported: (module: string) => string;
    installMainModule: ({ cdnClient, installParameters }: {
        cdnClient: {
            install: (_: unknown) => Promise<WindowOrWorkerGlobalScope>;
        };
        installParameters?: any;
    }) => Promise<any>;
    installAuxiliaryModule: ({ name, cdnClient, installParameters }: {
        name: string;
        cdnClient: {
            install: (_: unknown) => Promise<WindowOrWorkerGlobalScope>;
        };
        installParameters?: any;
    }) => Promise<any>;
    getCdnDependencies(name?: string): string[];
};
