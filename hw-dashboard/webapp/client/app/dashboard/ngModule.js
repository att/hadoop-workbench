define(function (require) {
    "use strict";

    require('dap.core');
    require('dap.shared.widget');
    require('dap.shared.resizable');
    require('ui.sortable');
    require('auth');
    require('uiSettings');

    return require('angular').module('dashboard', ['dap.core', 'dap-widget', 'resizable', 'ui.sortable', 'auth', 'uiSettings']);
});
