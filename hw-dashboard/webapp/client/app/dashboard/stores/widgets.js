define(function (require) {
    "use strict";

    require('../ngModule').service('dashboard.WidgetsStore', getStore);

    getStore.$inject = [
        'flux',
        'dashboard.actions'
    ];
    function getStore(flux, actions) {

        return flux.createStore(function (exports) {
            var self = this;

            this.widgets = [];

            this.updateWidgets = function (widgets) {
                self.widgets = widgets;
                self.emitChange();
            };

            exports.getWidgets = function () {
                return self.widgets;
            };
            this.on(actions.FETCH_WIDGETS, this.updateWidgets);
        });
    }
});
