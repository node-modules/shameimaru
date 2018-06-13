/**
 * XadillaX <i@2333.moe> created at 2018-06-11 14:01:00 with ❤
 *
 * Copyright (c) 2018 xcoder.in, all rights reserved.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const traverse = require("./traverse");

class Shameimaru {
    constructor(projDir) {
        this.projDir = projDir;
        this.nodeModuleDir = path.resolve(process.cwd(), projDir, "node_modules");
        this.package = JSON.parse(fs.readFileSync(path.join(projDir, "package.json"), "utf8"));
    }

    async traverse() {
        const ret = await traverse(
            Object.assign({}, this.package.dependencies || {}),
            this.nodeModuleDir);
        return ret;
    }
}

module.exports = Shameimaru;
