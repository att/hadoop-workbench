define(function (require) {
    "use strict";
    require('../ngModule').provider('core.settings', SettingsProvider);

    var settingsPath = '/hw/module/admin-web/api/v1.0/menu';

    function SettingsProvider() {
        this.$get = RestService;
    }

    RestService.$inject = [
        '$http',
        '$log'
    ];
    function RestService($http, $log) {
        return new SettingsService($http, $log);

        function SettingsService($http, $log) {
            /**
             * Expected structure
             *   {
             *       "menu" : {
             *           "disabled": [
             *               "COMPONENT",
             *                "TENANT"
             *            ]
             *       }
             *
             *   }
             */

            this.getSettings = function () {
                return $http.get(settingsPath, { cache: false }).then(
                    function (response) {
                        return response.data;
                    }, function (errorResponse) {
                        $log.error('Settings not found', errorResponse);
                        return {};
                    })
                    .catch(function (e) {
                        $log.error('Settings file format is incorrect', e);
                        return {};
                    }
                )
            };
        }
    }
});
