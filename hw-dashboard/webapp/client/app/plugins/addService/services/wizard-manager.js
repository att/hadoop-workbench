define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').provider("addService.wizardManager", WizardManagerProvider);

    WizardManagerProvider.$inject = [];
    function WizardManagerProvider() {
        var wizardList = {};

        this.wizard = function (name, factory) {
            if (ng.isUndefined(factory)) {
                return wizardList[name];
            }
            var wizard = {
                name: name,
                factory: factory
            };

            if (!wizardList[name]) {
                wizardList.push(wizard);
            }
        };

        this.createInstance = function (name, sharedData) {
            var wizard = wizardList[name];
            if (wizard) {
                return wizard.factory(sharedData);
            }
        };

        this.$get = function () {
            return new WizardManager();
        };

        function WizardManager() {
            this.wizard = function (name) {
                var result = wizardList[name];
                if (result) {
                    return result.factory;
                }
                else {
                    return null;
                }
            };

            this.createInstance = function (name, sharedData) {
                var factory = this.wizard(name);
                if (factory) {
                    return factory(sharedData);
                }
            };
        }
    }
});
