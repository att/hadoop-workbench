define(function (require) {
    "use strict";
    var ng = require('angular');

    require('../ngModule').service("oozie.widgets.alertsContainer.alertsManager", AlertsManager);

    AlertsManager.$inject = ['$q'];
    function AlertsManager($q) {

        var alerts = [];

        this.addAlerts = function (alertsArray) {
            if (!ng.isArray(alertsArray)) {
                return;
            }

            // remove existing alerts
            alerts.length = 0;

            alertsArray.forEach(function (alert) {
                addAlert(normalizeAlertProperties(alert));
            });
        }.bind(this);
        this.getAlerts = function () {
            return alerts;
        };
        this.closeAlert = function (index) {
            alerts.splice(index, 1);
        }.bind(this);
        this.clearAlerts = function () {
            alerts.splice(0, alerts.length);
        }.bind(this);

        function addAlert(alert) {
            var defaultType = 'warning';
            if (ng.isUndefined(alert.type)) {
                alert.type = defaultType;
            }
            alerts.push(alert);
        }

        function normalizeAlertProperties(alert) {
            // back-ends sends severity property instead of type
            if (!ng.isUndefined(alert.severity)) {
                alert.type = alert.severity;
                delete alert.severity;
            }

            return alert;
        }
    }
});
