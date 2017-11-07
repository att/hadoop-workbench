define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(configure);

    configure.$inject = [
        'dap-widget.$widgetProvider'
    ];
    function configure($widgetProvider) {
        $widgetProvider.widget('search-provider', {
            controller: 'main.SearchProviderController',
            templateUrl: '/app/main/widgets/search-provider/views/index.html',
            resolve: {}
        });
    }
});
