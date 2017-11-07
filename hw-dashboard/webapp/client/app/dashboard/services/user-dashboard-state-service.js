define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').service('dashboard.userDashboardStateService', UserDashboardService);

    UserDashboardService.$inject = ["core.utils.string-format", "core.API", "$rootScope"];

    function UserDashboardService(stringFormat, API, $rootScope) {
        var urlGetUserDashboard = "/hw/settings/user/{0}/state";
        var urlSaveUserDashboard = "/hw/settings/user/{0}/state";

        this.getUserDashboard = function () {
            var url = stringFormat(urlGetUserDashboard, $rootScope.currentUser.login);
            return API.get(url).then(function (data) {
                var savedStateExists = !ng.isUndefined(data);
                return savedStateExists ? data.state : '{"dashboard":{"widgets":[]}}';
            }, function () {
                return '{"dashboard":{"widgets":[]}}';
            });
        };

        this.saveUserDashboard = function (data) {
            var username = $rootScope.currentUser.login;
            var url = stringFormat(urlSaveUserDashboard, username);
            return API.put(url, {
                user: username,
                state: data
            });
        };
    }
});