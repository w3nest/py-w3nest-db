import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import Template, PackageType, Dependencies, \
    RunTimeDeps, Bundles, MainModule
from youwol.pipelines.pipeline_typescript_weback_npm.external import generate_template
from youwol.utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / 'package.json')

externals_deps = {}
in_bundle_deps = {
    "highlight.js": pkg_json['version']
}
dev_deps = {
    "cpx": "^1.5.0"
}

css_path = folder_path / 'node_modules' / 'highlight.js' / 'styles'
template = Template(
    path=folder_path,
    type=PackageType.LIBRARY,
    name=pkg_json['name'],
    version=pkg_json['version'],
    shortDescription=pkg_json['description'],
    author=pkg_json['author'],
    dependencies=Dependencies(
        runTime=RunTimeDeps(
            externals=externals_deps,
            includedInBundle=in_bundle_deps
        ),
        devTime=dev_deps
    ),
    bundles=Bundles(
        mainModule=MainModule(
            entryFile='./index.ts',
            loadDependencies=list(externals_deps.keys()),
            aliases=["hljs"]
        )
    ),
    inPackageJson={
        "scripts": {
            **pkg_json['scripts'],
            "build:dev": "yarn pre-build && yarn copy-css && webpack --mode development",
            "build:prod": "yarn pre-build && yarn copy-css && webpack --mode production",
            "copy-css": f"cpx \"{css_path}/**\" \"./styles\"",
        }
    },
    userGuide=True
)

generate_template(template)
shutil.copyfile(
    src=folder_path / '.template' / 'src' / 'auto-generated.ts',
    dst=folder_path / 'src' / 'auto-generated.ts'
)
for file in ['README.md',
             # '.gitignore',
             '.npmignore', '.prettierignore', 'LICENSE', 'package.json',
             'tsconfig.json', 'jest.config.ts', 'webpack.config.ts']:
    shutil.copyfile(
        src=folder_path / '.template' / file,
        dst=folder_path / file
    )
