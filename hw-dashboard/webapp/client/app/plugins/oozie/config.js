define(function (require) {
    "use strict";

    require('./ngModule').config(oozieConfig);

    oozieConfig.$inject = [
        'dashboard.WidgetManagerProvider'
    ];
    function oozieConfig(dashboardWidgetManagerProvider) {
        dashboardWidgetManagerProvider.widget('oozie', {
            widget: 'oozie',
            type: 'service',
            icon: '',
            makeParams: function (params) {
                var result = {
                    source: params.source,
                    instance: null
                };

                return result;
            }
        });
    }

});
