define(function (require) {
    "use strict";

    require('./ngModule').config(configure);

    configure.$inject = [
        '$locationProvider',
        'RestangularProvider',
        'hotkeysProvider'
    ];
    function configure($locationProvider, RestangularProvider, hotkeysProvider) {
        $locationProvider
            .html5Mode(false)
            .hashPrefix('');

        RestangularProvider.addResponseInterceptor(function (data, operation, what, url, response, deferred) {
            return data.data;
        });

        hotkeysProvider.useNgRoute = false;
        hotkeysProvider.includeCheatSheet = false;
    }
});