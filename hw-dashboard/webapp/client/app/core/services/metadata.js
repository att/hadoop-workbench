define(function (require) {
    "use strict";

    require('../ngModule').factory('core.metadata', getFactory);

    getFactory.$inject = [
        'core.processing-states'
    ];
    function getFactory(processingStates) {
        return function (options) {
            return Object.assign({
                pendingCreate: false,
                pendingUpdate: false,
                deleted: false,
                busy: false,
                processingState: processingStates.IDLE,
                error: null
            }, options);
        };
    }
});
