define(function (require) {
    "use strict";

    require("../ngModule").controller("oozie.widgets.nodeSelector.indexController", indexController);

    var ng = require("angular");
    indexController.$inject = ["$scope"];
    function indexController($scope) {

        $scope.subtypeFilter = "";
        $scope.nodesMetadataFiltered = $scope.nodesMetadata.slice(0);

        $scope.treeOptions = {
            nodeChildren: "children",
            dirSelectable: false,
            multiSelection: false,
            isLeaf: function (node) {
                return node.type === "node-template";
            },
            injectClasses: {
                ul: "a1",
                li: "a2",
                liSelected: "a7",
                iExpanded: "a3",
                iCollapsed: "a4",
                iLeaf: "a5",
                label: "a6",
                labelSelected: "a8"
            }
        };

        $scope.selectedNode = {};
        $scope.expandedNodes = [];

        $scope.$watch("subtypeFilter", function (searchSpec) {
            $scope.nodesMetadata.forEach(function (node) {
                var position = $scope.expandedNodes.indexOf(node);
                if (searchSpec) {
                    if (position === -1) {
                        $scope.expandedNodes.push(node);
                    }
                } else {
                    if (position !== -1) {
                        $scope.expandedNodes.splice(position, 1);
                    }
                }
            });

            $scope.nodesMetadataFiltered = filter($scope.nodesMetadata, searchSpec);
        });

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

            return filtered;
        }


        $scope.onSelectedNode = function (node, selected) {
            switch (node.type) {
                case ("node-subtype"):
                {
                    if (!node.canHaveTemplates) {
                        $scope.$emit("node-add.node-selector", ng.copy(node, {}));
                    } else {
                        node.loadingChildren = true;
                        $scope.loadTenantsList(node).then(function (data) {
                            // deselect current node
                            $scope.selectedNode = {};

                            var children = data.nodeTemplates;

                            var defaultTemplate = {
                                title: node.name + " (Default)",
                                name: node.name,
                                groupName: node.groupName,
                                version: node.version,
                                type: "node-template",
                                template: null
                            };

                            node.children = [defaultTemplate];

                            if (ng.isArray(children)) {
                                children.forEach(function (tenant) {
                                    node.children.push({
                                        version: node.version,
                                        title: tenant.info.title,
                                        name: tenant.actionSubtype,
                                        type: "node-template",
                                        template: tenant.info,
                                        groupName: node.groupName
                                    });
                                });

                                // expand the node
                                $scope.expandedNodes.push(node);
                            } else {
                                console.warn("Convert for node tenants metadata is invalid, array expected instead saw: " + typeof data.nodeTemplates);
                            }
                        }).finally(function () {
                            node.loadingChildren = false;
                        });
                    }
                    break;
                }
                case ("node-template"):
                {
                    $scope.$emit("node-add.node-selector", ng.copy(node, {}));
                    break;
                }
                default:
                {
                    console.warn(false, "Something other than subtype or template is clicked");
                }
            }
        };
    }
});
