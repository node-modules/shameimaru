"use strict";

const fs = require("fs");
const path = require("path");

const traverse = require("./traverse");
const utils = require("./utils");

class Shameimaru {
    constructor(projDir) {
        this.projDir = projDir;
        this.nodeModuleDir = path.resolve(process.cwd(), projDir, "node_modules");
        this.package = JSON.parse(fs.readFileSync(path.join(projDir, "package.json"), "utf8"));
    }

    async traverse() {
        const ret = await traverse(
            utils.extraDependenciesFromPackage(this.package),
            this.nodeModuleDir);
        return ret;
    }
}

module.exports = Shameimaru;
