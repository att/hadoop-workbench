define(function (require) {
    "use strict";

    require('../ngModule').component('object-properties', {
        template: '<json-schema-item schema-item="data" order="order" readonly="readonly"></json-schema-item>',
        scope: {
            data: '=',
            order: '=',
            readonly: '='
        }
    });
});
