define(function (require) {
    "use strict";

    var ng = require("angular");

    require('../ngModule').factory('dap.shared.validation.MinConnectionOccurs', getMinConnectionOccursFn);

    getMinConnectionOccursFn.$inject = ["shared.validation.ConnectionOccursRule"];

    function getMinConnectionOccursFn(ConnectionOccursRule) {
        MinConnectionOccurs.prototype = Object.create(ConnectionOccursRule.prototype);
        MinConnectionOccurs.prototype.validate = function (values) {
            return this._validate(values, this._isValid);
        };
        MinConnectionOccurs.prototype._isValid = function (connectionsCount, countValue) {
            return connectionsCount >= countValue;
        };

        MinConnectionOccurs.prototype._makeGenericMessage = function (count, from, to, connector) {
            var str = 'At least ' + count + ' connection(s) are expected';
            var strFrom = '';
            var strTo = '';

            if (this._fromParamIsDefined(from)) {
                strFrom = " from type '" + from + "'";
            }

            if (this._fromParamIsDefined(from) && this._connectorParamIsValid(connector)) {
                strFrom += " connector '" + connector + "'";
            }

            if (this._toParamIsDefined(to)) {
                strTo = " to type '" + to + "'";
            }

            return str + strFrom + strTo;
        };

        function MinConnectionOccurs(from, to, type, connector, count, errorMessage) {
            var useGenericMessage = ng.isUndefined(errorMessage) || errorMessage === null;
            if (useGenericMessage) {
                errorMessage = this._makeGenericMessage(count, from, to, connector);
            }
            ConnectionOccursRule.apply(this, [from, to, type, connector, count, errorMessage]);
            this.ruleType = "minConnectionOccurs";
        }

        return MinConnectionOccurs;
    }
});
