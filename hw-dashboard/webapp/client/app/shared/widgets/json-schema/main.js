define(function (require) {
    "use strict";

    require('./ngModule');

    require('./services/json-schema-builder');
    require('./services/dependency-preprocessor');
    require('./services/types');
    require('./services/subtype-property-restriction-preprocessor');

    require('./directives/coverPassword');
    require('./directives/json-schema-hover');

    require('./components/json-schema-item/index');
    require('./components/json-schema-item-icon/index');
    require('./components/json-schema-object/index');
    require('./components/json-schema-array/index');
    require('./components/json-schema-string/index');
    require('./components/json-schema-number/index');
    require('./components/json-schema-integer/index');
    require('./components/json-schema-boolean/index');
    require('./components/json-schema-null/index');
    require('./components/json-schema-undefined/index');
});
