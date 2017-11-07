define(function (require) {
    "use strict";

    var ng = require("angular");

    require('../ngModule').factory('dap.core.shared.validation.MinNodeOccurs', function () {
        return function (nodeType, minOccurs, errorMessage) {

            if (!nodeTypeParamIsValid()) {
                throw new Error('nodeType should be specified and should not be empty string');
            }

            if (!minOccursParamIsValid()) {
                throw new Error('minOccurs should be specified and be number greater than or equal to zero');
            }

            this.validate = function (nodes) {
                if (!ng.isArray(nodes)) {
                    throw new Error('Invalid parameter passed - Array is expected');
                }

                var nodeInstances = 0;

                nodes.forEach(function (node) {
                    var matches = (node.type === nodeType);
                    if (matches) {
                        nodeInstances += 1;
                    }
                });

                var isValid = nodeInstances >= minOccurs;
                var message = "";
                if (!isValid) {
                    var genericMessage = 'At least ' + minOccurs + ' node(s) of type ' + nodeType + ' is expected';
                    message = errorMessage ? errorMessage : genericMessage;
                }

                return {
                    valid: isValid,
                    message: message
                };
            }.bind(this);

            function nodeTypeParamIsValid() {
                return !(ng.isUndefined(nodeType) || nodeType === null || nodeType === "");
            }

            function minOccursParamIsValid() {
                return !(ng.isUndefined(minOccurs) || minOccurs === null || minOccurs < 0 || typeof minOccurs !== "number");
            }
        };
    });
});
