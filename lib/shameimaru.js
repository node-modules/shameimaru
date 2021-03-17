"use strict";

const { CancellationError } = require("bluebird");
const fs = require("fs");
const path = require("path");

const traverse = require("./traverse");
const utils = require("./utils");

class Shameimaru {
    traversePromise = null;

    constructor(projDir) {
        this.projDir = projDir;
        this.nodeModuleDir = path.resolve(process.cwd(), projDir, "node_modules");
        this.package = JSON.parse(fs.readFileSync(path.join(projDir, "package.json"), "utf8"));
    }

    async traverse() {
        this.traversePromise = traverse(
            utils.extraDependenciesFromPackage(this.package),
            this.nodeModuleDir);

        const ret = await new Promise((resolve, reject) => {
            this.traversePromise.then(resolve, reject).finally(() => {
                // onFulfilled & onFailure won't be called if the promise was cancelled, so we need to handle cancellation mannually
                if (this.traversePromise.isCancelled()) {
                    reject(new CancellationError());
                }
            });
        });
        return ret;
    }

    cancel() {
        if (!this.traversePromise) {
            return;
        }

        this.traversePromise.cancel();
    }
}

module.exports = Shameimaru;
