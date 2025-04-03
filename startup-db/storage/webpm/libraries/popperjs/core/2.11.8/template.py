from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import (
    PackageType,
    Template,
    Dependencies,
    Bundles,
    MainModule,
)
from youwol.pipelines.pipeline_typescript_weback_npm.external import generate_template

template = Template(
    path=Path(__file__).parent,
    type=PackageType.Library,
    name="@popperjs/core",
    exportedSymbol="Popper",
    version="2.11.8",
    author="greinisch@youwol.com",
    dependencies=Dependencies(),
    bundles=Bundles(mainModule=MainModule(entryFile="./src/index.ts")),
)

generate_template(template)
