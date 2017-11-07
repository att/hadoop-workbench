define(function (require) {
    "use strict";

    require('../ngModule').factory('authInterceptor', authInterceptor);

    authInterceptor.$inject = ['$rootScope', '$q', '$window', '$location', 'auth.AUTH_EVENTS'];
    function authInterceptor($rootScope, $q, $window, $location, AUTH_EVENTS) {
        return {
            request: function (config) {
                config.headers = config.headers || {};
                if ($window.localStorage.token) {
                    config.headers.Authorization = $window.localStorage.token;
                }
                return config;
            },
            responseError: function(rejection){
                $rootScope.$emit({
                    401: AUTH_EVENTS.notAuthenticated,
                    403: AUTH_EVENTS.notAuthorized,
                    419: AUTH_EVENTS.sessionTimeout,
                    440: AUTH_EVENTS.sessionTimeout
                }[rejection.status], rejection);
                return $q.reject(rejection);
            }
        };
    }
});
