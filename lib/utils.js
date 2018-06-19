"use strict";

const fs = require("mz/fs");

exports.readJSON = async function(filename) {
    const content = await fs.readFile(filename, "utf8");
    return JSON.parse(content);
};

exports.extraDependenciesFromPackage = function(pkg) {
    return Object.assign({}, pkg.dependencies || {}, pkg.optionalDependencies || {});
};
