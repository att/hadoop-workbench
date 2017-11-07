define(function (require) {
    "use strict";

    var angular = require('angular');
    require('../ngModule').factory('platform.models.JsonSectionPropertyMetaFactory', getFactory);

    getFactory.$inject = [];
    function getFactory() {

        function JsonSectionPropertyMeta(metadata) {
            if (metadata && (!metadata.properties)) {
                console.log('Error JsonSection Property metadata is broken:', metadata);
            }

            var _metaProperties = metadata.properties;
            var defaultValues = {};
            Object.keys(_metaProperties).forEach(key => {
                defaultValues[key] = getDefault(_metaProperties[key]);
            });
            /*
                // Example of MetaProperty structure
             {
                type: "object"|"array"

                    propertyOptions:
                        default: <string>|number|null
                        type: string|boolean|number
                        isTitleField: boolean
                        isNullAble: boolean
                        min: <integer>
             }
             // NOTE: only "object" type is supported currently
             */
            function JsonSectionProperty(options) {
                Object.keys(_metaProperties).forEach(optionKey => {
                    this[optionKey] = getPropertyValue(_metaProperties[optionKey], options[optionKey])
                });
            }

            JsonSectionProperty.prototype = {
                toJSON: function () {
                    var result = {};
                    Object.keys(_metaProperties).forEach(key => {
                        result[key] = getJSONValue(_metaProperties[key], this[key]);
                    });
                    return result;
                },
                isNotEmpty: function () {
                    return Object.keys(_metaProperties).every(key => {
                        return this[key] !== defaultValues[key];
                    });
                }

            };

            JsonSectionProperty.factory = function (options) {

                var defaultOptions = {};
                Object.keys(_metaProperties).forEach(
                    key =>  {
                        defaultOptions[key] = getDefault(_metaProperties[key]);
                    }
                );

                options = angular.extend({}, defaultOptions, options);

                return new JsonSectionProperty(options);
            };

            JsonSectionProperty.processApiResponse = function (data) {
                if (angular.isArray(data)) {
                    return data.map(JsonSectionProperty.processApiResponse);
                }
                return JsonSectionProperty.factory(data);
            };

            function getDefault(meta) {
                var defaultValue = meta.default;
                if (defaultValue === undefined) {
                    switch (meta.type) {
                        case "string":
                            defaultValue = "";
                            break;
                        case "number":
                            defaultValue = null;
                            break;
                        case "boolean":
                            defaultValue = false;
                            break;
                        default:
                            defaultValue = "";
                            break;
                    }
                }
                return defaultValue;
            }

            function getPropertyValue(meta, optionValue) {
                var res;
                // pass restrictions according to:
/*

                "port": {
                    "title": "Oozie port",
                    "type": "number",
                    "default": 0,
                    "min": 0,
                    "isNullAble": true
                },
*/
                switch (meta.type) {
                    case "string":
                        res = optionValue;
                        break;
                    case "number":
                        res = meta.min === undefined ? optionValue
                                                     : Math.max(optionValue, meta.min);
                        break;
                    case "boolean":
                        res = optionValue;
                        break;
                    default:
                        res = "";
                        break;
                }

                return res;
            }

            function getJSONValue(meta, value) {
                var jsonValue = value;
                switch (meta.type) {
                    case "string":
                        break;
                    case "number":
                        if (meta.min !== undefined) {
                            jsonValue = Math.max(meta.min, jsonValue);
                        }
                        if (!meta.isNullAble) {
                            jsonValue = jsonValue || 0;
                        } else {
                            jsonValue = jsonValue || null;
                        }
                        break;
                    case "boolean":
                        break;
                    default:
                        jsonValue = "";
                        break;
                }

                return jsonValue;
            }

            return JsonSectionProperty;
        }

        return JsonSectionPropertyMeta;
    }
});
