define(function (require) {
    "use strict";

    require("../ngModule").factory("dashboard.DeferredResultEvent", getDeferredResultEvent);

    function getDeferredResultEvent() {
        function DeferredResultEvent() {
            this._deferredResults = [];
        }

        DeferredResultEvent.factory = function () {
            return new DeferredResultEvent();
        };

        DeferredResultEvent.prototype = {
            setDeferredResults: function (deferredResults) {
                this._deferredResults = deferredResults;
            },
            addDeferredResult: function (deferredResult) {
                this._deferredResults.push(deferredResult);
            },
            getDeferredResults: function () {
                return this._deferredResults;
            }
        };


        return DeferredResultEvent;
    }

});
