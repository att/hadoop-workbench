define(function (require, exports, module) {
    "use strict";

    var extendModule = require('component')['extendModule'];

    module.exports = extendModule(require('angular').module('shared.components', [require('component')['ngModuleName']]));
});
