/**
 * XadillaX <i@2333.moe> created at 2018-06-13 15:39:26 with ❤
 *
 * Copyright (c) 2018 xcoder.in, all rights reserved.
 */
"use strict";

const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const rimraf = require("rimraf");

const REGISTRY = `--registry=${process.env.CI ? "https://registry.npmjs.org/" : "https://registry.npm.taobao.org/"}`;

exports.install = function(dir, type) {
    dir = path.resolve(__dirname, "fixtures/apps/", dir);
    rimraf.sync(path.join(dir, "node_modules"));
    rimraf.sync(path.join(dir, "package-lock.json"));
    cp.execSync(`${path.resolve(__dirname, "../node_modules/.bin", type)} install ${REGISTRY}`, {
        cwd: dir
    });
};

function washResult(obj) {
    for(const key in obj) {
        if(!obj.hasOwnProperty(key)) continue;

        const curr = obj[key];
        delete curr.rawSpec;
        delete curr.version;
        delete curr.from;
        delete curr.resolved;
        delete curr.ref;
        delete curr.ancestor;
        if(curr.dependencies) washResult(curr.dependencies);
    }
}

exports.getResultMatcher = function(name) {
    const content = fs.readFileSync(path.resolve(__dirname, "fixtures/apps", name), "utf8");
    const obj = JSON.parse(content);
    washResult(obj);
    return obj;
};
