define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');
    require('dap.shared.accordionWidget');
    require('dap.shared.dropdownWidget');

    return ng.module('oozie.pages.coordinator-job', ['dashboard', 'dap.shared.accordionWidget', 'dap.shared.dropdownWidget']);
});
