define(function (require) {
    "use strict";

    var ng = require('angular');

    // load module dependencies
    require('dashboard');
    require('./dashboard-widgets/hdfs-manager-widget/main');

    return ng.module('hdfs', [
        'dashboard',
        'hdfs-manager-widget'
    ]);
});
