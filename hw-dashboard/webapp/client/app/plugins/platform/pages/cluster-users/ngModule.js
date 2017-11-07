define(function (require) {
    "use strict";

    var ng = require('angular');

    return ng.module('platform.pages.cluster-info.cluster-users', []).run(['platform-manager-widget.cluster-info.ClusterUsersStore', 'platform-manager-widget.cluster-info.ClusterUsersActions', function () {
    }]);
});
