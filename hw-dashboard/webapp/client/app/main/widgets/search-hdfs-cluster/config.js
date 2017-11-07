define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(configure);

    configure.$inject = [
        'dap-widget.$widgetProvider'
    ];
    function configure($widgetProvider) {
        $widgetProvider.widget('search-hdfs-cluster', {
            controller: 'main.SearchHdfsClusterController',
            templateUrl: '/app/main/widgets/search-hdfs-cluster/views/index.html',
            resolve: {}
        });
    }
});
