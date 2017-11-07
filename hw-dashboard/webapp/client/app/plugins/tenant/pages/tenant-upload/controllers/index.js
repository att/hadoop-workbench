define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('tenant.pages.TenantUploadPageController', Controller);

    Controller.$inject = [
        '$scope',
        '$widgetParams',
        'main.alerts.alertsManagerService',
        'tenant.models.TenantTemplateContainer',
        'tenant.redux-actions',
        '$ngRedux',
        'core.utils.string-format'

    ];
    function Controller($scope, $widgetParams, alertsManager, TenantTemplateContainer, tenantActions, $ngRedux, stringFormat) {
        let {dispatch} = $ngRedux;
        let tenant = $widgetParams.params;

        ng.extend($scope, {
            loading: false,
            requesting: false,
            isReadonly: false
        });

        ng.extend($scope, {
            //save: save
        });

        $scope.uploadOptions = {
            apiVersion: 'v1.0',
                onSuccessItem: function (item, response, status, headers) {
                if (status === 200) {
                    var newTemplates = TenantTemplateContainer.processApiResponse(response.data.templates);
                    dispatch(tenantActions.getTemplates($scope.uploadOptions.tenantId));

                    var successMessageTemplate = 'Template{0} "{1}" {2} been successfully uploaded';
                    var successMessageText = stringFormat(
                        successMessageTemplate,
                        newTemplates.length > 1 ? 's' : '',
                        newTemplates.map(function (t) {
                            return t.info.name;
                        }).join('", "'),
                        newTemplates.length > 1 ? 'have' : 'has'
                    );

                    alertsManager.addAlertSuccess({
                        title: 'Success',
                        text: successMessageText
                    });
                }
            },
            onErrorItem: function (item, response, status, headers) {
                var message = response.message || 'unknown error';
                alertsManager.addAlertError({
                    title: "Upload failed",
                    text: "Tenant has not been uploaded on server because of error: " + message
                });
            },
            tenantId: tenant ? tenant.id : null
        }

    }
});
