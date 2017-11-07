define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').service('uiSettings.restService', RestProvider);

    RestProvider.$inject = ["core.API", "$q"];
    function RestProvider(API, $q) {
        var urlGetSettings = "/hw/settings/ui";

        this.getSettings = function () {
            return API.get(urlGetSettings).then(function (data) {
                return data;
            }, function (response) {
                return $q.reject(response.message);
            });
        };
    }
});