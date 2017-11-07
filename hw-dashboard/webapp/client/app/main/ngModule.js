import ngRedux from 'ng-redux';

require('angular');

// load package
require('angular-ui-router');
require('ngSanitize');
require('flux');
require("ngTreeControl");
require('ngContextMenu');
require('ngClipboard');
require('shared.widgets');
require('dap.shared.widget');

require("dashboard");
require("auth");
require("userSettings");
require('dap.shared.templateCache');
require('mocks');
require('dap.core');

let moduleDependencies = [
    'ui.router',
    'ngSanitize',
    'flux',
    'dap.core',
    'dashboard',
    'auth',
    'userSettings',
    'ng-context-menu',
    'dap.shared.templateCache',
    'shared.widgets',
    "treeControl",
    'dap-widget',
    'dashboard-isolated-widget-accessor',
    ngRedux,
    'ui.bootstrap.pagination',
    'ngclipboard'
    //'mocks'
].concat(require('plugins'));

export default angular.module('dap.main', moduleDependencies);
