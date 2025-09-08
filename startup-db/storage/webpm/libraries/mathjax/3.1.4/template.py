import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import PackageType, Dependencies, Template, RunTimeDeps, Bundles, \
    MainModule
from youwol.pipelines.pipeline_typescript_weback_npm.external import generate_template
from youwol.utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / 'package.json')

externals_deps = {}
in_bundle_deps = {
    "mathjax": "3.1.4"
}
dev_deps = {
    "replace-in-file": "^8.0.1",
    "cpx": "^1.5.0"
}
mathjax_fonts_path = folder_path / "node_modules" / "mathjax" / "es5" / "output" / "chtml" / "fonts" / "woff-v2"

base_path = "\\/api\\/assets-gateway\\/raw\\/package\\/bWF0aGpheA=="
fonts_url_patch = (
    "u.src.replace(\\/%%URL%%\\/,r)",
    f"u.src.replace(\\/%%URL%%\\/,\"{base_path}\\/{pkg_json['version']}\\/fonts\")"
)
template = Template(
    path=Path(__file__).parent,
    type=PackageType.LIBRARY,
    name=pkg_json['name'],
    version=pkg_json['version'],
    exportedSymbol="Mathjax",
    author="greinisch@youwol.com",
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
            loadDependencies=[],
            aliases=[]
        )
    ),
    inPackageJson={
        "scripts": {
            # Below are regular scripts
            "clean": "del-cli dist",
            "auto-gen": "python template.py",
            "pre-build": "yarn clean",
            "build": "yarn build:dev",
            "build:dev": "yarn pre-build && yarn copy-fonts && webpack --mode development && yarn fix-fonts-url",
            "build:prod": "yarn pre-build && yarn copy-fonts && webpack --mode production  && yarn fix-fonts-url",
            # This 'fix-fonts-url' allow correctly fetching the fonts from the folder `./fonts`
            "fix-fonts-url": f"sed -i 's/{fonts_url_patch[0]}/{fonts_url_patch[1]}/' ./dist/mathjax.js",
            #"fix-fonts-url": "replace-in-file 'u.src.replace(/%%URL%%/,r)' 'u.src.replace(/%%URL%%/,\"/api/assets-gateway/raw/package/bWF0aGpheA==/3.1.4/fonts\")' ./dist/mathjax.js"
            "copy-fonts": f"cpx \"{mathjax_fonts_path}/**/*\" \"fonts/\"",
        }
    },
    userGuide=True
)

generate_template(template)
shutil.copyfile(
    src=folder_path / '.template' / 'src' / 'auto-generated.ts',
    dst=folder_path / 'src' / 'auto-generated.ts'
)
for file in ['README.md', '.gitignore', '.npmignore', '.prettierignore', 'LICENSE', 'package.json',
             'tsconfig.json', 'jest.config.ts', 'webpack.config.ts']:
    shutil.copyfile(
        src=folder_path / '.template' / file,
        dst=folder_path / file
    )
