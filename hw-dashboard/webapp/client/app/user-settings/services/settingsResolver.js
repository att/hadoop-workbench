define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('userSettings.settingsResolver', settingsResolver);

    settingsResolver.$inject = ['$q', '$rootScope', "userSettings.storage"];
    function settingsResolver($q, $rootScope, storage) {
        return {
            resolve: function (currentUser) {
                if (storage.isInitialized() && $rootScope.currentUser) {
                    return $q.when(storage);
                } else {
                    var deferred = $q.defer();
                    var unwatch = $rootScope.$watch('currentUser', function (currentUser) {
                        if (ng.isDefined(currentUser)) {
                            if (currentUser !== null) {
                                storage.init(currentUser.login).then(function () {
                                    deferred.resolve(storage);
                                });
                            } else {
                                deferred.reject({reason: 'unauthorised'});
                            }
                            unwatch();
                        }
                    });
                    return deferred.promise;
                }
            }
        };
    }
});
