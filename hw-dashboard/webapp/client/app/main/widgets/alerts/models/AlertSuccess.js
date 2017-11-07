/**
 * @namespace Dashboard.Alerts.Models
 */
define(function (require) {
    "use strict";

    /**
     * @type {angular}
     */
    var ng = require('angular');

    require('../ngModule').factory('main.alerts.models.AlertSuccess', alertSuccessFactory);

    alertSuccessFactory.$inject = ['main.alerts.models.AlertBase'];
    /**
     * @param {Dashboard.Alerts.Models.AlertBase}AlertBase
     * @returns {AlertSuccess}
     */
    function alertSuccessFactory(AlertBase) {
        /**
         * Base alert model
         * @param {Dashboard.Alerts.Models.alertBaseParams} json
         * @constructor
         * @memberOf Dashboard.Alerts.Models
         * @extends Dashboard.Alerts.Models.AlertBase
         */
        function AlertSuccess(json) {
            AlertBase.call(this, json);

            this.type = 'success';
        }
        AlertSuccess.prototype = Object.create(AlertBase.prototype);

        /**
         * @function AlertSuccess.factory
         * @memberOf AlertSuccess
         * @static
         */
        AlertSuccess.factory = factory;

        /**
         * @param {Dashboard.Alerts.Models.alertBaseParams}json
         */
        function factory(json) {
            json = ng.extend({
                title: '',
                text: '',
                css: 'success',
                action: null,
                buttons: [],
                delay: 2000,
                count: 1,
            }, json);
            return new AlertSuccess(json);
        }

        return AlertSuccess;
    }
});
