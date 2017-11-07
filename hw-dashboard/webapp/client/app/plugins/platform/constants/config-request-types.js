define(function (require) {
    "use strict";
    require('../ngModule').constant('cluster.config.request.types', {
        'PULL': 'pullRequest',
        'PUSH': 'pushRequest'
    });
});
