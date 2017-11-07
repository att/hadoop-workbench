define(function (require) {
    "use strict";

    require('../ngModule').service('configuration.Store', getStore);

    getStore.$inject = ['flux', 'configuration.actionEvents'];
    function getStore(flux, actionEvents) {
        return flux.createStore(function (exports) {

        });
    }
});