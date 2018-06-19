# Shameimaru.js

[![Shameimaru](http://img.shields.io/npm/v/shameimaru.svg)](https://www.npmjs.org/package/shameimaru)
[![Shameimaru](http://img.shields.io/npm/dm/shameimaru.svg)](https://www.npmjs.org/package/shameimaru)
[![Build Status](https://travis-ci.org/node-modules/shameimaru.svg?branch=master)](https://travis-ci.org/node-modules/shameimaru)
[![Coverage Status](https://img.shields.io/coveralls/node-modules/shameimaru/master.svg)](https://coveralls.io/r/node-modules/shameimaru?branch=master)
[![License](https://img.shields.io/npm/l/shameimaru.svg?style=flat)](https://www.npmjs.org/package/shameimaru)
[![Dependency Status](https://david-dm.org/node-modules/shameimaru.svg)](https://david-dm.org/node-modules/shameimaru)

Shameimaru Aya likes to traverse node_modules and capture the tree.

![Shameimaru](shameimaru.jpg)

## Installation

```shell
$ npm install --save shameimaru
```

## Usage

```js
const Shameimaru = require("shameimaru");

const shameimaru = new Shameimaru("<YOUR_PROJ_ROOT>");
```

> `<YOUR_PROJ_ROOT>` is the root path which contains **node_modules** of your project.

After create the `Shameimaru` instance, you can do `traverse()` through it.

```js
const ret = await shameimaru.traverse();
```

Then you'll get a may-flatten graph-form tree. e.g.

```json
{
  "@crand/mt19937": {
    "ref": "5c2f5c96-9c29-4f3f-8cc1-ec6ab1f4025b",
    "name": "@crand/mt19937",
    "version": "2.0.0",
    "from": "@crand/mt19937@2.0.0",
    "resolved": "http://registry.npm.taobao.org/@crand/mt19937/download/@crand/mt19937-2.0.0.tgz",
    "exists": true,
    "rawSpec": "*"
  },
  "any-promise": {
    "ref": "78325895-5945-4180-97dd-a01c705b254e",
    "name": "any-promise",
    "version": "0.2.0",
    "from": "any-promise@0.2.0",
    "resolved": "http://registry.npm.taobao.org/any-promise/download/any-promise-0.2.0.tgz",
    "exists": true,
    "rawSpec": "0.2.0"
  },
  "mz": {
    "ref": "63bb611b-232d-4f7a-ba53-3322670ed170",
    "name": "mz",
    "version": "2.7.0",
    "from": "mz@2.7.0",
    "resolved": "http://registry.npm.taobao.org/mz/download/mz-2.7.0.tgz",
    "exists": true,
    "rawSpec": "^2.7.0",
    "dependencies": {
      "any-promise": {
        "ref": "41f0b04f-0904-432f-aa33-13e5cbb8fcdc",
        "name": "any-promise",
        "version": "1.3.0",
        "from": "any-promise@1.3.0",
        "resolved": "http://registry.npm.taobao.org/any-promise/download/any-promise-1.3.0.tgz",
        "exists": true,
        "rawSpec": "^1.0.0"
      }
    },
    ...
  },
  ...
}
```

Each element in the result may contains keys as below:

+ `ref`: a random referrence sign in this tree, it's unique; e.g. `63bb611b-232d-4f7a-ba53-3322670ed170`
+ `name`: the name of this package (dependency); e.g. `toshihiko`
+ `version`: the name of this package (dependency); e.g. `2.7.0`
+ `from`: same as `_from` in installed **package.json**; e.g. `mz@^2.0.0`
+ `resolved`: same as `_resolved` in installed **package.json**; `http://registry.npm.taobao.org/mz/download/mz-2.7.0.tgz`
+ `exists`: whether it's really exist in current tree folder; e.g. `true`
+ `ancestor`: if it matches a exactly the same package at any upper directory, it indicates that element's `ref`; e.g. `63bb611b-232d-4f7a-ba53-3322670ed170`
+ `rawSpec`: the raw spec of this package in its parent's **package.json**; e.g. `^2.0.0`
+ `adjustHere`: this package is not need by its parent, but some package need it flatten here; e.g. `true`
+ `missing`: if we can't find this package at any right path, then it will be `true`; e.g. `true`

## Contribute

You're welcome to fork and make pull requests!
