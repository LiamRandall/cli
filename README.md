# waPC CLI
 
WebAssembly Procedure Calls command-line interface. 
 
### Problem
 
WebAssembly is capable of passing and accepting simple numeric parameters between host and guests while non-trivial applications would like to leverage more complex data types like strings, structs, binary blobs, or other complex data types.
 
### Solution
 
waPC is a polyglot specification and toolkit for WebAssembly that enables a bidirectional function call mechanism to enable and simplify the passing of strings, structs, binary blobs, or other complex data types between host and guests systems as native language parameter types.
 
### Basic Overview
 
waPC cli is a simple and fast polyglot code generator for waPC.  waPC leverages a simple workflow, robust set of templates, and user customization to generate this scaffolding code and may be further customized to your use case.  It presently supports AssemblyScript, Rust, TinyGo, and Zig.  You may leverage this cli to create the scaffolding and libraries necessary to build your applications.  waPC internally leverages an Interactive Data Language (IDL) called WIDL, short for WebAssembly IDL, based on graph QL, but without the query logic necessary for our use case.  For further information about our design choices and architecture please see our FAQ.  While WIDL is used internally between the host and underlying guest, you are of course free to expose whatever IDL you would like externally via api or other mechanisms.
 
waPC cli has a very simple workflow:
 
1. Generate a basic project and data model scaffold with your choice of language.
2. Customize templates.
3. Compile your auto-generated libraries.
4. Load your libraries in a waPC guest host and leverage it in your project.
...
Profit
 
 
## Getting Started
 
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.  See deployment for notes on how to deploy the project on a live system.
 
### QuickStart (YOLO)
 
```
npm install -g git+https://github.com/wapc/cli.git#master
wapc new assemblyscript hello_world
make
```
 
 
### Installing from Packages
 
wapc-cli is built with [Oclif: The Open CLI Framework](https://oclif.io/).  Oclif has native support for building compiled packages; we will be building packages soon.  Please see our [Roadmap]() and [github issues]() for further information.
 
### Mac Prerequisites
 
To use the waPC cli has been tested with npm v14.15.4
 
Verify you have node installed:
```
node --version
```
 
**[Optional]**
 
Install nvm:
 
```
brew install nvm
```
 
Download npm v14.15.4:
 
```
nvm install v14.15.4
```
 
Set as the default:
 
```
nvm alias default v14.15.4 
```
 
### Install
 
Let's set up a local development environment.
 
Clone and install the project
 
```
npm install -g git+https://github.com/wapc/cli.git#master
```
 
Confirm wapc runs:
 
```
> wapc
```
 
Output:
 
```
VERSION
 wapc/0.0.1 darwin-x64 node-v14.15.4
 
USAGE
 $ wapc [COMMAND]
 
COMMANDS
 generate  generate code from a configuration file
 help      display help for wapc
 install   install waPC extensions
 new       create a new waPC project
 ```
 
### Basic Scaffolding
 
waPC cli has a very simple workflow:
 
1. Generate basic project and data model scaffold.
2. Customize templates.
3. Compile your libraries.
4. Load your libraries in a waPC guest host and leverage them in your project.
 
Generate a new application:
 
```
> wapc new assemblyscript hello_world
```
 
Inspect your scaffold:
 
```
./hello_world/Makefile
./hello_world/schema.widl
./hello_world/package.json
./hello_world/codegen.yaml
./hello_world/assembly/tsconfig.json
```
 
### About the Template Files
 
The scaffolding created by the `wapc new` step above creates a template project that you can then use 'make' to build into your custom library.  You can customize this template project with your data specification, the files you would like the auto generator to build, and optionally your own custom templates.
 
1. `Makefile`: regardless of what language you use in the generator you can simply use `make` to build your project.
2. `codegen.yaml` is used to map generated files to their *packages*, *visitorClass* and optional *config* settings.
3. `package.json` provides instructions to npm on which templates to download for the autogeneration and further build instructions for the generated code.
4. `schema.widl` is the data schema that you should customize for your application.
5. `assembly/tsconfig.json`
 
### Building your library
 
Once you have customized your `codegen.yaml` and `schema.widl` you are ready to build your project:
 
```
make
```
 
npm will provide you with some feedback, download a bunch of packages, and then auto generate your library.  It should look a bit like this now:
 
```
/Makefile
./assembly/module.ts
./assembly/tsconfig.json
./assembly/index.ts
./schema.widl
./node_modules/*
./package-lock.json
./package.json
./codegen.yaml
./build/hello_world.wasm
```
 
We of course have all of our node files under `node_modules` and our node configuration `package-lock.json`.
 
Our key autogenerated files:
 
1. `assembly/index.ts` our AssemblyScript library header we use in our source project.
2. `assembly/module.ts` our AssemblyScript library.
3. `build/hello_world.wasm` our WebAssembly library to be loaded into a wapc guest.
 
## Deployment
 
A standalone guide to deploying our `hello_world` application is coming soon.
 
## Reference projects
 
Ok, so how do you run this?  You need to embed these files into your project.  Let's look at a few example projects:
 
* [wasmCloud](https://www.wasmCloud.com) - A dynamic, elastically scalable WebAssembly host runtime for securely connecting actors and capability providers
* [Mandelbrot Example](https://github.com/wapc/mandelbrot-example) - an adaptation of AssemblyScript mandelbrot for waPC.
* [Rule Demo](https://github.com/wapc/rules-demo) - a simple rules engine for waPC
* [IBM Hyperledger](https://github.com/hyperledgendary/fabric-chaincode-wasm) - Smart Contracts, running in wasm.  waPC Go Host is leveraged to execute the wasm chaincode.
 
## Built With
 
* [waPC](https://github.com/wapc) - WebAssembly Procedure Calls
* [widl](https://github.com/widl-codegen) - Code generation library using waPC Interface Definition Language (WIDL).  Making your life, a *wittle* bit easier.
* [Oclif: The Open CLI Framework](https://oclif.io/) - The open CLI Framework
 
## Contributing
 
Please read [CONTRIBUTING.md](https://github.com/wapc/) for details on our code of conduct, and the process for submitting pull requests to us.
 
## Versioning
 
We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/wapc/cli/tags).
 
## Author
 
* **Phil Kedy** - *Initial work* - [pkedy](https://github.com/pkedy)
 
## License
 
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
 
 

