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
            "@typescript/vfs": string;
            "@w3nest/webpm-client": string;
            codemirror: string;
            "rx-vdom": string;
            rxjs: string;
            typescript: string;
        };
        includedInBundle: {};
    };
    externals: {
        "@typescript/vfs": {
            commonjs: string;
            commonjs2: string;
            root: string;
        };
        "@w3nest/webpm-client": {
            commonjs: string;
            commonjs2: string;
            root: string;
        };
        codemirror: {
            commonjs: string;
            commonjs2: string;
            root: string;
        };
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
        "rxjs/operators": {
            commonjs: string;
            commonjs2: string;
            root: string[];
        };
        typescript: {
            commonjs: string;
            commonjs2: string;
            root: string;
        };
    };
    exportedSymbols: {
        "@typescript/vfs": {
            apiKey: string;
            exportedSymbol: string;
        };
        "@w3nest/webpm-client": {
            apiKey: string;
            exportedSymbol: string;
        };
        codemirror: {
            apiKey: string;
            exportedSymbol: string;
        };
        "rx-vdom": {
            apiKey: string;
            exportedSymbol: string;
        };
        rxjs: {
            apiKey: string;
            exportedSymbol: string;
        };
        typescript: {
            apiKey: string;
            exportedSymbol: string;
        };
    };
    entries: {
        '@w3nest/rx-code-mirror-editors': string;
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
