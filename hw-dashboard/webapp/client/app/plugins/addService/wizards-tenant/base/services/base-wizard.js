define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').service('addService.wizards-tenant.services.base', BaseService);

    BaseService.$inject = [
        'addService.models.Wizard'
    ];
    function BaseService(Wizard) {
        this.create = function (sharedData) {
            return create(sharedData);
        };

        function create(data) {
            return Wizard.factory({data: data})
                .step({
                    widgetName: 'addService.tenantWizards.base.container',
                    isCompleted: function () {
                        return !!this.data['container'];
                    },
                    readyToCreate: function () {
                        return false;
                    },
                    status: function () {
                        if (this.data['container']) {
                            return this.data['container'].name;
                        }
                        return 'Select container...';
                    }
                })
                .step({
                    widgetName: 'addService.tenantWizards.base.componentType',
                    isCompleted: function () {
                        return !!this.data['componentType'];
                    },
                    readyToCreate: function () {
                        return false;
                    },
                    status: function () {
                        if (this.data['componentType']) {
                            return this.data['componentType'].id;
                        }
                        return 'Select component type...';
                    }
                })
                .fork(function (sharedData, forkSteps) {
                    var componentType = sharedData['componentType'].id;
                    var step = forkSteps[componentType];
                    if (!step) {
                        throw new Error('Can not find forkStep for componentType: ', componentType);
                    }
                    return step;
                }).finalize();
        }
    }
});
