"use strict";

const path = require("path");

const fs = require("mz/fs");
const Linklist = require("algorithmjs").ds.Linklist;
const npa = require("npm-package-arg");
const uuid = require("uuid/v4");

const utils = require("./utils");

const TRAVERSED = Symbol("traversed");

async function getPackagesInDir(nodeModuleDir) {
    if(!fs.existsSync(nodeModuleDir) ||
        !(await fs.stat(nodeModuleDir)).isDirectory()) {
        return [];
    }

    const depDirs = await fs.readdir(nodeModuleDir);
    const pkgs = [];
    for(const name of depDirs) {
        if(name.startsWith(".") || name.startsWith("_")) continue;

        const fullPath = path.join(nodeModuleDir, name);

        // `fs.stat` will throw error while processing on a broken symbol link that
        // could be listed via `fs.readdir`.
        //
        // So we still need to make sure it's `fs.existsSync` before `fs.stat`.
        if(!fs.existsSync(fullPath)) continue;
        if(!(await fs.stat(fullPath)).isDirectory()) continue;

        // if the directory name starts with '@', then we add its all child
        // directories to the result array;
        //
        // otherwise, we only push this directory itself.

        if(name.startsWith("@")) {
            const atDirs = await fs.readdir(fullPath);
            for(const atName of atDirs) {
                if(atName.startsWith(".") || atName.startsWith("_")) continue;

                const pkgPath = path.join(fullPath, atName, "package.json");
                if(!fs.existsSync(pkgPath)) continue;
                const pkg = await utils.readJSON(pkgPath);
                pkgs.push({ pkg, moduleDir: path.dirname(pkgPath) });
            }
            continue;
        }

        const pkgPath = path.join(fullPath, "package.json");
        if(!fs.existsSync(pkgPath)) continue;
        const pkg = await utils.readJSON(pkgPath);
        pkgs.push({ pkg, moduleDir: fullPath });
    }

    return pkgs;
}

function searchAncestor(ancestors, currentFolder, pkg) {
    // replace `@foo/bar` to `@foo!bar` to let `path.dirname` regards it as one
    // folder.
    const name = (typeof pkg === "string" ? pkg : pkg.name).replace("/", "!");
    pkg = typeof pkg === "string" ? null : pkg;
    let onlySlash = false;

    do {
        if("/" === currentFolder) onlySlash = true;

        const tryFolder = path.join(currentFolder, name);
        const ancestor = ancestors[tryFolder];
        if(ancestor) {
            return !pkg || pkg.version === ancestor.version && pkg._resolved === ancestor.resolved ?
                ancestor :
                null;
        }

        currentFolder = path.dirname(currentFolder);
    } while(!onlySlash);

    return null;
}

function genRef(refs) {
    do {
        const ref = uuid();
        if(!refs[ref]) {
            refs[ref] = true;
            return ref;
        }
    } while(1);
}

async function scanDir(q, node, ancestors, refs) {
    const { dir, dependencies, tree, dummyFolder } = node;
    const pkgs = await getPackagesInDir(dir);

    for(const info of pkgs) {
        const { pkg, moduleDir } = info;

        // npmPackageArg eg.
        //
        //  { type: 'range',
        //    registry: true,
        //    where: undefined,
        //    raw: 'toshihiko@^1.0.0-alpha.7',
        //    name: 'toshihiko',
        //    escapedName: 'toshihiko',
        //    scope: undefined,
        //    rawSpec: '^1.0.0-alpha.7',
        //    saveSpec: null,
        //    fetchSpec: '^1.0.0-alpha.7',
        //    gitRange: undefined,
        //    gitCommittish: undefined,
        //    hosted: undefined }
        const versionSpec = dependencies[pkg.name];

        // add meta information to result tree & ancestors
        const meta = tree[pkg.name] = {
            ref: genRef(refs),
            name: pkg.name,
            version: pkg.version,
            from: pkg._from,
            resolved: pkg._resolved,
            exists: true
        };

        // replace `@foo/bar` to `@foo!bar` to let `path.dirname` regards it as
        // one folder.
        const nextFolder = path.join(dummyFolder, pkg.name.replace("/", "!"));
        ancestors[nextFolder] = meta;

        // if dependencies column exists this package, we search for its
        // ancestor or add a new task to queue;
        //
        // otherwise, we consider it as flatten and add a new task to queue.

        if(versionSpec) {
            const npmPackageArg = npa(`${pkg.name}@${versionSpec}`);
            meta.rawSpec = npmPackageArg.rawSpec;
            dependencies[pkg.name] = TRAVERSED;

            if(dummyFolder !== "/") {
                const ancestor = searchAncestor(ancestors, path.dirname(dummyFolder), pkg);
                if(ancestor) {
                    meta.ancestor = ancestor.ref;
                    continue;
                }
            }
        } else {
            meta.adjustHere = true;
        }

        const nextDependencies = utils.extraDependenciesFromPackage(pkg);
        if(Object.keys(nextDependencies).length) {
            meta.dependencies = {};

            // after setting the package itself, we push it as next search
            // status to the queue.
            q.pushBack({
                dir: path.join(moduleDir, "node_modules"),
                dependencies: nextDependencies,
                tree: meta.dependencies,
                dummyFolder: nextFolder
            });
        }
    }

    // pick up the left packages in dependencies (but not in current directory)
    for(const name in dependencies) {
        if(!dependencies.hasOwnProperty(name) ||
            dependencies[name] === TRAVERSED) {
            continue;
        }

        const versionSpec = dependencies[name];
        const npmPackageArg = npa(`${name}@${versionSpec}`);
        const meta = tree[name] = {
            ref: genRef(refs),
            name,
            exists: false,
            rawSpec: npmPackageArg.rawSpec
        };

        const ancestor = searchAncestor(ancestors, dummyFolder, name);
        if(ancestor) {
            meta.ancestor = ancestor.ref;
        } else {
            meta.missing = true;
        }
    }
}

async function traverse(rootDependencies, rootDir) {
    const q = new Linklist();
    const rootTree = {};
    const ancestors = {};
    const refs = {};

    q.pushBack({
        dir: rootDir,
        dependencies: Object.assign({}, rootDependencies),
        tree: rootTree,
        dummyFolder: "/"
    });

    while(q.length) {
        const node = q.popFront();
        await scanDir(q, node, ancestors, refs);
    }

    return rootTree;
}

module.exports = traverse;
