/**
 * XadillaX <i@2333.moe> created at 2018-06-12 16:08:26 with ❤
 *
 * Copyright (c) 2018 xcoder.in, all rights reserved.
 */
"use strict";

const fs = require("mz/fs");

exports.readJSON = async function(filename) {
    const content = await fs.readFile(filename, "utf8");
    return JSON.parse(content);
};
