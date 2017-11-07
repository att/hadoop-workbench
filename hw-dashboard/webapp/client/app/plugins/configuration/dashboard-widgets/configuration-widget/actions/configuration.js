define(function (require) {
    "use strict";

    require('../ngModule').factory('configuration.ActionsCreator', getFactory);

    getFactory.$inject = [
        'flux',
        'configuration.actionEvents',
        'configuration.restService'
    ];
    function getFactory(flux, actionEvents, restService) {
        return {};
    }
});
