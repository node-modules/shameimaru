"use strict";

require("should");

const Shameimaru = require("../");
const utils = require("./utils");

describe("app3.test.js", () => {
    describe("should not throw error", () => {
        it("#traverse", async function() {
            const shameimaru = new Shameimaru("./test/fixtures/apps/app3");
            console.time("app3");
            const tree = await shameimaru.traverse();
            console.timeEnd("app3");
            tree.should.containDeep(utils.getResultMatcher("app3/target.json"));

            // require("fs").writeFileSync("./test/fixtures/apps/app3/target.json", JSON.stringify(tree, 0, 2));
        });
    });
});
