define(function (require, exports, module) {
    "use strict";
    var angular = require('angular');

    /**
     * Design proposal:
     Action:
     show
     hide
     change value
     disable
     ==========
     Criteria list:
     All        (&&)
     Any        (||)

     Criteria:

     Field [one of exisiting fields]
     Is equal, Not equal, More, Less, [==, !=, <, >]
     Value, (maybe Value list ?)

     */

    /**
     *  Example in schema
     dependencies: [
     {
         dependentFieldPath: 'hdfsUserId',
         condition: {
             controlFieldPath: 'some.far.item',
             operation: '!=',                    // '==', '!=', '>', '<'
             valuesGrouping: 'and'             // 'or'
             values: [
                 'true',
                 '12',
                 '111',
                 '1'
             ]
         },
         conditionTrue: {
              actionStatus: 'hide'
         },
         conditionFalse: {
              actionStatus: ''
         }
     },

     */
    /**
     dependencies: [
     {
         dependentFieldPath: 'testDepended',
         condition: {
             controlFieldPath: 'testCondition',
             operation: '==',
             valuesGrouping: 'or',
             values: [
                 'test',
                 '1',
                 '2',
                 '3',
                 '44'
             ]
         },
         conditionTrue: {
             actionStatus: 'hide'
         },
         conditionFalse: {
             actionStatus: ''
         }
     },
     {...}
     ],*/

    /**
     * Search for "dependencies" in jsonSchemaInstance,
     * and ads <"onChangeCallback"> callback property to the <watched> field instance.
     * This callback changes "shema.instance.dependecy" property of the dependent field to value of conditionTrue or conditionFalse
     *
     * @param jsonSchemaInstance
     * @returns {*}
     */
    function instantiateDependencies(jsonSchemaInstance) {

        var jsonSchema = jsonSchemaInstance.instance.schema;
        var dependenciesProcessed = {};
        if (jsonSchema.dependencies && jsonSchema.properties) {
            jsonSchema.dependencies.forEach(function (dependency) {
                var watchedField = dependency.condition.controlFieldPath;
                if (!dependenciesProcessed[watchedField]) {
                    dependenciesProcessed[watchedField] = [];
                }

                dependenciesProcessed[watchedField].push(
                    (function () {
                        var conditionValidatorInstance = buildConditionValidator(dependency.condition);
                        var lastTestResult = conditionValidatorInstance(jsonSchemaInstance.getValue(dependency.condition.controlFieldPath));
                        var testResult = lastTestResult;
                        var receiver = jsonSchemaInstance.getChild(dependency.dependentFieldPath);
                        var applyTestResultToReceiver = function (testResult) {
                            if (receiver) {
                                if (!receiver.dependency) {
                                    receiver.dependency = {};
                                }
                                switch (testResult) {
                                    case true:
                                        angular.extend(receiver.dependency,dependency.conditionTrue);
                                        break;
                                    case false:
                                        angular.extend(receiver.dependency,dependency.conditionFalse);
                                        break;
                                    default:
                                        break;
                                }
                            }
                        };
                        applyTestResultToReceiver(testResult);

                        return function () {
                            var testResult = conditionValidatorInstance(jsonSchemaInstance.getValue(dependency.condition.controlFieldPath));
                            if (testResult !== lastTestResult) {
                                applyTestResultToReceiver(testResult);
                                lastTestResult = testResult;
                            }
                        };
                    }())
                );

            });
            Object.keys(dependenciesProcessed).forEach(function (watchedItemPath) {
                var watchedItem = jsonSchemaInstance.getChild(watchedItemPath);
                if (watchedItem) {
                    watchedItem.onChangeCallback = function () {
                        dependenciesProcessed[watchedItemPath].forEach(function (callback) {
                            callback();
                        })
                    }

                }
            });

        }
        return jsonSchemaInstance;
    }

    /**
     *  condition: {
                            field: 'localUserAsService',
                            operation: '==',
                            valuesGrouping: 'or', // 'and' // [none]

                            values:[
                                '123',
                                '222'
                                'no'
                                ]

                        },
     * @param condition
     * @return Function (<external Value>) {boolean}
     */
    function buildConditionValidator(condition) {
        if (condition.values && condition.values.length) {
            if (condition.values.length > 1) {
                return function () {
                    var arrayFuncComposer = 'every';
                    if ((!condition.valuesGrouping) || (condition.valuesGrouping == 'and')) {
                        arrayFuncComposer = 'every';
                    } else if (condition.valuesGrouping == 'or') {
                        arrayFuncComposer = 'some';
                    } else {
                        throw new Error("Dependency schema error: valueGrouping = '" + condition.valuesGrouping + "' it is not one of '' |  'or' |  'and'.");
                    }
                    return condition.values[arrayFuncComposer](function (expectedExternalValue) {
                        return function (externalValue) {
                            return convertCompareFunction(condition.operation)(externalValue, expectedExternalValue);
                        };
                    });
                }
            } else {
                return function (externalValue) {
                    return convertCompareFunction(condition.operation)(externalValue, condition.values[0]);
                }

            }
        }
    }

    /**
     * converts string to function
     * @param {string} operation
     * @returns {Function}
     */
    function convertCompareFunction(operation) {
        switch (operation) {
            case '==':
                return function (externalValue, expectedExternalValue) {
                    return externalValue === expectedExternalValue;
                };
                break;
            case '!=':
                return function (externalValue, expectedExternalValue) {
                    return externalValue !== expectedExternalValue;
                };
                break;
            case '>':
                return function (externalValue, expectedExternalValue) {
                    return externalValue > expectedExternalValue;
                };
                break;
            case '<':
                return function (externalValue, expectedExternalValue) {
                    return externalValue < expectedExternalValue;
                };
                break;
            default:
                return function () {
                    return false;
                };
                break;
        }
    }

    exports['instantiateDependencies'] = instantiateDependencies;
});
