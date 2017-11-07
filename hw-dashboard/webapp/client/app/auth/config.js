define(function (require) {
    "use strict";

    require('./ngModule').config(configure);

    configure.$inject = ['$stateProvider', '$httpProvider', 'dap.core.config'];
    function configure($stateProvider, $httpProvider, dapConfig) {
        $httpProvider.interceptors.push('authInterceptor');

        $stateProvider
            .state('app.auth-login', {
                url: 'auth?r',
                templateUrl: dapConfig.pathToApp + '/auth/views/login.html',
                controller: 'auth.loginController',
                resolve: {
                }
            });
    }
});
