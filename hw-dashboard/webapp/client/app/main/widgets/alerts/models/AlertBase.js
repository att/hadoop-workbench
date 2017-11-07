/**
 * @namespace Dashboard.Alerts.Models
 */
define(function (require) {
    "use strict";

    /**
     * @type {angular}
     */
    var ng = require('angular');

    require('../ngModule').factory('main.alerts.models.AlertBase', alertBaseFactory);

    alertBaseFactory.$inject = ['main.alerts.models.AlertButton'];
    function alertBaseFactory(AlertButton) {

        /**
         * @memberOf Dashboard.Alerts.Models.AlertBase
         * @static
         * @type {function}
         */
        AlertBase.factory = factory;

        return AlertBase;

        /**
         * @typedef {{
         *  title: string,
         *  text:string,
         *  css: string|Object.<string, *>?,
         *  action: function?,
         *  buttons: Array.<string, Dashboard.Alerts.Models.AlertButton | object>?,
         *  count:integer?
         * }} Dashboard.Alerts.Models.alertBaseParams
         *
         */

        /**
         * Base alert model
         * @param {Dashboard.Alerts.Models.alertBaseParams} json
         * @constructor
         * @memberOf Dashboard.Alerts.Models
         */
        function AlertBase(json) {
            this.title = json.title;
            this.text = json.text;
            this.css = json.css;
            this.action = json.action;
            this.buttons = json.buttons.map(getButton);
            this.delay = json.delay;
            this.count = json.count;

            /**
             *
             * @param {Dashboard.Alerts.Models.AlertButton|object}button
             * @returns {Dashboard.Alerts.Models.AlertButton}
             */
            function getButton(button) {
                if (button instanceof AlertButton) {
                    return button;
                } else {
                    return AlertButton.factory(button);
                }
            }
        }


        /**
         * @param {Dashboard.Alerts.Models.alertBaseParams}json
         */
        function factory(json) {
            json = ng.extend({
                title: '',
                text: '',
                css: '',
                action: null,
                buttons: [],
                delay: 2000,
                count: 1,
            }, json);
            return new AlertBase(json);
        }

    }
});
