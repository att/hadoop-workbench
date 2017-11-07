define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("flume.models.Node", nodeFactory);

    nodeFactory.$inject = ['dap.main.models.Node'];
    function nodeFactory(BaseNode) {
        function FlumeNode(data, isAbsoluteCoordinates, offset, templateId) {
            BaseNode.call(this, data, isAbsoluteCoordinates, offset, templateId);
            /**
             * @type {Array<flume.models.NodeCounter>}
             */
            this.counters = [];
        }

        FlumeNode.prototype = BaseNode.prototype;

        return FlumeNode;
    }


});
