define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(configure);

    configure.$inject = [
        'dap-widget.$widgetProvider'
    ];
    function configure($widgetProvider) {
        $widgetProvider.widget('search-component', {
            controller: 'main.SearchComponentController',
            templateUrl: '/app/main/widgets/search-component/views/index.html',
            resolve: {}
        });
    }
});
