/**
 * XadillaX <i@2333.moe> created at 2018-06-13 11:56:03 with ❤
 *
 * Copyright (c) 2018 xcoder.in, all rights reserved.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const Linklist = require("algorithmjs").ds.Linklist;
const npa = require("npm-package-arg");

const utils = require("./utils");

function doRootTraverse(q, name, pkg, pkgPath, npmPackageArg, current, flattens) {
    const meta = {
        name: pkg.name,
        version: pkg.version,
        from: pkg._from,
        resolved: pkg._resolved,
        exists: true,
        rawSpec: npmPackageArg.rawSpec,
        dependencies: {}
    };

    flattens[name] = current.tree[name] = meta;
    q.pushBack({
        dependencies: pkg.dependencies,
        dir: path.join(path.dirname(pkgPath), "node_modules"),
        tree: meta.dependencies
    });
}

async function doNonRootTraverse(q, name, pkg, pkgPath, npmPackageArg, current, root, flattens) {
    const { tree } = current;
    let flattenMeta = flattens[name];

    // cache flatten package whether version matched
    if(flattenMeta === undefined) {
        const flattenPkgPath = path.join(root.dir, name, "package.json");

        if(!fs.existsSync(flattenPkgPath)) {
            flattens[name] = false;

            // SITUATION 1:
            //   + flatten package.json exists              ✗
            //   + current dependency directory exists      ✗
            //
            // RESULT: set as missing
            if(!pkg) {
                tree[name] = { name, missing: true, rawSpec: npmPackageArg.rawSpec };
                return;
            }
        } else {
            // if exist flatten package, traverse it whether it matches current version
            const flattenPkg = await utils.readJSON(flattenPkgPath);
            flattenMeta = {
                name: flattenPkg.name,
                version: flattenPkg.version,
                from: flattenPkg._from,
                resolved: flattenPkg._resolved,
                rootFlatten: true,
                rawSpec: npmPackageArg.rawSpec,
                dependencies: {}
            };
            flattens[name] = root.tree[name] = flattenMeta;
            q.pushBack({
                dependencies: flattenPkg.dependencies,
                dir: path.join(path.dirname(flattenPkgPath), "node_modules"),
                tree: flattenMeta.dependencies
            });
        }
    }

    // if we got the flatten cache, see if we can use it directly
    if(flattenMeta) {
        if(pkg && flattenMeta.name === pkg.name &&
            flattenMeta.version === pkg.version &&
            flattenMeta.from === pkg._from) {
            // SITUATION 2:
            //   + flatten cache exists                     ✓
            //   + current dependency directory exists      ✓
            //   * flatten cache matches current dependency ✓
            //
            // RESULT: set flatten

            // name / version and _from should be equal
            // because package's _from may be a git repo
            //
            // as a result, depName not always equals to depPkg.name
            // because package's _from may be a git repo

            tree[name] = {
                name: pkg.name,
                version: pkg.version,
                from: pkg._from,
                resolved: pkg._resolved,
                exists: true,
                flatten: true,
                rawSpec: npmPackageArg.rawSpec
            };
            return;
        } else if(!pkg) {
            // SITUATION 3:
            //   + flatten cache exists                     ✓
            //   + current dependency directory exists      ✗
            //
            // RESULT: set flatten

            tree[name] = {
                name: flattenMeta.name,
                version: flattenMeta.version,
                from: flattenMeta._from,
                resolved: flattenMeta._resolved,
                exists: false,
                flatten: true,
                rawSpec: npmPackageArg.rawSpec
            };
            return;
        }
    }

    if(!pkg) {
        // SITUATION 4:
        //   + flatten cache exists                         ✗
        //   + current dependency directory exists          ✗
        //
        // RESULT: set missing

        tree[name] = { name: name, missing: true, rawSpec: npmPackageArg.rawSpec };
        return;
    }

    // SITUATION 5:
    //   + flatten cache exists                             ✗
    //   + current dependency directory exists              ✓
    //
    // SITUATION 6:
    //   + flatten cache exists                             ✓
    //   + current dependency directory exists              ✓
    //   * flatten cache matches current dependency         ✗

    const meta = tree[name] = {
        name: pkg.name,
        version: pkg.version,
        from: pkg._from,
        resolved: pkg._resolved,
        exists: true,
        rawSpec: npmPackageArg.rawSpec,
        dependencies: {}
    };

    q.pushBack({
        dependencies: pkg.dependencies,
        dir: path.join(path.dirname(pkgPath), "node_modules"),
        tree: meta.dependencies
    });
}

async function doOneTraverse(q, current, root, flattens) {
    const { dependencies, dir, tree } = current;
    for(const depName in dependencies) {
        if(!dependencies.hasOwnProperty(depName)) continue;

        // eg.
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
        const arg = npa(`${depName}@${dependencies[depName]}`);

        // read package.json first if exists
        let pkg;
        const pkgPath = path.join(dir, depName, "package.json");
        if(fs.existsSync(pkgPath)) {
            pkg = await utils.readJSON(pkgPath);
        }

        if(root.dependencies === dependencies) {
            if(!pkg) {
                tree[depName] = { name: depName, missing: true, rawSpec: arg.rawSpec };
                continue;
            }
            doRootTraverse(q, depName, pkg, pkgPath, arg, current, flattens);
            continue;
        }

        // non-root dependencies
        await doNonRootTraverse(q, depName, pkg, pkgPath, arg, current, root, flattens);
    }
}

async function traverse(rootDependencies, rootDir) {
    const q = new Linklist();
    const rootTree = {};
    const flattens = {};
    const rootObj = {
        dependencies: rootDependencies,
        dir: rootDir,
        tree: rootTree
    };

    q.pushBack(rootObj);
    while(q.length) {
        const node = q.popFront();
        await doOneTraverse(q, node, rootObj, flattens);
    }

    return rootTree;
}

module.exports = traverse;
