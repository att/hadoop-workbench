define(function (require) {
    "use strict";

    var ng = require("angular");
    require("../ngModule").service("subtypeFilter", function () {
        return filter;
    });

    var previousResult;

    function filter(data, searchSpec) {
        var filtered = [];
        data.forEach(function (type) {
            var t = ng.copy(type);

            t.children = type.children.filter(function (subtype) {
                return !searchSpec || subtype.name.indexOf(searchSpec) !== -1;
            });

            if (t.children.length > 0) {
                filtered.push(t);
            }
        });

        return ng.equals(previousResult, filtered) ? previousResult : previousResult = filtered;
    }

});
