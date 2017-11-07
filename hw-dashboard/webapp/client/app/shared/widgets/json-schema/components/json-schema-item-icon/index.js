define(function (require, exports, module) {
    "use strict";

    require('../../ngModule').component('json-schema-item-icon', {
        template: `
            <i class="json-schema-item icon-js-{{serviceId}}"></i>
        `,
        scope: {
            serviceId: '@data'
        }
    });
});
