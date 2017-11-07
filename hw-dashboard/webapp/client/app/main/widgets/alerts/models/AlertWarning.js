/**
 * @namespace Dashboard.Alerts.Models
 */
define(function (require) {
    "use strict";

    /**
     * @type {angular}
     */
    var ng = require('angular');

    require('../ngModule').factory('main.alerts.models.AlertWarning', AlertWarningFactory);

    AlertWarningFactory.$inject = ['main.alerts.models.AlertBase'];
    function AlertWarningFactory(AlertBase) {

        /**
         * @memberOf Dashboard.Alerts.Models.AlertWarning
         * @static
         * @type {function}
         */
        AlertWarning.factory = factory;


        /**
         * Base alert model
         * @param {Dashboard.Alerts.Models.alertBaseParams} json
         * @constructor
         * @memberOf Dashboard.Alerts.Models
         * @extends Dashboard.Alerts.Models.AlertBase
         */
        function AlertWarning(json) {
            AlertBase.call(this, json);

            this.type = 'warning';
        }

        AlertWarning.prototype = Object.create(AlertBase.prototype);

        /**
         * @param {Dashboard.Alerts.Models.alertBaseParams}json
         */
        function factory(json) {
            json = ng.extend({
                title: '',
                text: '',
                css: 'warning',
                action: null,
                buttons: [],
                delay: 0,
                count: 1,
            }, json);
            return new AlertWarning(json);
        }

        return AlertWarning;
    }
});
