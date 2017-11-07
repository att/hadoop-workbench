define(function (require) {
    "use strict";
    require('../ngModule').provider('core.credits', creditsProvider);

    var localUrl = './';
    var creditsPath = 'resources/json/build.json';

    function creditsProvider() {
        this.$get = RestService;
    }

    RestService.$inject = [
        '$http',
        '$log'
    ];
    function RestService($http, $log) {
        return new CreditsService($http, $log);

        function CreditsService($http, $log) {
            /**
             * Expected structure
             *   {
             *     "version": "1.0.0-SNAPSHOT",
             *     "jenkinsBuildNumber": "16",
             *     "jenkinsBuildId": "2015-11-09_14-19-07",
             *     "gitCommit": "4707b983baa2c1d3568f773b2bf8d36bb8a4e548",
             *     "gitBranch": "origin/master"
             *   }
             */
            this.getCredits = function () {
                var url = localUrl + creditsPath;
                return $http.get(url, { cache: false }).then(
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
