define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').value("dashboard.models.WidgetHeaderTab", WidgetHeaderTab);

    function WidgetHeaderTab(options) {
        this.icon = options.icon;
        this.label = options.label;
        this.tooltip = options.tooltip ? options.tooltip : options.label;
        this.enable = options.enable;
        this.active = options.active;
        this.dirty = options.dirty;
        this.css = options.css;
        this.styleAsTab = options.styleAsTab;
        this.page = options.page;
        this.closable = options.closable;
        this.indicator = options.indicator;
    }

    WidgetHeaderTab.factory = function (options) {
        options = ng.extend({
            icon: '',
            label: '',
            tooltip: '',
            enable: true,
            active: false,
            dirty: false,
            css: '',
            styleAsTab: true,
            page: null,
            closable: true,
            indicator: false
        }, options);
        return new WidgetHeaderTab(options);
    };
});
