define(function (require) {
    "use strict";

    require('../ngModule').factory('hdfs.FileNavigator.EVENTS', getHdfsFileNavigatorEvents);

    getHdfsFileNavigatorEvents.$inject = ["hdfs.FileNavigator"];

    function getHdfsFileNavigatorEvents(FileNavigator) {
        return FileNavigator.EVENTS;
    }
});
