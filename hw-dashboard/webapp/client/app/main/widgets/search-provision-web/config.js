define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(configure);

    configure.$inject = [
        'dap-widget.$widgetProvider'
    ];
    function configure($widgetProvider) {
        $widgetProvider.widget('search-provision-web', {
            controller: 'main.SearchProvisionWebController',
            templateUrl: '/app/main/widgets/search-provision-web/views/index.html',
            resolve: {}
        });
    }
});
