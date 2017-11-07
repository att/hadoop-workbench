define(function (require) {
    "use strict";
    var ng = require('angular');

    require('../ngModule').factory('dap.core.shared.validation.MaxNodeOccurs', function () {
        return function (nodeType, maxOccurs, errorMessage) {

            if (!nodeTypeParamIsValid()) {
                throw new Error('nodeType should be specified and should not be empty string');
            }

            if (!maxOccursParamIsValid()) {
                throw new Error('maxOccurs should be specified and be number greater than or equal to zero');
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

                var isValid = nodeInstances <= maxOccurs;
                var message = "";
                if (!isValid) {
                    var genericMessage = ((maxOccurs === 0) ? 'No' : 'No more than ' + maxOccurs) + ' node(s) of type ' + nodeType + ' are allowed';
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

            function maxOccursParamIsValid() {
                return !(ng.isUndefined(maxOccurs) || maxOccurs === null || maxOccurs < 0 || typeof maxOccurs !== "number");
            }
        };
    });
});
