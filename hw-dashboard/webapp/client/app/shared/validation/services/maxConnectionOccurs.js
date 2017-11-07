define(function (require) {
    "use strict";

    var ng = require("angular");

    require('../ngModule').factory('dap.shared.validation.MaxConnectionOccurs', getMaxConnectionOccursFn);

    getMaxConnectionOccursFn.$inject = ["shared.validation.ConnectionOccursRule"];

    function getMaxConnectionOccursFn(ConnectionOccursRule) {
        MaxConnectionOccurs.prototype = Object.create(ConnectionOccursRule.prototype);
        MaxConnectionOccurs.prototype.validate = function (values) {
            return this._validate(values, this._isValid);
        };
        MaxConnectionOccurs.prototype._isValid = function (connectionsCount, countValue) {
            return connectionsCount <= countValue;
        };

        MaxConnectionOccurs.prototype._makeGenericMessage = function (count, from, to, connector) {
            var str = (count === 0 ? 'No' : 'No more than ' + count) + ' connection(s) are allowed';
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

        function MaxConnectionOccurs(from, to, type, connector, count, errorMessage) {
            var useGenericMessage = ng.isUndefined(errorMessage) || errorMessage === null;
            if (useGenericMessage) {
                errorMessage = this._makeGenericMessage(count, from, to, connector);
            }
            ConnectionOccursRule.apply(this, [from, to, type, connector, count, errorMessage]);
            this.ruleType = "maxConnectionOccurs";
        }

        return MaxConnectionOccurs;
    }
});
