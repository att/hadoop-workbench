define(function (require) {
    "use strict";

    require('../ngModule').factory('dap.core.shared.validation.ValidatorService', function () {
        return function () {
            var VALIDATION_TYPES = {
                ERROR: 1,
                WARNING: 2
            };

            var validationRules = {};
            /**
             *  [{
             *       valid: {boolean},
             *       message: {string},
             *       invalidNodes: {array}
             *       propertyPath: restrictedError.prop,        // @TODO: use in error display to jump on property directly 
             *       invalidNodeIds: {array}    // @deprecated
             *   }, ...];
             * @type {Array}
             */
            var errors = [];
            var warnings = [];

            /**
             * Removes all warnings generated during validation process
             */
            this.clearWarnings = function () {
                warnings.splice(0, warnings.length);
            };

            /**
             * Removes all errors generated during validation process
             */
            this.clearErrors = function () {
                errors.splice(0, errors.length);
            };

            /**
             * Adds error rule to validate during validation process
             * @param event group name for validation rules
             * @param rule Error rule to trigger
             */
            this.addErrorRule = function (event, rule) {
                addValidationRule(event, VALIDATION_TYPES.ERROR, rule);
            };

            /**
             * Adds warning rule to validate during validation process
             * @param event group name for validation rules
             * @param rule Error rule to trigger
             */
            this.addWarningRule = function (event, rule) {
                addValidationRule(event, VALIDATION_TYPES.WARNING, rule);
            };

            /**
             * Runs through validation rules of error type and triggers each passing in values
             * @param event Group name for validation rules
             * @param values Actual values passed to validation rules
             * @returns {boolean} true if validation passes, false otherwise
             */
            this.validateErrors = function (event, values) {
                var result = validate(event, VALIDATION_TYPES.ERROR, values);
                errors = errors.concat(result);
                return errors.length === 0;
            };

            this.validateErrorsOnConnection = function (from, to, connections) {
                var rules = validationRules.connections[VALIDATION_TYPES.ERROR];
                var rulesToValidateFrom = rules.filter(function (rule) {
                    var matchesForTypes = rule.matchesSpec(from.node.type, to.node.type, "out", from.connector);
                    var matchesForSubtypes = rule.matchesSpec(from.node.subtype, to.node.subtype, "out", from.connector);
                    return rule.ruleType !== "minConnectionOccurs" && (matchesForTypes || matchesForSubtypes);
                });
                var rulesToValidateTo = rules.filter(function (rule) {
                    var matchesForTypes = rule.matchesSpec(from.node.type, to.node.type, "in", to.connector);
                    var matchesForSubtypes = rule.matchesSpec(from.node.subtype, to.node.subtype, "in", to.connector);
                    return rule.ruleType !== "minConnectionOccurs" && (matchesForTypes || matchesForSubtypes);
                });

                var result = [];

                var fromValidationValues = {
                    nodes: [from.node],
                    connections: connections
                };
                rulesToValidateFrom.forEach(function (rule) {
                    var validationResult = rule.validate(fromValidationValues);
                    if (!validationResult.valid) {
                        result.push(validationResult);
                    }
                });

                var toValidationValues = {
                    nodes: [to.node],
                    connections: connections
                };
                rulesToValidateTo.forEach(function (rule) {
                    var validationResult = rule.validate(toValidationValues);
                    if (!validationResult.valid) {
                        result.push(validationResult);
                    }
                });

                errors = errors.concat(result);
                return errors.length === 0;
            };

            /**
             * Runs through validation rules of json schema and triggers each passing in values
             * @param event Group name for validation rules
             * @param values Actual values passed to schemaValidator
             * @returns {boolean} true if validation passes, false otherwise
             */
            this.validateSchema = function (event, values) {
                var result = [];
                var schemaRestrictionErrors = isValidSchema(values);
                if (schemaRestrictionErrors && schemaRestrictionErrors.length > 0) {
                    result = schemaRestrictionErrors;
                }
                warnings = warnings.concat(result);
                return result.length === 0;
            };

            /**
             * Runs through validation rules of warning type and triggers each passing in values
             * @param event Group name for validation rules
             * @param values Actual values passed to validation rules
             * @returns {boolean} true if validation passes, false otherwise
             */
            this.validateWarnings = function (event, values) {
                var result = validate(event, VALIDATION_TYPES.WARNING, values);
                warnings = warnings.concat(result);
                return warnings.length === 0;
            };

            /**
             * Returns errors list generated during validation process
             * @returns {array} errors list
             */
            this.getErrors = function () {
                return errors;
            };

            /**
             * Returns warnings list generated during validation process
             * @returns {array} warnings list
             */
            this.getWarnings = function () {
                return warnings;
            };

            var addValidationRule = function (event, type, rule) {
                if (!validationRules[event]) {
                    validationRules[event] = {};
                    validationRules[event][VALIDATION_TYPES.ERROR] = [];
                    validationRules[event][VALIDATION_TYPES.WARNING] = [];
                }

                validationRules[event][type].push(rule);
            };

            var validate = function (event, type, values) {
                var result = [];
                var rules = validationRules[event] ? validationRules[event][type] || [] : [];
                for (var i = 0; i < rules.length; i = i + 1) {
                    var validationResult = rules[i].validate(values);
                    if (!validationResult.valid) {
                        result.push(validationResult);
                    }
                }

                return result;
            }.bind(this);

            /**
             * Verify schema and get  schema errors // only first error from each field
             * @param values [NodeMixedConstructor]
             * @returns {Array}
             */
            var isValidSchema = function (values) {
                var schemaErrors = [];
                values.forEach(function (value) {
                    Object.keys(value.properties).forEach(function (key) {
                        var property = value.properties[key];
                        var restrictedErrors = property.isRestrictedValue && property.isRestrictedValue();
                        if (restrictedErrors && restrictedErrors.length) {
                            restrictedErrors.forEach(function (restrictedError) {
                                schemaErrors.push (
                                    {
                                        valid: false,
                                        message: "Node \"" + value.id + "\", property '" + restrictedError.prop + "' : " + restrictedError.message,
                                        propertyPath: restrictedError.prop,
                                        invalidNodes: [value]
                                    }
                                );
                            })
                        }
                    });
                });
                return schemaErrors;
            };
        };
    });
});
