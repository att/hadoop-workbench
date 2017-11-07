define(function (require) {
    "use strict";

    require("../ngModule").controller("flume.widgets.nodeSelector.indexController", indexController);

    indexController.$inject = ["$scope"];
    function indexController($scope) {

        $scope.subtypeFilter = "";

        $scope.addNode = function (type, subtype) {
            var data = {
                info: {
                    type: type,
                    subtype: subtype
                }
            };
            var event = $scope.$emit("nodeadd.nodeselector", data);
            if (!event.defaultPrevented) {
                $scope.addNodeCb(type, subtype);
            }
        };
    }
});
