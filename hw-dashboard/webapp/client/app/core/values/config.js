define(function(require){
    'use strict';

    var dapConfig = {};
    require('../ngModule').constant('dap.core.config', dapConfig);

    dapConfig.pathToApp = '/app';
    dapConfig.pathToPlugins = '/app/plugins';
    dapConfig.pathToShared = '/app/shared';
    dapConfig.pathToLayouts = '/app/shared/layouts';
});
