define(function (require) {
    "use strict";

    var ng = require('angular');
    require('./ngModule').config(config);

    config.$inject = [
        'dap-widget.$widgetProvider',
        'dap.core.config'
    ];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('oozie-widget', {
            templateUrl: dapConfig.pathToPlugins + '/oozie/dashboard-widgets/oozie-widget/views/index.html',
            controller: 'oozie-widget.IndexController',
            resolve: {
                restGetRawFileFunction: [
                    '$widgetParams',
                    'oozie.restService',
                    function ($widgetParams, restService) {
                        return function (file) {
                            restService.doNotShowError = true;
                            return restService.getFile('v1.0', $widgetParams.source, file.path, true).then(function (fileData) {
                                return ng.extend({}, file, fileData);
                            }, function (error) {
                                // Lets check if file.path was a directory:
                                var defaultFileFullPath = getDefaultFileFullPath(file);
                                if (defaultFileFullPath !== file.path) {
                                    return restService.getFile('v1.0', $widgetParams.source, defaultFileFullPath).then(function (fileData) {
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
                ],
                platformMeta: [
                    '$widgetParams',
                    'platform.restService',
                    function ($widgetParams, restService) {
                        return restService.platformMeta($widgetParams.source.platform.id);
                    }
                ]

            }
        });
    }
});
