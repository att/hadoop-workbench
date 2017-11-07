define(function (require) {
    "use strict";
    require('../ngModule').provider('core.widgetUiControl', widgetUiControlProvider);

    widgetUiControlProvider.$inject = [];
    function widgetUiControlProvider() {

        this.$get = [ '$rootScope', function ($rootScope) {
            return new WidgetUiControl($rootScope);
        }];

        function WidgetUiControl($rootScope) {

            var eventBus = $rootScope.$new(true);

            this.on = function (eventName, callback) {
                eventBus.$on(eventName, callback);
            };

            this.dispatch = function (eventName, params) {
                eventBus.$emit(eventName, params);
            };
        }

     }
});
