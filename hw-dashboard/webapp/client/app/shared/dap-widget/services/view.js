define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').provider('dap-widget.$view', $ViewProvider);

    $ViewProvider.$inject = [];
    function $ViewProvider() {
        this.$get = $get;

        $get.$inject = ['$templateFactory'];
        function $get($templateFactory) {
            return {
                load: function load(name, options) {
                    var result, defaults = {
                        template: null,
                        controller: null,
                        view: null,
                        locals: null,
                        notify: false,
                        async: true,
                        params: {}
                    };
                    options = ng.extend(defaults, options);

                    if (options.view) {
                        result = $templateFactory.fromConfig(options.view, options.params, options.locals);
                    }
                    return result;
                }
            };
        }
    }
});
