define(function (require) {
    "use strict";

    var types = require('./types');
    require('../ngModule').service('shared.jsonSchemaBuilder', JsonSchemaBuilder);

    function JsonSchemaBuilder() {
        this.createSchema = function (jsonSchema) {
            return types.parseSchemaItem(jsonSchema);
        };
    }
});
