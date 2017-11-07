define(function (require) {
    "use strict";

    var ng = require('angular');

    return ng.module('platform.pages.service-users', []).run(['platform-manager-widget.ServiceUsersStore', 'platform-manager-widget.ServiceUsersActions', function () {
    }]);
});
