define(function (require) {
    "use strict";
    // server locations
    require('../ngModule').constant('platform.locations', {
        'DEFAULT': 'default',
        'PREMISE': 'on-premise',
        'GOOGLE_CLOUD': 'google-cloud',
        'MICROSOFT_AZURE': 'microsoft-azure',
        'DIRECTV': 'directv',
        'ATT': 'att',
        'AMAZON': 'amazon',
        'KUBERNETES': 'k8s'
    });
});
