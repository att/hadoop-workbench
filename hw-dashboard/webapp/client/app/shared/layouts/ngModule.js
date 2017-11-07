define(function (require) {
    "use strict";

    require('dap.shared.widget');
    require('dap.shared.resizable');
    require('ui.sortable');
    require('flux');

    return require('angular').module('shared.layouts', ['dap-widget', 'resizable', 'ui.sortable', 'flux', 'angular-inview']);
});
