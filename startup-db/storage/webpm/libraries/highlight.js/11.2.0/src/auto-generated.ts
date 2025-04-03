
const runTimeDependencies = {
    "externals": {},
    "includedInBundle": {
        "highlight.js": "11.2.0"
    }
}
const externals = {}
const exportedSymbols = {}

const entries = {
    'highlight.js': './index.ts',
}
export const setup = {
    name:'highlight.js',
    assetId:'aGlnaGxpZ2h0Lmpz',
    version:'11.2.0',
    shortDescription:"Syntax highlighting with language autodetection.",
    apiVersion:'11',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
}

