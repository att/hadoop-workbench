define(function (require, exports, module) {
    "use strict";

    var angular = require('angular');
    var dependencyPreprocessor = require('./dependency-preprocessor');

    /**
     * @typedef {{
     *  $meta: {
     *      schema: SchemaInstance,
     *      oneOf: SchemaInstance[]
     *  },
     *  instance: SchemaInstance,
     *  populate: function(*),
     *  toJSON: (function():*),
     *  isValidValue: (function(*):boolean),
     *  isRestrictedValue: (function():
     *  getValue: (function(string?):*)
     * }} SchemaItem
     */

    /**
     * @typedef {{
     *  schema: Object,
     *  enum?: *[],
     *  populate: function(*),
     *  toJSON: (function():*),
     *  isValidValue: (function(*):boolean),
     *  getValue: (function(string?): *)
     * }}SchemaInstance
     */

    var schemaInstanceFactories = {};
    /**
     * @param {Object}schema
     * @returns {SchemaInstance}
     */
    schemaInstanceFactories['string'] = function (schema) {
        return {
            schema: schema,
            value: typeof schema.default === 'string' ? schema.default : '',
            populate: function (value) {
                if (this.isValidValue(value)) {
                    this.value = '' + value;
                }
                return this;
            },
            setEnum: function (path, value) {
                extendWithEnum(this, value);
            },
            toJSON: function (isViewValueReturned) {
                if (isViewValueReturned) {
                    return this.getViewValue();
                }
                return this.value;
            },
            isValidValue: function (value) {
                return typeof value === 'string' || typeof value === 'number';
            },
            /**
             * Verify restrictions for scalar Schema element
             *
             * @returns {boolean|string}
             */
            isRestrictedValue: function() {
                return checkRestrictions(schema, this.getValue());
            },
            getValue: function () {
                return this.value;
            },
            getViewValue: function () {
                return getViewValue(this);
            },
            getChild: function (path) {
                if (path) {
                    throw new Error("successor [" + path + "] doesn't exists");
                }
                return this;
            },
            getPropertyInfo: function () {
                return this.schema;
            }
        };
    };
    /**
     * @param {Object}schema
     * @returns {SchemaInstance}
     */
    schemaInstanceFactories['number'] = function (schema) {
        return {
            schema: schema,
            value: typeof schema.default === 'number' ? schema.default : null,
            populate: function (value) {
                if (this.isValidValue(value)) {
                    this.value = value;
                }
                return this;
            },
            setEnum: function (path, value) {
                extendWithEnum(this, value);
            },
            toJSON: function (isViewValueReturned) {
                if (isViewValueReturned) {
                    return this.getViewValue();
                }
                return this.value;
            },
            isValidValue: function (value) {
                return value === null || (typeof value === 'number' && !isNaN(value));
            },
            /**
             * Verify restrictions for scalar Schema element
             *
             * @returns {boolean|string}
             */
            isRestrictedValue: function() {
                return checkRestrictions(schema, this.getValue());
            },
            getValue: function () {
                return this.value;
            },
            getViewValue: function () {
                return getViewValue(this);
            },
            getChild: function (path) {
                if (path) {
                    throw new Error("successor [" + path + "] doesn't exists");
                }
                return this;
            },
            getPropertyInfo: function () {
                return this.schema;
            }
        };
    };
    /**
     * @param {Object}schema
     * @returns {SchemaInstance}
     */
    schemaInstanceFactories['integer'] = function (schema) {
        return {
            schema: schema,
            value: typeof schema.default === 'number' ? Math.floor(schema.default) : null,
            populate: function (value) {
                if (this.isValidValue(value)) {
                    this.value = value;
                }
                return this;
            },
            setEnum: function (path, value) {
                extendWithEnum(this, value);
            },
            toJSON: function (isViewValueReturned) {
                if (isViewValueReturned) {
                    return this.getViewValue();
                }
                return this.value;
            },
            isValidValue: function (value) {
                return (typeof value === 'number' && value === Math.floor(value) && !isNaN(value));
            },
            /**
             * Verify restrictions for scalar Schema element
             *
             * @returns {boolean|string}
             */
            isRestrictedValue: function() {
                return checkRestrictions(schema, this.getValue());
            },
            getValue: function () {
                return this.value;
            },
            getViewValue: function () {
                return getViewValue(this);
            },
            getChild: function (path) {
                if (path) {
                    throw new Error("successor [" + path + "] doesn't exists");
                }
                return this;
            },
            getPropertyInfo: function () {
                return this.schema;
            }
        };
    };
    /**
     * @param {Object}schema
     * @returns {SchemaInstance}
     */
    schemaInstanceFactories['boolean'] = function (schema) {
        return {
            schema: schema,
            value: typeof schema.default === 'boolean' ? schema.default : false,
            populate: function (value) {
                if (this.isValidValue(value)) {
                    this.value = value;
                }
                return this;
            },
            toJSON: function (isViewValueReturned) {
                if (isViewValueReturned) {
                    return this.getViewValue();
                }
                return !!this.value;
            },
            isValidValue: function (value) {
                return typeof value === 'boolean';
            },
            /**
             * Verify restrictions for scalar Schema element
             *
             * @returns {boolean|string}
             */
            isRestrictedValue: function() {
                return checkRestrictions(schema, this.getValue());
            },
            getValue: function () {
                return !!this.value;
            },
            getViewValue: function () {
                return this.getValue();
            },
            getChild: function (path) {
                if (path) {
                    throw new Error("successor [" + path + "] doesn't exists");
                }
                return this;
            },
            getPropertyInfo: function () {
                return this.schema;
            }
        };
    };
    /**
     * @param {Object}schema
     * @returns {SchemaInstance}
     */
    schemaInstanceFactories['null'] = function (schema) {
        return {
            schema: schema,
            populate: function () {
                return this;
            },
            toJSON: function () {
                return null;
            },
            isValidValue: function (value) {
                return value === null;
            },
            /**
             * Verify restrictions for scalar Schema element
             *
             * @returns {boolean|string}
             */
            isRestrictedValue: function() {
                return checkRestrictions(schema, this.getValue());
            },
            getValue: function () {
                return null;
            },
            getViewValue: function () {
                return this.getValue();
            },
            getChild: function (path) {
                if (path) {
                    throw new Error("successor [" + path + "] doesn't exists");
                }
                return this;
            },
            getPropertyInfo: function () {
                return this.schema;
            }
        };
    };
    /**
     * @param {Object}schema
     * @returns {SchemaInstance}
     */
    schemaInstanceFactories['object'] = function (schema) {
        var requiredFields = schema.required || [];
        var result = {
            schema: schema,
            properties: Object.keys(schema.properties || {}).reduce(function (host, key) {
                if (schema.properties[key]) {
                    /**
                     * HWDAP-1706 (ui) user and password displayed as required for ssh
                     */
                    if (!(schema.title === "SSH access")) {
                        schema.properties[key]['required'] = requiredFields.indexOf(key) > -1;
                    }
                    schema.properties[key].title = schema.properties[key].title || key;
                }
                host[key] = parseSchemaItem(schema.properties[key]);
                return host;
            }, {}),
            populate: function (value) {
                if (this.isValidValue(value)) {
                    Object.keys(this.properties).forEach(function (propertyName) {
                        this.properties[propertyName].populate(value[propertyName]);
                    }.bind(this));
                } else if (isEmptyObject(value)) {
                    Object.keys(this.properties).forEach(
                        (propertyName) => this.properties[propertyName].populate(null)
                    )

                }
                return this;
            },
            toJSON: function (isViewValueReturned) {
                return Object.keys(this.properties).reduce(function (host, propertyName) {
                    host[propertyName] = this.properties[propertyName].toJSON(isViewValueReturned);
                    return host;
                }.bind(this), {});
            },
            isValidValue: function (value) {
                if (typeof value === 'object' && value !== null) {
                    var self = this;
                    var isValid = true;
                    var validFieldsCount = 0;

                    Object.keys(value).forEach(function (propName) {
                        if (self.properties[propName]) {
                            isValid = self.properties[propName].isValidValue(value[propName]);
                            if (isValid) {
                                validFieldsCount += 1;
                            }
                        }
                    });
                    return isValid && (validFieldsCount > 0 || isEmptyObject(value));
                }
                return false;
            },
            /**
             * Check object restrictions recursively
             * @returns {array}
             */
            isRestrictedValue: function() {
                var restricted, errors = [], props = this.properties;
                if (props) {
                    Object.keys(props).forEach(function(prop){
                        /**
                         * @type {boolean|string|array}
                         */
                        restricted = props[prop].instance.isRestrictedValue();
                        if (angular.isArray(restricted) && restricted.length > 0) {
                            restricted.forEach(function (error) {
                                error.prop = prop + '.' + error.prop;
                                errors.push(error);
                            });
                        } else if (restricted) {
                            errors.push({ prop: prop, message: restricted });
                        }
                    });
                }
                return errors.length ? errors : false;
            },
            getValue: function (path) {
                return traverse(this,  'getValue', path);
            },
            getViewValue: function (path) {
                return traverse(this,  'getViewValue', path, undefined, () => (this.toJSON(true)));
            },
            getChild: function (path) {
                return traverse(this,  'getChild', path);
            },
            getPropertyInfo: function (path) {
                return traverse(this,  'getPropertyInfo', path);
            },
            setEnum: function (path, value) {
                return traverse(this,  'setEnum', path, value,
                    function () { throw new Error("path is required") },
                    function (propertyName) { throw new Error("property" + propertyName + "doesn't exist") });
            }
        };
        if (typeof schema.default === 'object' && schema.default !== null) {
            result.populate(schema.default);
        }
        return result;
    };
    /**
     * @param {Object}schema
     * @returns {SchemaInstance}
     */
    schemaInstanceFactories['array'] = function (schema) {
        var result = {
            schema: schema,
            value: [],
            items: null,
            isItemsArray: false,
            addItem: function (value) {
                var item = this.items.create();
                if (value !== undefined) {
                    item.populate(value);
                }
                this.value = this.value.concat(item);
                return this;
            },
            populate: function (value) {
                if (this.isValidValue(value)) {
                    this.value = [];
                    value.forEach(function (itemValue) {
                        if (schema.isItemsArray) {
                            var itemIndex = getOneOfIndexByValue(itemValue, this.items.schemaItem.$meta.oneOf);
                            if (itemIndex > -1) {
                                this.value.push(this.items.schemaItem.$meta.oneOf[itemIndex].create().populate(itemValue));
                            }
                        } else {
                            this.value.push(this.items.create().populate(itemValue));
                        }
                    }.bind(this));
                }
                return this;
            },
            toJSON: function (isViewValueReturned) {
                return this.value.map(function (item) {
                    return item.toJSON(isViewValueReturned);
                });
            },
            isValidValue: function (value) {
                var self = this;
                return Array.isArray(value) && value.every(function (val) {
                        return self.items.schemaItem.isValidValue(val);
                    });
            },
            /**
             * Check array restrictions recursively
             * @returns {array}
             */
            isRestrictedValue: function() {
                var restricted, errors = [], valueArray = this.value;
                if (valueArray && valueArray.length) {
                    valueArray.forEach(function(arrayItemValue, arrayItemIndex) {
                        /**
                         * @type {boolean|string|array}
                         */
                        restricted = valueArray[arrayItemIndex].instance.isRestrictedValue();
                        if (angular.isArray(restricted) && restricted.length > 0) {
                            restricted.forEach(function(item) {
                                item.prop = '[' + arrayItemIndex + ']' + '.' + item.prop;
                                errors.push(item);
                            });
                        } else if (restricted) {
                            errors.push({prop: '[' + arrayItemIndex + ']', message: restricted});
                        }
                    });
                }
                return errors.length ? errors : false;
            },
            getValue: function (path) {
                return traverse(this, 'getValue', path);
            },
            getViewValue: function (path) {
                return traverse(this,  'getViewValue', path, undefined, () => (this.toJSON(true)));
            },
            getChild: function (path) {
                return traverse(this, 'getChild', path);
            },
            getPropertyInfo: function (path) {
                return traverse(this, 'getPropertyInfo', path);
            }
        };
        //items
        if (typeof schema.items === 'object') {
            switch (Array.isArray(schema.items)) {
                case true:
                    switch (schema.items.length) {
                        case 0:
                            break;
                        case 1:
                            result.items = {
                                schemaItem: parseSchemaItem(schema.items[0]),
                                create: function () {
                                    return parseSchemaItem(schema.items[0]);
                                }
                            };
                            result.isItemsArray = false;
                            break;
                        default:
                            result.items = {
                                schemaItem: parseSchemaItem({
                                    oneOf: schema.items
                                }),
                                create: function () {
                                    return parseSchemaItem({
                                        oneOf: schema.items
                                    });
                                }
                            };
                            result.isItemsArray = true;
                    }
                    break;
                case false:
                    result.items = {
                        schemaItem: parseSchemaItem(schema.items),
                        create: function () {
                            return parseSchemaItem(schema.items);
                        }
                    };
                    result.isItemsArray = false;
            }
        }

        return result;
    };

    /**
     * @param {Object}schema
     * @returns {SchemaInstance}
     */
    schemaInstanceFactories['undefined'] = function (schema) {
        return {
            schema: schema,
            populate: angular.noop,
            toJSON: angular.noop,
            isValidValue: function () {
                return false;
            },
            /**
             * Verify restrictions for scalar Schema element
             *
             * @returns {boolean|string}
             */
            isRestrictedValue: function() {
                return checkRestrictions(schema, this.getValue());
            },
            getValue: function () {
                return undefined;
            },
            getViewValue: function () {
                return this.getValue();
            },
            getChild: function (path) {
                if (path) {
                    throw new Error("successor [" + path + "] doesn't exists");
                }
                return this;
            },
            getPropertyInfo: function () {
                return this.schema;
            }
        };
    };

    /**
     * @param {Object}schema
     * @returns {SchemaInstance}
     */
    function parseSchemaInstance(schema) {
        var schemaInstanceFactory = schemaInstanceFactories[schema.type] || schemaInstanceFactories['undefined'];
        var schemaInstance = schemaInstanceFactory(schema);
        if (schemaInstance) {
            //enum
            if (Array.isArray(schema.enum)) {
                schemaInstance = extendWithEnum(schemaInstance, schema);
            }
        }
        if (schema.default !== undefined) {
            schemaInstance.populate(schema.default);
        }
        return schemaInstance;
    }

    function extendWithEnum(instance, schema) {
        instance['enum'] = schema.enum;
        instance['enumLabels'] = schema.enumLabels || schema.enum.reduce(function (host, value) {
                host[value] = value;
                return host;
            }, {});

        var instanceExtendedWithEnum = instance.enum;
        if (!instanceExtendedWithEnum) {
            var originalPopulate = instance.populate;
            instance.populate = function (value) {
                if (schema.enum.some(function (enumValue) {
                        return angular.equals(value, enumValue);
                    })) {
                    originalPopulate.call(instance, value);
                }
            };
            instance.populate(instance['enum'][0]);
        }

        return instance;
    }

    /**
     * @param {SchemaInstance}schemaInstance
     * @returns {SchemaItem}
     */
    function schemaItem(schemaInstance) {
        var result = {
            $meta: {
                schema: schemaInstance.schema,
                oneOf: (schemaInstance.schema.oneOf || []).map(function (oneOfSchema) {
                    return parseSchemaInstance(Object.assign({}, schemaInstance.schema, {
                        oneOf: [],
                        'default': oneOfSchema.default
                    }, oneOfSchema));
                })
            },
            instance: null,
            populate: function (value) {
                if (this.$meta.oneOf.length > 0) {
                    var oneOfIndex = getOneOfIndexByValue(value, this.$meta.oneOf);

                    console.assert(oneOfIndex > -1, 'Passed value does not match any oneOf description. Value/schema:', value, this.$meta.schema);

                    if (oneOfIndex > -1) {
                        this.instance = this.$meta.oneOf[oneOfIndex];
                    } else {
                        return this;
                    }
                }
                this.instance.populate(value);
                return this;
            },
            setEnum: function (path, value) {
                return this.instance.setEnum(path, value);
            },
            toJSON: function (isViewValueReturned) {
                return this.instance ? this.instance.toJSON(isViewValueReturned) : undefined;
            },
            isValidValue: function (value) {
                if (this.$meta.oneOf.length > 0) {
                    return this.$meta.oneOf.some(function (item) {
                        return item.isValidValue(value);
                    });
                }
                if (!this.instance) {
                    return false;
                }
                return this.instance.isValidValue(value);
            },
            getValue: function (path) {
                if (!this.instance) {
                    //todo: Maybe an exception must be thrown in this case
                    return undefined;
                }
                return this.instance.getValue(path);
            },
            getViewValue: function (path) {
                if (!this.instance) {
                    //todo: Maybe an exception must be thrown in this case
                    return undefined;
                }
                return this.instance.getViewValue(path);
            },
            getChild: function (path) {
                if (!this.instance) {
                    //todo: Maybe an exception must be thrown in this case
                    return undefined;
                }
                return this.instance.getChild(path);
            },
            getPropertyInfo: function (path) {
                if (!this.instance) {
                    //todo: Maybe an exception must be thrown in this case
                    return undefined;
                }
                return this.instance.getPropertyInfo(path);
            },
            isRestrictedValue: function() {
                if (this.$meta.oneOf.length > 0) {
                    return this.$meta.oneOf.some(function (item) {
                        return item.isRestrictedValue();
                    });
                }
                if (!this.instance) {
                    return false;
                }
                return this.instance.isRestrictedValue();

            }
        };
        if (result.$meta.oneOf.length > 0) {
            if (result.$meta.schema.default !== undefined) {
                var oneOfIndex = getOneOfIndexByValue(schemaInstance.schema.default, result.$meta.oneOf);

                console.assert(oneOfIndex > -1, 'Default value does not match any oneOf description. Value/schema:', schemaInstance.schema.default, result.$meta.schema);

                if (oneOfIndex > -1) {
                    result.instance = result.$meta.oneOf[oneOfIndex];
                    result.instance.populate(schemaInstance.schema.default);
                }
            } else {
                result.instance = result.$meta.oneOf[0];
            }
        } else {
            result.instance = schemaInstance;
        }
        return result;
    }

    function parseSchemaItem(schema) {
        var schemaInstance = schemaItem(parseSchemaInstance(schema));

        if (schema.dependencies) {
            schemaInstance = dependencyPreprocessor.instantiateDependencies(schemaInstance);
        }

        return schemaInstance;
    }

    function getViewValue(obj) {
        if (obj.schema && obj.schema.enumLabels) {
            let label = obj.schema.enumLabels[obj.value];
            if (label !== undefined) {
                return label;
            }
        }
        return obj.value;
    }

    function getOneOfIndexByValue(value, oneOf) {
        var filtered = oneOf.filter(function (schemaItem) {
            return schemaItem.isValidValue(value);
        });
        return oneOf.indexOf(filtered[0]);
    }

    /**
     * Apply "operation" call on tree for next subsequent child
     * @param {Object} obj
     * @param {string} operation // method name
     * @param {string} path
     * @param value <optional>
     * @param {function()} <optional> noPathResponse
     * @param {function({string})} <optional> noPropertyResponse
     * @returns {*}
     */
    function traverse(obj, operation, path, value, noPathResponse, noPropertyResponse) {
        if (!path) {
            if (noPathResponse) {
                return noPathResponse();
            } else {
                return obj.toJSON();
            }
        }
        var propertyName = getRootPropertyNameInPath(path);
        if (propertyName && obj.properties && obj.properties[propertyName]) {
            return obj.properties[propertyName][operation](getOtherPartOfPath(path, propertyName), value);
        } else {
            if (noPropertyResponse) {
                return noPropertyResponse(propertyName);
            } else {
                return undefined;
            }
        }
    }


    function getRootPropertyNameInPath(path) {
        var splitPath = path.split(/\.|\[|\]/).filter(function (s) {
            return !!s;
        });
        return splitPath.shift();
    }

    function getOtherPartOfPath(path, rootProperty) {
        return path.replace(new RegExp('^' + rootProperty + '(.|\\[|\\])?'), '');
    }

    function isEmptyObject(value) {
        try {
           return typeof value === "object" && JSON.stringify(value) === "{}";
        } catch (e) {
            console.assert(e);
            return false
        }
    }

    /**
     * Check restriction for scalar type Schema element
     * @param schema
     * @param value
     * @returns {boolean | string}
     */
    function checkRestrictions(schema, value) {
        var valid = true, error = false,
            restrictions = schema.restrictions || [],
            required = schema.required;

        /*
        example:

        var jsonSchema = {
            type: 'object',
            title: 'Properties',
            properties: {
                name: {
                    type: 'string',
                    restrictions: [
                        {type: 'pattern', value: /^[a-zA-Z]*$/, message: 'Invalid format'},
                        {type: 'min-length', value: 3, message: 'Min length: 3'},
                        {type: 'max-length', value: 6}
                    ]
                },
                version: {
                    type: 'string'
                },
                description: {
                    type: 'string'
                }
            },
            required: ['name', 'version']

        };
        */


        if (required && !value) {
            error = 'required';
        } else if (restrictions.length) {
            restrictions.forEach(function(restriction){
                if (valid) {
                    if(restriction.value) {

                        if (restriction.type == 'pattern') {

                            valid = new RegExp(restriction.value).test(value);

                        } else if (restriction.type == 'min-length') {

                            valid = (value.length >= +restriction.value);

                        } else if (restriction.type == 'max-length') {

                            valid = (value.length <= +restriction.value);

                        }

                        if (!valid) {
                            error = restriction.message || ('Invalid value: ' + restriction.type + ' - ' + restriction.value);
                        }

                    }
                }
            });
        }

        return error;

    }

    /**
     * Scan tree with all it child for scalar values which have schema applying to criteriaFunction
     *  for example find all files criteriaFunc = (schema) => (shema.isFileRef == true)
     * @param property
     * @param criteriaFunction
     * @returns Array
     */
    function fetchFlatValuesFromJsonSchemaInstanceUsingFunctor(property, criteriaFunction) {
        var foundValues = [];
        if (property && property.instance && property.instance.schema) {
            var schema = property.instance.schema;
            switch (schema.type) {
                /**
                 * All scalar types
                 */
                case 'string':
                case 'number':
                case 'integer':
                case 'boolean':
                case 'null':
                case 'undefined':
                    if (criteriaFunction(schema)) {
                        var value = property.instance.getValue();
                        if (value !== undefined) {
                            foundValues.push(value);
                        }
                    }
                    return foundValues;
                    break;
                case 'object':
                    if (property.instance.properties) {
                        return foundValues.concat(Object.keys(property.instance.properties).reduce(function (collector, childPropertyName) {
                            return collector.concat(fetchFlatValuesFromJsonSchemaInstanceUsingFunctor(property.instance.properties[childPropertyName], criteriaFunction));
                        }, []));
                    }
                    break;
                case 'array':
                    if (property.instance.value && property.instance.value.length && angular.isArray(property.instance.value)) {
                        return foundValues.concat(property.instance.value.reduce(function (collector, childProperty) {
                                return collector.concat(fetchFlatValuesFromJsonSchemaInstanceUsingFunctor(childProperty, criteriaFunction));
                            }, [])
                        );
                    }
                    break;
                default:
                    return foundValues;
            }
        }
        return foundValues;
    }


    exports['parseSchemaItem'] = parseSchemaItem;
    exports['parseSchemaInstance'] = parseSchemaInstance;
    exports['fetchFlatValuesFromJsonSchemaInstanceUsingFunctor'] = fetchFlatValuesFromJsonSchemaInstanceUsingFunctor;
});
