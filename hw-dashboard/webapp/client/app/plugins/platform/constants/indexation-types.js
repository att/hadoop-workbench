define(function (require) {
    "use strict";
    // index process statuses
    require('../ngModule').constant('cluster.indexation.types', {
        "OOZIE": 'oozie',
        "FLUME": 'flume',
    });
});
