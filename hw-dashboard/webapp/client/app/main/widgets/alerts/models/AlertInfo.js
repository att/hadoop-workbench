/**
 * @namespace Dashboard.Alerts.Models
 */
define(function (require) {
    "use strict";

    /**
     * @type {angular}
     */
    var ng = require('angular');

    require('../ngModule').factory('main.alerts.models.AlertInfo', AlertInfoFactory);

    AlertInfoFactory.$inject = ['main.alerts.models.AlertBase'];
    function AlertInfoFactory(AlertBase) {

        /**
         * @memberOf Dashboard.Alerts.Models.AlertInfo
         * @static
         * @type {function}
         */
        AlertInfo.factory = factory;


        /**
         * Base alert model
         * @param {Dashboard.Alerts.Models.alertBaseParams} json
         * @constructor
         * @memberOf Dashboard.Alerts.Models
         * @extends Dashboard.Alerts.Models.AlertBase
         */
        function AlertInfo(json) {
            AlertBase.call(this, json);

            this.type = 'info';
        }
        AlertInfo.prototype = Object.create(AlertBase.prototype);

        /**
         * @param {Dashboard.Alerts.Models.alertBaseParams}json
         */
        function factory(json) {
            json = ng.extend({
                title: '',
                text: '',
                css: 'confirm',
                action: null,
                buttons: [],
                delay: 2000,
                count: 1,
            }, json);
            return new AlertInfo(json);
        }

        return AlertInfo;
    }
});
