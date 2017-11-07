/**
 * @namespace Dashboard.Alerts.Models
 */
define(function (require) {
    "use strict";

    /**
     * @type {angular}
     */
    var ng = require('angular');

    require('../ngModule').value('main.alerts.models.AlertButton', AlertButton);

    /**
     * @typedef {{
     *  css: string?,
     *  text: string,
     *  action: function?
     * }} Dashboard.Alerts.Models.alertButtonParams
     */

    /**
     * Base alert model
     * @param {Dashboard.Alerts.Models.alertButtonParams} json
     * @constructor
     * @memberOf Dashboard.Alerts.Models
     */
    function AlertButton(json) {
        this.text = json.text;
        this.action = json.action;
        this.css = json.css;
    }

    AlertButton.factory = factory;

    /**
     * Returns new instance of Dashboard.Alerts.Models.AlertButton
     * @param {Dashboard.Alerts.Models.alertButtonParams} json
     */
    function factory(json) {
        json = ng.extend({
            css: '',
            text: '',
            style: '',
            action: null
        }, json);
        if(json.style && !json.css){
            switch(json.style){
                case 'action':
                    json.css = 'btn-default';
                    break;
                case 'cancel':
                    json.css = 'btn-secondary';
                    break;
            }
        }
        return new AlertButton(json);
    }
});
