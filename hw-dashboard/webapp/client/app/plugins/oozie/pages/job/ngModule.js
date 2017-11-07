define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');
    require('dap.shared.jsPlumb');
    require('dap.shared.validation');
    require('dap.shared.accordionWidget');
    require('dap.shared.dropdownWidget');

    return ng.module('oozie.pages.job', ['dashboard', 'dap.shared.validation', 'dap.shared.jsPlumb', 'dap.shared.accordionWidget', 'dap.shared.dropdownWidget']);
});
