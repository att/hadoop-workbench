define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('tenant.TenantUploaderWidgetController', UploadTenantWidgetController);

    var ERROR_TYPE_ALREADY_EXISTS = 'ALREADY_EXISTS';

    UploadTenantWidgetController.$inject = [
        '$scope',
        '$widgetParams',
        'core.utils.string-format',
        'core.get-file-uploader',
        'main.alerts.alertsManagerService'
    ];
    function UploadTenantWidgetController($scope, $widgetParams, stringFormat, FileUploader, alertsManager) {
        var urlOverwrite = stringFormat('/hw/module/tenant-web/api/{0}/tenants/{1}/templates?overwrite=true', $widgetParams.apiVersion, $widgetParams.tenantId);

        //TODO: Add filter to verify that file(s) has .zip extension
        ng.extend($scope, {
            uploadInProgress: [],
            uploader: FileUploader.create(ng.extend({}, $widgetParams, {
                url: stringFormat('/hw/module/tenant-web/api/{0}/tenants/{1}/templates', $widgetParams.apiVersion, $widgetParams.tenantId),
                queueLimit: 10,
                removeAfterUpload: false,
                onBeforeUploadItem: function (item) {
                    $scope.uploadInProgress.push(item);
                    item.uploadDisabled = true;
                    item.removeDisabled = true;
                },
                onErrorItem: onErrorItem,
                onSuccessItem: onSuccessItem
            }))
        });

        function onSuccessItem(item, response, status, headers) {
            $scope.uploadInProgress.splice($scope.uploadInProgress.indexOf(item), 1);
            item.remove();
            if ($widgetParams.onSuccessItem) {
                $widgetParams.onSuccessItem(item, response, status, headers);
            }
        }

        function onErrorItem(item, response, status, headers) {
            if (response.errorType == ERROR_TYPE_ALREADY_EXISTS) {
                var message = response.message || 'unknown error';
                alertsManager.addAlertError({
                    title: "Upload failed",
                    text: "Item has not been uploaded on server because of error: " + message + "<br> Overwrite?",
                    buttons: [
                        {
                            text: "Yes",
                            style: "action",
                            action: function (close) {
                                close();
                                item.url = urlOverwrite;
                                item.upload();
                            }
                        },
                        {
                            text: "No",
                            style: "cancel",
                            action: function (close) {
                                item.remove();
                                close();
                            }
                        }
                    ]
                });
            } else {
                if ($widgetParams.onErrorItem) {
                    item.uploadDisabled = false;
                    item.removeDisabled = false;

                    $scope.uploadInProgress.splice($scope.uploadInProgress.indexOf(item), 1);
                    $widgetParams.onErrorItem(item, response, status, headers)
                }
            }
        }

    }
});
