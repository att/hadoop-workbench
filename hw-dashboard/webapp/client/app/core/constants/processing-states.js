define(function (require) {
    "use strict";

    require('../ngModule').constant('core.processing-states', {
        IDLE: 'IDLE',
        SAVING: 'SAVING',
        SAVED: 'SAVED',
        DELETING: 'DELETING',
        DELETED: 'DELETED',
        FETCHING: 'FETCHING',
        FETCHED: 'FETCHED',
        REQUESTING: 'REQUESTING',
        SUCCEEDED: 'SUCCEEDED',
        FAILED: 'FAILED',

        isLoading: function (state) {
            switch (state) {
                case this.SAVING:
                case this.DELETING:
                case this.FETCHING:
                case this.REQUESTING:
                    return true;
                default:
                    return false;
            }
        }
    });
});
