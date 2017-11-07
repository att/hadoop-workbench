define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(configure);

    configure.$inject = [
        'dap-widget.$widgetProvider'
    ];
    function configure($widgetProvider) {
        $widgetProvider.widget('search-cluster', {
            controller: 'main.SearchClusterController',
            templateUrl: '/app/main/widgets/search-cluster/views/index.html',
            resolve: {}
        });
    }
});
