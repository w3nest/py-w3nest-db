/* eslint-disable */
const runTimeDependencies = {
    "externals": {
        "rx-vdom": "^0.1.0",
        "rxjs": "^7.5.6"
    },
    "includedInBundle": {}
}
const externals = {
    "rx-vdom": {
        "commonjs": "rx-vdom",
        "commonjs2": "rx-vdom",
        "root": "rx-vdom_APIv01"
    },
    "rxjs": {
        "commonjs": "rxjs",
        "commonjs2": "rxjs",
        "root": "rxjs_APIv7"
    }
}
const exportedSymbols = {
    "rx-vdom": {
        "apiKey": "01",
        "exportedSymbol": "rx-vdom"
    },
    "rxjs": {
        "apiKey": "7",
        "exportedSymbol": "rxjs"
    }
}

const mainEntry : {entryFile: string,loadDependencies:string[]} = {
    "entryFile": "./index.ts",
    "loadDependencies": [
        "rxjs",
        "rx-vdom"
    ]
}

const secondaryEntries : {[k:string]:{entryFile: string, name: string, loadDependencies:string[]}}= {}

const entries = {
     '@w3nest/rx-tree-views': './index.ts',
    ...Object.values(secondaryEntries).reduce( (acc,e) => ({...acc, [`@w3nest/rx-tree-views/${e.name}`]:e.entryFile}), {})
}
export const setup = {
    name:'@w3nest/rx-tree-views',
        assetId:'QHczbmVzdC9yeC10cmVlLXZpZXdz',
    version:'0.2.0',
    shortDescription:"Tree views using rx-vdom.",
    developerDocumentation:'https://platform.youwol.com/apps/@youwol/cdn-explorer/latest?package=@w3nest/rx-tree-views&tab=doc',
    npmPackage:'https://www.npmjs.com/package/@w3nest/rx-tree-views',
    sourceGithub:'https://github.com/w3nest/rx-tree-views',
    userGuide:'',
    apiVersion:'02',
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
            return window[`@w3nest/rx-tree-views_APIv02`]
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
            `@w3nest/rx-tree-views#0.2.0~dist/@w3nest/rx-tree-views/${entry.name}.js`
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
            return window[`@w3nest/rx-tree-views/${entry.name}_APIv02`]
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
