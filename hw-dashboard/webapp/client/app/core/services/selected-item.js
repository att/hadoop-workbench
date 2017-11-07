/*jshint maxcomplexity: 10*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').factory('selected-item', getFactory);

    getFactory.$inject = ['$rootScope'];
    function getFactory($rootScope) {

        function SelectedNode(options) {
            var _eventBus = $rootScope.$new();
            var _data = options.data;

            this.set = function (data) {
                if (_data !== data) {
                    _data = data;
                    _eventBus.$broadcast('update', _data);
                }
            };

            this.get = function () {
                return _data;
            };

            this.bind = function ($scope, path) {
                var cancel = _eventBus.$on('update', function (event, data) {
                    $scope.$eval(path + '=$$$$someLongNamedData', {$$$$someLongNamedData: data});
                });
                $scope.$on('$destroy', cancel);
            };

            this.on = _eventBus.$on.bind(_eventBus);
        }

        SelectedNode.factory = function (options) {
            options = ng.extend({
                data: null
            }, options);

            return new SelectedNode(options);
        };

        return SelectedNode;
    }
});
