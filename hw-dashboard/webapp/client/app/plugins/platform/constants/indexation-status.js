define(function (require) {
    "use strict";
    // index process statuses
    require('../ngModule').constant('cluster.indexation.status', {
        'RUNNING': 'running',
        'NOT_RUNNING': 'notRunning',
        'STARTING': 'transitive_from_notRunning',
        'STOPPING': 'transitive_from_running'
    });
});
