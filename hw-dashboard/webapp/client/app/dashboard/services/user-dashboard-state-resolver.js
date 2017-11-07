define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('dashboard.userDashboardStateResolver', StateResolver);

    StateResolver.$inject = ['$q', '$rootScope', "dashboard.userDashboardStateService"];
    function StateResolver($q, $rootScope, userDashboardStateService) {
        return {
            resolve: function (currentUser) {
                var deferred = $q.defer();
                var unwatch = $rootScope.$watch('currentUser', function (currentUser) {
                    if (ng.isDefined(currentUser)) {
                        if (currentUser !== null) {
                            return userDashboardStateService.getUserDashboard().then(function (dashboard) {
                                deferred.resolve(dashboard);
                            });
                        } else {
                            deferred.reject({
                                reason: 'unauthorised',
                                message: "User is not logged in, can't get user settings!"
                            });
                        }
                        unwatch();
                    }
                });
                return deferred.promise;
            }
        };
    }
});
