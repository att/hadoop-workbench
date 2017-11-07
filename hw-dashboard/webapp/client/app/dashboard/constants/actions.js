define(function (require) {
    "use strict";

    require('../ngModule').constant('dashboard.actions', {
        'FETCH_WIDGETS': 'dashboard-FETCH_WIDGETS',
        'REMOVE_WIDGET': 'dashboard.REMOVE_WIDGET',
        'ADD_WIDGET': 'dashboard.ADD_WIDGET'
    });
});
