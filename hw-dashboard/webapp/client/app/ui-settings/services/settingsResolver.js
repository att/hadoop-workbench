define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('uiSettings.settingsResolver', settingsResolver);

    settingsResolver.$inject = ['$q', '$rootScope', "uiSettings.storage"];
    function settingsResolver($q, $rootScope, storage) {
        return {
            resolve: function () {
                if (storage.isInitialized() && $rootScope.currentUser) {
                    return $q.when(storage);
                } else {
                    var deferred = $q.defer();
                    storage.init().then(function () {
                        deferred.resolve(storage);
                    }, function(error) {
                        deferred.reject({reason: error});
                    });
                    return deferred.promise;
                }
            }
        };
    }
});
