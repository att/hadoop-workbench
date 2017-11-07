define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('addService.models.WizardStep', factory);

    function factory() {
        function WizardStep(options) {
            ng.extend(this, {
                data: {}
            }, options);
        }

        WizardStep.factory = function (options) {
            options = ng.extend({
                data: {},
                widgetName: '',
                nextStep: function () {
                    throw new Error('Not implemented');
                },
                isCompleted: function () {
                    return false;
                },
                readyToSave: function () {
                    return false;
                },
                save: function () {
                },
                showValidationErrors: false,
                isLastStep: false,
                status: function () {
                    return '';
                },
                createInstance: function () {
                    throw new Error('Not implemented');
                }
            }, options);

            return new WizardStep(options);
        };

        return WizardStep;
    }
});
