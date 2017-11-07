define(function (require) {
    "use strict";

    var ng = require("angular");
    require("../ngModule").controller("oozie.widgets.alertsContainer.indexController", IndexController);
    IndexController.$inject = ["$scope"];

    function IndexController($scope) {
    }
});
