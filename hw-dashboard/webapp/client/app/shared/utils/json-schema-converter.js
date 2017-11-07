// description of setImmediate benefits http://www.nczonline.net/blog/2013/07/09/the-case-for-setimmediate/
define(function (require) {
    "use strict";

    var ng = require('angular');
    ng.module('utils', ['dap.core', 'shared.widgets'])
        .service('utils.JsonSchemaConverter', JsonSchemaConverter);

    JsonSchemaConverter.$inject = [
        'shared.jsonSchemaBuilder'
    ];
    function JsonSchemaConverter(jsonSchemaBuilder) {
        var self = this;

        this.buildSchemaByJson = function (json, options) {
            options = options || {};

            switch (typeof json) {
                case 'object':
                    if (json === null) {
                        return createSchemaBase('null', options.title);
                    }
                    if (ng.isArray(json)) {
                        return self.buildSchemaArray(json, options.title);
                    }
                    return self.buildSchemaObject(json, options.title);
                case 'string':
                case 'number':
                case 'boolean':
                case 'undefined':
                    return createSchemaBase(typeof value, options.title);
            }
        };

        this.buildSchemaObject = function (obj, title) {
            var schema = createSchemaBase('object', title);
            schema.properties = {};
            ng.forEach(obj, function (val, key) {
                schema.properties[key] = self.buildSchemaByJson(val);
            });
            return schema;
        };

        this.buildSchemaArray = function (arr, title) {
            var schema = createSchemaBase('array', title);
            schema.items = {
                type: 'any'
            };
            ng.forEach(arr, function (val, key) {
                schema[key] = self.buildSchemaByJson(val);
            });
            return schema;
        };

        function createSchemaBase(type, title) {
            type = type || 'any';
            title = title || '';

            return {
                title: title,
                type: type
            };
        }
    }
})
;
