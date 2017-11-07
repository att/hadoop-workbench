/*jshint maxparams:15*/
define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').controller('flume.pages.FlumeInstancePageController', IndexController);

    IndexController.$inject = [
        '$scope',
        '$widgetParams',
        'dashboard.models.TabPage'
    ];
    function IndexController($scope, $widgetParams, TabPage) {
        var _this = this;

        ng.extend($scope, {
            page: $widgetParams.page
        });

        init();

        function init() {
            var pipelinePage = TabPage.factory({
                name: 'flume.pages.instance',
                params: {
                    source: $widgetParams.params.source,
                    file: $widgetParams.params.file,
                    instance: $widgetParams.params.instance
                }
            });

            var index = $widgetParams.page.leftTabManager.addTab(pipelinePage, '', 'Visual view', 'b-oozie-plugin__flowchart-widget__schema-icon');
            $widgetParams.page.leftTabManager.setActive(index);
        }
    }
});
