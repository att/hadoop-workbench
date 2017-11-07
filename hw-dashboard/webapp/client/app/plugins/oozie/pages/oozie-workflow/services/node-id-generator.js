define(function (require) {
    "use strict";

    require('../ngModule').factory('oozie.nodeIdGenerator', function () {
        return {
            factory: function (nodes) {
                var idGenerator = new NodeIdGenerator();
                nodes.forEach(function (node) {
                    var typeIdSeparator = "-";
                    var regexp = new RegExp(node.subtype + typeIdSeparator);
                    if (regexp.test(node.id)) {
                        var idStart = node.id.lastIndexOf(typeIdSeparator);
                        if (idStart !== -1) {
                            var id = +node.id.substr(idStart + 1);
                            if (!isNaN(id)) {
                                idGenerator.setStartIndex(node.subtype, id);
                            }
                        }
                    }
                });
                return idGenerator;
            }
        };
    });

    function NodeIdGenerator() {
        this.subtypes = {};
    }

    NodeIdGenerator.prototype.setStartIndex = function (subtype, index) {
        this.subtypes[subtype] = index;
    };

    NodeIdGenerator.prototype.getNodeId = function (subtype, separator, nodes, id) {
        if (id) {
            this.subtypes[subtype] = id;
        } else if (this.subtypes[subtype]) {
            this.subtypes[subtype] += 1;
        } else {
            this.subtypes[subtype] = 1;
        }

        var newId = subtype + separator + (this.subtypes[subtype] ? this.subtypes[subtype] : 1);
        if(isNodeIdUnique(newId, nodes)) {
            return newId;
        } else {
            return NodeIdGenerator.prototype.getNodeId.call(this, subtype, separator, nodes, (this.subtypes[subtype] ? this.subtypes[subtype] + 1 : 1));
        }
    };

    function isNodeIdUnique(newId, nodes) {
        var isUnique = true;
        if (nodes && nodes.length && nodes.length > 0) {
            nodes.forEach(function (node) {
                if (node.id === newId) {
                    isUnique = false;
                }
            });
        }
        return isUnique;
    }

});
