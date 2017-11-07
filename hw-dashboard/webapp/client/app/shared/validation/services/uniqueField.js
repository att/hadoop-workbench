define(function (require) {
    "use strict";
    var ng = require('angular');

    require('../ngModule').factory('dap.core.shared.validation.UniqueField', function () {
        return function (fieldName, errorMessage) {
            if (!fieldNameParamIsValid()) {
                throw new Error('fieldName should be specified and should not be empty string');
            }

            this.validate = function (nodes) {
                if (!ng.isArray(nodes)) {
                    throw new Error('Invalid parameter passed - Array is expected');
                }

                var invalidNodeIds = [];

                nodes.forEach(function (node1) {
                    nodes.forEach(function (node2) {
                        var sameNode = node1 === node2;
                        if (!sameNode) {
                            if (node1[fieldName] === node2[fieldName]) {
                                pushNewKeysOnly([node1.id, node2.id], invalidNodeIds);
                            }
                        }
                    });
                });

                var isValid = invalidNodeIds.length === 0;
                var message = "";
                if (!isValid) {
                    var genericMessage = "The field " + fieldName + " should be unique amongst all nodes";
                    message = errorMessage ? errorMessage : genericMessage;
                }

                return {
                    valid: isValid,
                    message: message,
                    invalidNodeIds: invalidNodeIds
                };
            };

            function fieldNameParamIsValid() {
                return !(ng.isUndefined(fieldName) || fieldName === null || fieldName === "" || typeof fieldName !== "string");
            }

            function pushNewKeysOnly(keys, addedKeys) {
                keys.forEach(function (key) {
                    if (addedKeys.indexOf(key) === -1) {
                        addedKeys.push(key);
                    }
                });
            }
        };
    });
});
