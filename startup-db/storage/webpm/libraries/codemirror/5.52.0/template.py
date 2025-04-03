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
    "codemirror": pkg_json['version']
}
dev_deps = {
    "cpx": "^1.5.0",
    "clean-css-cli": "5.6.3"
}

cm_path = folder_path / 'node_modules' / 'codemirror'
mode_path = cm_path / 'mode'
theme_path = cm_path / 'theme'
addon_path = cm_path / 'addon'
lib_path = cm_path / 'lib'

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
            aliases=["CodeMirror:default"]
        )
    ),
    inPackageJson={
        "scripts": {
            # Below are regular scripts
            **pkg_json['scripts'],
            "build:dev": "yarn pre-build && yarn copy && webpack --mode development",
            "build:prod": "yarn pre-build && yarn copy && webpack --mode production",
            "copy-mode": f"cpx \"{mode_path}/**\" \"./mode\"",
            "copy-theme": f"cpx \"{theme_path}/*\" \"./theme\"",
            "copy-addon": f"cpx \"{addon_path}/**\" \"./addon\"",
            "copy-css": f"cpx \"{lib_path}/codemirror.css\" \"./\" && cleancss -o 'codemirror.min.css' 'codemirror.css'",
            "copy-backward-assets": f"cpx \"./backward_assets/theme/*\" \"./theme\" && cpx \"./backward_assets/mode/*\" \"./mode\" ",
            "copy": "yarn copy-mode && yarn copy-theme && yarn copy-addon && yarn copy-css && yarn copy-backward-assets",
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
             #'.gitignore',
             '.npmignore', '.prettierignore', 'LICENSE', 'package.json',
             'tsconfig.json', 'jest.config.ts', 'webpack.config.ts']:
    shutil.copyfile(
        src=folder_path / '.template' / file,
        dst=folder_path / file
    )
