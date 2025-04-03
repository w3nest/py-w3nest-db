
const runTimeDependencies = {
    "externals": {},
    "includedInBundle": {
        "codemirror": "5.52.0"
    }
}
const externals = {}
const exportedSymbols = {}

const entries = {
    'codemirror': './index.ts',
}
export const setup = {
    name:'codemirror',
    assetId:'Y29kZW1pcnJvcg==',
    version:'5.52.0',
    shortDescription:"Full-featured in-browser code editor",
    apiVersion:'5',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
}

