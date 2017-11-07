define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').factory("oozie.models.Node", nodeFactory);

    nodeFactory.$inject = ['dap.main.models.Node'];
    function nodeFactory(BaseNode) {
        function OozieNode(data, isAbsoluteCoordinates, offset, templateId) {
            BaseNode.call(this, data, isAbsoluteCoordinates, offset, templateId);
        }

        OozieNode.prototype.toJSON = function () {
            var nodeProperties = this.properties.Advanced.toJSON();
            var nodePropertiesAsString = ng.toJson(nodeProperties);

            return {
                id: this.id,
                type: this.type,
                subtype: this.subtype,
                properties: nodePropertiesAsString,
                version: this.version,
                position: {
                    x: this.position.left,
                    y: this.position.top
                },
                propertyFiles: this.propertyFiles.map(function(propertyFile){
                    /**
                     * Backend expects {link: "...", title: "..."}
                     * but NOT {path: "...", title: "..."}
                     * val links = for (node <- graph.nodes; links <- node.propertyFiles) yield FileLink(links.title, links.link, Some(node.id))
                     */
                    return {
                        title: propertyFile.title,
                        link: propertyFile.path
                    };
                })
            };
        };


        return OozieNode;
    }


});
