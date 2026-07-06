## earth_monorepo

### Basic construction
earth_monorepo  
 ├─apps/  
 │  └─demo-react/ -react demo for earth, show basic use of earth module  
 └─packages/ -sources  
    ├─@krazyphish/  
    │ ├─develop-utils/ -decorators: validator and funtional  
    │ ├─earth/ -simpler module for gis based on cesium  
    │ ├─earth-plugins/ -plugins for earth  
    │ ├─earth-react/ -react hooks for earth  
    │ └─earth-vue/ -vue hooks for earth  
    └─build-utils/ -shared rollup configs  

### Quick start

Install dependencies

```shell
pnpm install
```

### Lint

Code style and quality check

```shell
pnpm lint:prettier // prettier
pnpm lint:eslint   // eslint
pnpm lint:cspell   // spell check
```

### Test

At every "test" folder do unit tests

```shell
pnpm test
```

### Commit

Use command to commit

```shell
pnpm commit
```

### Build

This will build all child packages blow "packages" folder

```shell
pnpm build
```
