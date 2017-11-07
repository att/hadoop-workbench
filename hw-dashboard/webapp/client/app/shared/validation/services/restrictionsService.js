define(function (require) {
    "use strict";

    require('../ngModule').factory("dap.shared.validation.RestrictionsService", getRestrictionsService);

    var ng = require("angular");

    getRestrictionsService.$inject = [
        'dap.core.shared.validation.ValidatorService',
        'dap.core.shared.validation.MinNodeOccurs',
        'dap.core.shared.validation.MaxNodeOccurs',
        'dap.shared.validation.MinConnectionOccurs',
        'dap.shared.validation.MaxConnectionOccurs',
        'dap.shared.validation.TransitionOccurs',
        'dap.core.shared.validation.PatternMatcher',
        'dap.core.shared.validation.UniqueField'
    ];

    function getRestrictionsService(Validator, MinNodeOccurs, MaxNodeOccurs, MinConnectionOccurs, MaxConnectionOccurs, TransitionOccurs, PatternMatcher, UniqueField) {

        RestrictionsService.factory = function () {
            var restrictionsService = new RestrictionsService();
            restrictionsService.init();
            return restrictionsService;
        };

        return RestrictionsService;

        function RestrictionsService() {
            /*jshint forin:false*/

            var validator = null;

            this.init = function () {
                validator = new Validator();
            };

            this.processRestrictions = function (data, isProvision) {
                if (isProvision) {
                    createProvisionRestrictions(data);
                } else {
                    createRestrictions(data);
                }
            };

            this.getValidator = function () {
                validator.clearWarnings();
                validator.clearErrors();
                return validator;
            };

            /**
             * data = schema step
             * @param data
             */
            function createProvisionRestrictions(data) {
                if (data && data.propertyRestrictions && data.propertyRestrictions.length != -1) {
                    let mergedRestrictions = {
                        errors: [],
                        warnings: []
                    };
                    mergedRestrictions = mergeAndExtendProvisionRestrictions(data, data.propertyRestrictions[0], mergedRestrictions);

                    mergedRestrictions.errors.forEach(function (restriction) {
                        createProvisionValidationRule("error", restriction, true);
                    });
                }
            }

            function createRestrictions(data) {
                var elements = [];
                var typeRestrictions = null;
                var mergedTypeRestrictions = {
                    errors: [],
                    warnings: []
                };

                if (data.types) {
                    elements = data.types;
                    typeRestrictions = data.typeRestrictions;
                    mergeAndExtendTypeRestrictions(elements, typeRestrictions, data.typeWarnings, mergedTypeRestrictions);
                } else if (data.subtypes) {
                    for (var type in data.subtypes) {
                        elements = data.subtypes[type];
                        mergeAndExtendTypeRestrictions(elements, data.subtypeRestrictions, data.subtypeWarnings, mergedTypeRestrictions);
                    }
                }

                var connectionRestrictions = data.connectionRestrictions;
                var connectionWarnings = data.connectionWarnings;

                var { transitionRestrictions = []} = data;

                mergedTypeRestrictions.errors.forEach(function (restriction) {
                    createNodeValidationRule("error", restriction);
                });

                mergedTypeRestrictions.warnings.forEach(function (restriction) {
                    createNodeValidationRule("warning", restriction);
                });

                connectionRestrictions.forEach(function (restriction) {
                    createConnectionValidationRule("error", restriction);
                });

                connectionWarnings.forEach(function (warning) {
                    createConnectionValidationRule("warning", warning);
                });

                transitionRestrictions.forEach(function (restriction) {
                    createTransitionValidationRule("error", restriction)
                });



                createNodeValidationRule("error", {name: "uniqueField", field: "id"});
            }

            function mergeAndExtendTypeRestrictions(elements, typeRestrictions, typeWarnings, mergedRestrictions) {
                elements.forEach(function (element) {
                    element.restrictions.forEach(function (restriction) {
                        restriction.for = element.name;
                        mergedRestrictions.errors.push(restriction);
                    });

                    typeRestrictions.forEach(function (restriction) {
                        var rule = {};
                        ng.copy(restriction, rule);
                        rule.for = element.name;
                        mergedRestrictions.errors.push(rule);
                    });

                    element.warnings.forEach(function (warning) {
                        warning.for = element.name;
                        mergedRestrictions.warnings.push(warning);
                    });

                    typeWarnings.forEach(function (warning) {
                        var rule = {};
                        ng.copy(warning, rule);
                        rule.for = element.name;
                        mergedRestrictions.warnings.push(rule);
                    });
                });

                return mergedRestrictions;
            }

            function mergeAndExtendProvisionRestrictions (element, restrictions, mergedRestrictions) {

                restrictions.for = "provision";
                Object.keys(element.properties).forEach(function (idx) {
                    if (element.properties[idx].restrictions) {
                        restrictions.field = idx;

                        if (restrictions != 'undefined') {
                            mergedRestrictions.type = element.properties[idx].type;
                            mergedRestrictions.errors.push({
                                field: idx,
                                for: "provision",
                                name: restrictions.name,
                                type: restrictions.type,
                                value: restrictions.value
                            });
                        }
                    }
                });
                return mergedRestrictions;
            }

            function createConnectionValidationRule(type, restriction) {
                var restrictionFromNodeType = restriction.from || null;
                var restrictionToNodeType = restriction.to || null;
                var restrictionType = restriction.type;
                // TODO(maximk): remove `|| restriction.type` part when flume supports restriction.connector property
                var restrictionOutConnector = restriction.connector || restriction.type;

                var nameToConstructorMap = {
                    maxOccurs: MaxConnectionOccurs,
                    minOccurs: MinConnectionOccurs
                };

                var occurrencesCount = +restriction.value;
                var Constructor = nameToConstructorMap[restriction.name];

                try {
                    var rule = new Constructor(restrictionFromNodeType, restrictionToNodeType, restrictionType, restrictionOutConnector, occurrencesCount);
                } catch (e) {
                    console.error("failed to create " + restriction.name + " validation rule: " + e.message);
                }

                if (rule) {
                    switch (type) {
                        case "error":
                        {
                            validator.addErrorRule("connections", rule);
                            break;
                        }
                        case "warning":
                        {
                            validator.addWarningRule("connections", rule);
                            break;
                        }
                        default:
                        {
                            console.info("createConnectionValidationRule should receive only 'error' or 'warning' rule type, received: " + type);
                            break;
                        }
                    }
                }
            }

            function createTransitionValidationRule(type, restriction) {

                var Constructor = TransitionOccurs;

                var restrictionInitiated = ng.extend({
                    from: null,
                    to: null,
                    connector: null,
                    convergence: true,
                    via: [],
                    notTo: [],
                    childConnectorsIgnore: [],
                }, restriction);
                try {
                    var rule = new Constructor(restrictionInitiated);
                } catch (e) {
                    console.error("failed to create TransitionOccurs validation rule: " + e.message);
                }

                if (rule) {
                    switch (type) {
                        case "error":
                        {
                            validator.addErrorRule("transitions", rule);
                            break;
                        }
                        case "warning":
                        {
                            validator.addWarningRule("transitions", rule);
                            break;
                        }
                        default:
                        {
                            console.info("createTransitionValidationRule should receive only 'error' or 'warning' rule type, received: " + type);
                            break;
                        }
                    }
                }
            }

            function createProvisionValidationRule(type, restriction) {
                try {
                    var regexpPattern = new RegExp(restriction.value);

                    //return function (nodeType, fieldName, regexp, errorMessage)
                    var rule = new PatternMatcher("provision", restriction.field, regexpPattern);

                    if (type === "error") {
                        validator.addErrorRule("provision", rule);
                    } else if (type === "warning") {
                        validator.addWarningRule("provision", rule);
                    }
                } catch (e) {
                    console.error("failed to create Provision validation rule: " + e.message);
                }
            }

            function createPatternValidationRule(type, restriction) {
                try {
                    var regexpPattern = new RegExp(restriction.value);

                    //return function (nodeType, fieldName, regexp, errorMessage)
                    var rule = new PatternMatcher(restriction.for, restriction.field, regexpPattern);

                    // since pattern matcher is checked only during module validation, it is added under "nodE" category
                    // instead of "nodES" like every other rule
                    if (type === "error") {
                        validator.addErrorRule("node", rule);
                    } else if (type === "warning") {
                        validator.addWarningRule("node", rule);
                    }
                } catch (e) {
                    console.error("failed to create PatternMatcher validation rule: " + e.message);
                }
            }

            function createNodeValidationRule(type, restriction) {
                var rule = null;
                switch (restriction.name) {
                    case "pattern":
                    {
                        createPatternValidationRule(type, restriction);
                        break;
                    }
                    case "uniqueField":
                    {
                        try {
                            rule = new UniqueField(restriction.field);
                        }
                        catch (e) {
                            console.error("failed to create MaxNodeOccurs validation rule: " + e.message);
                        }

                        break;
                    }
                    case "maxOccurs":
                    {
                        try {
                            rule = new MaxNodeOccurs(restriction.for, +restriction.value);
                        }
                        catch (e) {
                            console.error("failed to create MaxNodeOccurs validation rule: " + e.message);
                        }

                        break;
                    }
                    case "minOccurs":
                    {
                        try {
                            rule = new MinNodeOccurs(restriction.for, +restriction.value);
                        }
                        catch (e) {
                            console.error("failed to create MinNodeOccurs validation rule: " + e.message);
                        }

                        break;
                    }
                }

                if (rule) {
                    switch (type) {
                        case "error":
                        {
                            validator.addErrorRule("nodes", rule);
                            break;
                        }
                        case "warning":
                        {
                            validator.addWarningRule("nodes", rule);
                            break;
                        }
                        default:
                        {
                            console.info("createConnectionValidationRule should receive only 'error' or 'warning' rule type, received: " + type);
                            break;
                        }
                    }
                }
            }
        }
    }
});
