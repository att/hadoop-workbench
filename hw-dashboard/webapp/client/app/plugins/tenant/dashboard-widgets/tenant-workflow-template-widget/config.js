define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('tenant-workflow-template-widget', {
            templateUrl: dapConfig.pathToPlugins + '/tenant/dashboard-widgets/tenant-workflow-template-widget/views/index.html',
            controller: 'tenant-workflow-template-widget.IndexController',
            resolve: {
                componentDescriptor: ['$widgetParams', function ($widgetParams) {
                    return $widgetParams.componentDescriptor;
                }],
                fileManager: ["tenant.FileManager", "componentDescriptor", "oozie.restService", function (FileManager, componentDescriptor, restService) {
                    return new FileManager(componentDescriptor.info.id, restService);
                }],
                restGetRawFileFunction: [
                    'componentDescriptor',
                    'oozie.restService',
                    function  (componentDescriptor, restService) {
                        return function (file) {
                            restService.doNotShowError = true;
                            return restService.getTenantFile('v1.0', componentDescriptor.info.id, file.path, true).then(function (fileData) {
                                return ng.extend({}, file, fileData);
                            }, function (error) {
                                // Lets check if file.path was a directory:
                                var defaultFileFullPath = getDefaultFileFullPath(file);
                                if (defaultFileFullPath !== file.path) {
                                    return restService.getTenantFile('v1.0', componentDescriptor.info.id, defaultFileFullPath).then(function (fileData) {
                                        return ng.extend({}, file, {path: defaultFileFullPath}, fileData);
                                    });
                                } else {
                                    return error;
                                }
                            });
                        };

                        function getDefaultFileFullPath(file) {
                            return file.defaultFile? file.path + '/' + file.defaultFile: file.path;
                        }
                    }
                ]
            }
        });
    }
});
