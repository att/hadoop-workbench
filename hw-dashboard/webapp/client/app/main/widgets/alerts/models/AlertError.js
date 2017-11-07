/**
 * @namespace Dashboard.Alerts.Models
 */
define(function (require) {
    "use strict";

    /**
     * @type {angular}
     */
    var ng = require('angular');

    require('../ngModule').factory('main.alerts.models.AlertError', AlertErrorFactory);

    AlertErrorFactory.$inject = ['main.alerts.models.AlertBase'];
    function AlertErrorFactory(AlertBase) {

        /**
         * @memberOf Dashboard.Alerts.Models.AlertError
         * @static
         * @type {function}
         */
        AlertError.factory = factory;


        /**
         * Base alert model
         * @param {Dashboard.Alerts.Models.alertBaseParams} json
         * @constructor
         * @memberOf Dashboard.Alerts.Models
         * @extends Dashboard.Alerts.Models.AlertBase
         */
        function AlertError(json) {
            AlertBase.call(this, json);

            this.type = 'error';
        }
        AlertError.prototype = Object.create(AlertBase.prototype);

        /**
         * @param {Dashboard.Alerts.Models.alertBaseParams}json
         */
        function factory(json) {
            json = ng.extend({
                title: '',
                text: '',
                css: 'error',
                action: null,
                buttons: [],
                delay: 0,
                count: 1,
            }, json);
            return new AlertError(json);
        }

        return AlertError;
    }
});
