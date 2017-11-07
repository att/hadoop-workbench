define(function (require) {
    "use strict";

    require('./ngModule').config(config);

    config.$inject = ['dap-widget.$widgetProvider', 'dap.core.config'];
    function config($widgetProvider, dapConfig) {

        $widgetProvider.widget('kafka-topics-page', {
            templateUrl: dapConfig.pathToPlugins + '/platform/pages/kafka-topics-page/views/index.html',
            controller: 'platform.pages.KafkaTopicsPageContainerPageController'
        });
    }
});
