/*jshint maxparams:5*/
/**
 * @namespace Dashboard.Alerts
 */
define(function (require) {
    "use strict";
    var angular = require('angular');

    require('../ngModule').service("main.alerts.alertsManagerService", AlertsManagerService);

    AlertsManagerService.$inject = [
        '$q',
        'main.alerts.models.AlertSuccess',
        'main.alerts.models.AlertWarning',
        'main.alerts.models.AlertError',
        'main.alerts.models.AlertInfo'
    ];

    /**
     * @memberOf Dashboard.Alerts
     * @constructor
     * @param $q
     * @param {Dashboard.Alerts.Models.AlertSuccess}AlertSuccess
     * @param {Dashboard.Alerts.Models.AlertWarning}AlertWarning
     * @param {Dashboard.Alerts.Models.AlertError}AlertError
     * @param {Dashboard.Alerts.Models.AlertInfo}AlertInfo
     */
    function AlertsManagerService($q, AlertSuccess, AlertWarning, AlertError, AlertInfo) {
        var alerts = [];
        this.alerts = alerts;
        var types = {
            SUCCESS: 'success',
            WARNING: 'warning',
            ERROR: 'error',
            INFO: 'info',
            CONFIRM: 'confirm'
        };

        this.createAlertSuccess = function (title, defaultMessage) {
            return function (message) {
                return AlertSuccess.factory({title: title, text: message || defaultMessage});
            }
        };

        this.createAlertError = function (title, defaultMessage) {
            return function (message) {
                return AlertError.factory({title: title, text: message || defaultMessage});
            }
        };

        /**
         * Adds array of alerts
         * @memberOf AlertsManagerService
         * @public
         * @type {function}
         * @param {Array.<Dashboard.Alerts.Models.AlertSuccess|Dashboard.Alerts.Models.AlertWarning|Dashboard.Alerts.Models.AlertError|Dashboard.Alerts.Models.AlertInfo|object>}alerts
         */
        this.addAlerts = function addAlerts(alerts) {
            if (!angular.isArray(alerts)) {
                return;
            }

            alerts.forEach(function (alert) {
                this.addAlert(alert);
            }.bind(this));
        };

        /**
         * @typedef {{
         *  type:string
         * }} Dashboard.Alerts.addAlertParams
         * @inheritDoc {Dashboard.Alerts.Models.alertBaseParams}
         */

        /**
         * Add one alert. Specify type by a field 'type'
         * @public
         * @param {Dashboard.Alerts.addAlertParams} alert
         */
        this.addAlert = function addAlert(alert) {
            switch (alert.type) {
                case types.SUCCESS:
                    return this.addAlertSuccess(alert);
                case types.WARNING:
                    return this.addAlertWarning(alert);
                case types.ERROR:
                    return this.addAlertError(alert);
                case types.INFO:
                    return this.addAlertInfo(alert);
                case types.CONFIRM:
                    return this.addAlertInfo(alert);
                default:
                    return this.addAlertInfo(alert);
            }
        };

        /**
         * Adds success alert
         * @param {Dashboard.Alerts.Models.AlertSuccess|Dashboard.Alerts.Models.alertBaseParams} alert
         * @memberOf AlertsManagerService
         * @public
         * @returns {Dashboard.Alerts.Models.AlertSuccess}
         */
        this.addAlertSuccess = function addAlertSuccess(alert) {
            var instance;
            if (alert instanceof AlertSuccess) {
                instance = alert;
                return alert;
            } else {
                instance = AlertSuccess.factory(alert);
            }
            alerts.push(instance);
            return instance;
        };

        /**
         * Adds warning alert
         * @param {Dashboard.Alerts.Models.AlertWarning|Dashboard.Alerts.Models.alertBaseParams} alert
         * @memberOf AlertsManagerService
         * @public
         * @returns {Dashboard.Alerts.Models.AlertWarning}
         */
        this.addAlertWarning = function addAlertWarning(alert) {
            var instance;
            if (alert instanceof AlertWarning) {
                instance = alert;
            } else {
                instance = AlertWarning.factory(alert);
            }
            var existingInstance = findSameAlert(instance);
            if (existingInstance) {
                increaseExistingInstanceCount(existingInstance);
                return existingInstance
            } else {
                alerts.push(instance);
            }
            return instance;
        };

        /**
         * Adds error alert
         * @param {Dashboard.Alerts.Models.AlertError|Dashboard.Alerts.Models.alertBaseParams} alert
         * @memberOf AlertsManagerService
         * @public
         * @returns {Dashboard.Alerts.Models.AlertError}
         */
        this.addAlertError = function addAlertError(alert) {
            var instance;
            if (alert instanceof AlertError) {
                instance = alert;
            } else {
                instance = AlertError.factory(alert);
            }
            var existingInstance = findSameAlert(instance);
            if (existingInstance) {
                increaseExistingInstanceCount(existingInstance);
                return existingInstance
            } else {
                alerts.push(instance);
                return instance
            }
        };

        /**
         * Adds info alert
         * @param {Dashboard.Alerts.Models.AlertInfo|Dashboard.Alerts.Models.alertBaseParams} alert
         * @memberOf AlertsManagerService
         * @public
         * @returns {Dashboard.Alerts.Models.AlertInfo}
         */
        this.addAlertInfo = function addAlertInfo(alert) {
            var instance;
            if (alert instanceof AlertInfo) {
                instance = alert;
            } else {
                instance = AlertInfo.factory(alert);
            }
            alerts.push(instance);
            return instance;
        };

        /**
         * Clears all alerts
         */
        this.clearAlerts = function clearAlerts() {
            alerts.splice(0, alerts.length);
        };

        /**
         * Close certain alert
         * @param {*}alert
         */
        this.closeAlert = function closeAlert(alert) {
            var indexOfAlert = alerts.indexOf(alert);
            if (indexOfAlert > -1) {
                alerts.splice(indexOfAlert, 1);
            }
        };

        function findSameAlert(alert) {
            var existingIndex = null;
            var isSameAlertPresent = alerts.some(function(alertItem, i) {
                if (compareAlertInstancesWithoutActionsOrButtons(alert, alertItem)) {
                    existingIndex = i;
                    return true;
                }
            });
            if (isSameAlertPresent) {
                return alerts[existingIndex];
            } else {
                return null;
            }
        }

        function compareAlertInstancesWithoutActionsOrButtons(alert1, alert2) {
            return (
                alert1.action == null &&
                alert2.action == null &&
                alert1.buttons && alert1.buttons.length === 0 &&
                alert2.buttons && alert2.buttons.length === 0 &&
                alert1.title == alert2.title &&
                alert1.text == alert2.text &&
                alert1.css == alert2.css &&
                alert1.delay == alert2.delay
            )
        }

        function increaseExistingInstanceCount(alertInstance) {
            alertInstance.count++;
        }
    }
});
