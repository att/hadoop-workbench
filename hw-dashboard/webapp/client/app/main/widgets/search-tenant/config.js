define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(configure);

    configure.$inject = [
        'dap-widget.$widgetProvider'
    ];
    function configure($widgetProvider) {
        $widgetProvider.widget('search-tenant', {
            controller: 'main.SearchTenantController',
            templateUrl: '/app/main/widgets/search-tenant/views/index.html',
            resolve: {}
        });
    }
});
