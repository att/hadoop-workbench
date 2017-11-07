define(function (require) {
    "use strict";
    require('../ngModule').constant('cluster.config.request.status', {
        'RUNNING': 'running',
        'NOT_RUNNING': 'notRunning'
    });
});
