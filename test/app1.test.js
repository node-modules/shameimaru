"use strict";

require("should");

const { CancellationError } = require("bluebird");
const Shameimaru = require("../");
const utils = require("./utils");

describe("app1.test.js", () => {
    describe("npm 6", () => {
        before(() => {
            utils.install("app1", "npm");
        });

        it("#traverse", async function() {
            const shameimaru = new Shameimaru("./test/fixtures/apps/app1");
            console.time("app1#npm");
            const tree = await shameimaru.traverse();
            console.timeEnd("app1#npm");
            tree.should.containDeep(utils.getResultMatcher("app1/target.npm.json"));

            // require("fs").writeFileSync("./test/fixtures/apps/app1/target.npm.json", JSON.stringify(tree, 0, 2));
        });

        it("#traverse canncel", async function() {
            const shameimaru = new Shameimaru("./test/fixtures/apps/app1");
            console.time("app1#npm");
            const promise = shameimaru.traverse();
            setTimeout(() => {
                shameimaru.cancel();
            }, 0);
            console.timeEnd("app1#npm");
            promise.should.rejectedWith(CancellationError);
        })
    });

    describe("cnpm 6", () => {
        before(() => {
            utils.install("app1", "cnpm");
        });

        it("#traverse", async function() {
            const shameimaru = new Shameimaru("./test/fixtures/apps/app1");
            console.time("app1#cnpm");
            const tree = await shameimaru.traverse();
            console.timeEnd("app1#cnpm");
            tree.should.containDeep(utils.getResultMatcher("app1/target.cnpm.json"));

            // require("fs").writeFileSync("./test/fixtures/apps/app1/target.cnpm.json", JSON.stringify(tree, 0, 2));
        });
    });
});
