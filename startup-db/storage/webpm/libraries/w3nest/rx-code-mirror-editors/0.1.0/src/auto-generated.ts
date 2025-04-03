/* eslint-disable */
const runTimeDependencies = {
    "externals": {
        "@typescript/vfs": "^1.4.0",
        "@w3nest/webpm-client": "^0.1.0",
        "codemirror": "^5.52.0",
        "rx-vdom": "^0.1.0",
        "rxjs": "^7.5.6",
        "typescript": "5.6.3"
    },
    "includedInBundle": {}
}
const externals = {
    "@typescript/vfs": {
        "commonjs": "@typescript/vfs",
        "commonjs2": "@typescript/vfs",
        "root": "@typescript/vfs_APIv1"
    },
    "@w3nest/webpm-client": {
        "commonjs": "@w3nest/webpm-client",
        "commonjs2": "@w3nest/webpm-client",
        "root": "@w3nest/webpm-client_APIv01"
    },
    "codemirror": {
        "commonjs": "codemirror",
        "commonjs2": "codemirror",
        "root": "codemirror_APIv5"
    },
    "rx-vdom": {
        "commonjs": "rx-vdom",
        "commonjs2": "rx-vdom",
        "root": "rx-vdom_APIv01"
    },
    "rxjs": {
        "commonjs": "rxjs",
        "commonjs2": "rxjs",
        "root": "rxjs_APIv7"
    },
    "rxjs/operators": {
        "commonjs": "rxjs/operators",
        "commonjs2": "rxjs/operators",
        "root": [
            "rxjs_APIv7",
            "operators"
        ]
    },
    "typescript": {
        "commonjs": "typescript",
        "commonjs2": "typescript",
        "root": "typescript_APIv5"
    }
}
const exportedSymbols = {
    "@typescript/vfs": {
        "apiKey": "1",
        "exportedSymbol": "@typescript/vfs"
    },
    "@w3nest/webpm-client": {
        "apiKey": "01",
        "exportedSymbol": "@w3nest/webpm-client"
    },
    "codemirror": {
        "apiKey": "5",
        "exportedSymbol": "codemirror"
    },
    "rx-vdom": {
        "apiKey": "01",
        "exportedSymbol": "rx-vdom"
    },
    "rxjs": {
        "apiKey": "7",
        "exportedSymbol": "rxjs"
    },
    "typescript": {
        "apiKey": "5",
        "exportedSymbol": "typescript"
    }
}

const mainEntry : {entryFile: string,loadDependencies:string[]} = {
    "entryFile": "./lib/index.ts",
    "loadDependencies": [
        "rx-vdom",
        "rxjs",
        "@w3nest/webpm-client",
        "codemirror"
    ]
}

const secondaryEntries : {[k:string]:{entryFile: string, name: string, loadDependencies:string[]}}= {
    "typescript-addon": {
        "entryFile": "./lib/typescript/index.ts",
        "loadDependencies": [
            "typescript",
            "@typescript/vfs"
        ],
        "name": "typescript-addon"
    }
}

const entries = {
     '@w3nest/rx-code-mirror-editors': './lib/index.ts',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@w3nest/rx-code-mirror-editors/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@w3nest/rx-code-mirror-editors',
        assetId:'QHczbmVzdC9yeC1jb2RlLW1pcnJvci1lZGl0b3Jz',
    version:'0.1.0',
    shortDescription:"Code editors (typescript, python) using codemirror.",
    developerDocumentation:'https://platform.youwol.com/apps/@youwol/cdn-explorer/latest?package=@w3nest/rx-code-mirror-editors&tab=doc',
    npmPackage:'https://www.npmjs.com/package/@w3nest/rx-code-mirror-editors',
    sourceGithub:'https://github.com/w3nest/rx-code-mirror-editors',
    userGuide:'',
    apiVersion:'01',
    runTimeDependencies,
    externals,
    exportedSymbols,
    entries,
    secondaryEntries,
    getDependencySymbolExported: (module:string) => {
        return `${exportedSymbols[module].exportedSymbol}_APIv${exportedSymbols[module].apiKey}`
    },

    installMainModule: ({cdnClient, installParameters}:{
        cdnClient:{install:(_:unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const parameters = installParameters || {}
        const scripts = parameters.scripts || []
        const modules = [
            ...(parameters.modules || []),
            ...mainEntry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@w3nest/rx-code-mirror-editors_APIv01`]
        })
    },
    installAuxiliaryModule: ({name, cdnClient, installParameters}:{
        name: string,
        cdnClient:{install:(_:unknown) => Promise<WindowOrWorkerGlobalScope>},
        installParameters?
    }) => {
        const entry = secondaryEntries[name]
        if(!entry){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const parameters = installParameters || {}
        const scripts = [
            ...(parameters.scripts || []),
            `@w3nest/rx-code-mirror-editors#0.1.0~dist/@w3nest/rx-code-mirror-editors/${entry.name}.js`
        ]
        const modules = [
            ...(parameters.modules || []),
            ...entry.loadDependencies.map( d => `${d}#${runTimeDependencies.externals[d]}`)
        ]
        return cdnClient.install({
            ...parameters,
            modules,
            scripts,
        }).then(() => {
            return window[`@w3nest/rx-code-mirror-editors/${entry.name}_APIv01`]
        })
    },
    getCdnDependencies(name?: string){
        if(name && !secondaryEntries[name]){
            throw Error(`Can not find the secondary entry '${name}'. Referenced in template.py?`)
        }
        const deps = name ? secondaryEntries[name].loadDependencies : mainEntry.loadDependencies

        return deps.map( d => `${d}#${runTimeDependencies.externals[d]}`)
    }
}
