//Value cannot be NULL, FALSE, '', or an empty array
define(function (require) {
    "use strict";

    var ng = require("angular");

    require('../ngModule').factory('dap.core.shared.validation.PatternMatcher', function () {
        return function (nodeType, fieldName, regexp, errorMessage) {

            if (!nodeTypeParamIsValid()) {
                throw new Error('nodeType should be specified and should not be empty string');
            }

            this.validate = function (nodes) {
                /**
                 * When nodeType == 'provision', we validate wizardStep :

                 "clusterName": {
                    "title": "Cluster Name",
                    "type": "string",
                    "default": "HDP-1"
                  },
                 "nodeCount": {
                    "title": "Slave Nodes Count",
                    "type": "integer",
                    "default": 4,
                    "restrictions": [
                      "positiveNum-1000"
                    ]
                  },
                 "hdfsSize": {
                    "title": "HDFS Size (GB)",
                    "type": "integer",
                    "default": 30,
                    "restrictions": [
                      "positiveNum-1000"
                    ]
                  },
                 "location": {
                    "title": "AWS Region",
                    "type": "string",
                    "enum": [...],
                    "enumLabels": {...},
                    "default": "us-west-2"
                  }
                 *
                 * @type {Object}
                 */
                if (nodeType === "provision") {
                    return validateProvision(nodes);
                }
                if (!ng.isArray(nodes)) {
                    throw new Error('Invalid parameter passed - Array is expected');
                }

                var invalidNodes = [];

                nodes.forEach(function (node) {
                    if (node.type === nodeType) {
                        var fieldValue = node[fieldName];
                        if (ng.isUndefined(fieldValue) || fieldValue === null) {
                            invalidNodes.push(node);
                        } else {
                            var value = String(fieldValue).trim();
                            if (!regexp.test(value)) {
                                invalidNodes.push(node);
                            }
                        }
                    }
                });

                var isValid = invalidNodes.length === 0;
                var message = "";
                if (!isValid) {
                    var genericMessage = "The field '" + fieldName + "' for the node type '" + nodeType + "' doesn't match the pattern " + regexp;
                    message = errorMessage ? errorMessage : genericMessage;
                }

                return {
                    valid: isValid,
                    message: message,
                    invalidNodes: invalidNodes
                };
            };

            function nodeTypeParamIsValid() {
                return !(ng.isUndefined(nodeType) || nodeType === null || nodeType === "");
            }

            function validateProvision(wizardStep) {
                var invalidNodes = [];
                Object.keys(wizardStep).forEach((field) =>
                {
                    if (wizardStep[fieldName] && fieldName === field) {
                        var fieldValue = wizardStep[fieldName];
                        if (ng.isUndefined(fieldValue) || fieldValue === null) {
                            invalidNodes.push(field);
                        } else {
                            var value = wizardStep[fieldName].default;
                            if (!regexp.test(value)) {
                                invalidNodes.push(field);
                            }
                        }
                    }
                });

                var isValid = invalidNodes.length === 0;
                var message = "";
                if (!isValid) {
                    var genericMessage = "The field '" + wizardStep[fieldName].title + "' for the provision type '" + wizardStep[fieldName].type + "' doesn't match the pattern " + regexp;
                    message = errorMessage ? errorMessage : genericMessage;
                }
                return {
                    valid: isValid,
                    message: message,
                    invalidNodes: invalidNodes
                };
            }
        };
    });
});