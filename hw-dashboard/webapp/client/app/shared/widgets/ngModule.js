define(function (require) {
    "use strict";

    require('dap.core');
    require('dap.shared.widget');
    var component = require('component');

    return component.extendModule(require('angular').module('shared.widgets', ['dap.core', 'dap-widget']));
});
