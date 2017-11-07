define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').filter('hdfsFoldersOnlyFilter', getFoldersOnlyFilter);

    function getFoldersOnlyFilter() {
        return function (items, foldersOnly) {
            if (!foldersOnly) {
                return items;
            }
            var filtered = [];
            items.forEach(function (item) {
                if (item.isFolder) {
                    filtered.push(item);
                }
            });
            return filtered;
        };
    }
});