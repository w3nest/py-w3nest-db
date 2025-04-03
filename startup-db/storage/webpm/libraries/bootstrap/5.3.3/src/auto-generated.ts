
const runTimeDependencies = {
    "externals": {
        "@popperjs/core": "^2.11.8"
    },
    "includedInBundle": {
        "bootstrap": "5.3.3"
    }
}
const externals = {
    "@popperjs/core": {
        "commonjs": "@popperjs/core",
        "commonjs2": "@popperjs/core",
        "root": "@popperjs/core_APIv2"
    }
}
const exportedSymbols = {
    "@popperjs/core": {
        "apiKey": "2",
        "exportedSymbol": "@popperjs/core"
    }
}

const entries = {
    'bootstrap': './index.ts',
}
export const setup = {
    name:'bootstrap',
    assetId:'Ym9vdHN0cmFw',
    version:'5.3.3',
    shortDescription:"The most popular front-end framework for developing responsive, mobile first projects on the web.",
    apiVersion:'5',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
}

