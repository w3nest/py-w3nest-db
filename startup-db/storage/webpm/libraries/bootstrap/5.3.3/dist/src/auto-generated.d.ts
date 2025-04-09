export declare const setup: {
    name: string;
    assetId: string;
    version: string;
    shortDescription: string;
    apiVersion: string;
    runTimeDependencies: {
        externals: {
            "@popperjs/core": string;
        };
        includedInBundle: {
            bootstrap: string;
        };
    };
    externals: {
        "@popperjs/core": {
            commonjs: string;
            commonjs2: string;
            root: string;
        };
    };
    exportedSymbols: {
        "@popperjs/core": {
            apiKey: string;
            exportedSymbol: string;
        };
    };
    entries: {
        bootstrap: string;
    };
};
