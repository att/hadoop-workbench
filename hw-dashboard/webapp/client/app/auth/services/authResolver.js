define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('auth.authResolver', authResolver);

    authResolver.$inject = ['$q', '$rootScope'];
    function authResolver($q, $rootScope) {
        return {
            resolve: function () {
                var deferred = $q.defer();
                var unwatch = $rootScope.$watch('currentUser', function (currentUser) {
                    if (ng.isDefined(currentUser)) {
                        if (currentUser) {
                            deferred.resolve(currentUser);
                        } else {
                            deferred.reject({reason: 'unauthorised'});
                        }
                        unwatch();
                    }
                });
                return deferred.promise;
            }
        };
    }
});
