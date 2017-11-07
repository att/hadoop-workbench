define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').value("dashboard.models.PageControl", PageControl);

    function PageControl(options) {
        this.name = options.name;
        this.icon = options.icon;
        this.label = options.label;
        this.tooltip = options.tooltip ? options.tooltip: options.label;
        this.enable = options.enable;
        this.active = options.active;
        this.hidden = options.hidden;
        this.css = options.css;
        this.styleAsTab = options.styleAsTab;
        this.action = options.action;
        this.popup = options.popup;
    }

    PageControl.factory = function (options) {
        options = ng.extend({
            name: '',
            icon: '',
            label: '',
            tooltip: '',
            enable: true,
            active: false,
            hidden: false,
            css: '',
            styleAsTab: true,
            action: function () {
            },
            popup: false
        }, options);

        return new PageControl(options);
    };
});
