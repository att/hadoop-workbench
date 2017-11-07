define(function (require) {
    "use strict";

    var ng = require("angular");
    require("../ngModule").controller('oozie.widgets.flowchart.indexController', controller);

    controller.$inject = [
        "$scope",
        "$q",
        "main.alerts.alertsManagerService"
    ];

    function controller($scope, $q, dashboardAlertsManager) {
        var removeAlerts = [];
        $scope.isDeleteOverlayVisible = true;

        // node is selected/deselected outside of the flowchart widget
        $scope.$watch("selectedNodeContainer.node", function (node) {
            if (node !== null) {
                selectNode(node);
            } else {
                deselectCurrentNode();
            }
        });

        // connection is selected/deselected outside of the flowchart widget
        $scope.$watch("selectedConnection", function (connection) {
            if (connection !== null && $scope.selectedConnection) {
                selectConnection(connection);
            } else {
                deselectCurrentConnection();
            }
        });

        $scope.$on("endpoint-delete.jsPlumbRemoveNode", function (event, endpoint) {
            if (currentlySelectedConnection) {
                var epConnections = endpoint.ep.connections;
                epConnections.some(function (JsPlumbConnection) {
                    if (currentlySelectedConnection.$connection === JsPlumbConnection) {
                        deselectCurrentConnection();
                        return true;
                    }
                    return false;
                });
            }
        });

        $scope.$on("node-hotkey-remove.flowchart", function (event, nodeArray) {
            confirmMultipleNodeDeletion(nodeArray);
        });

        function confirmMultipleNodeDeletion (nodeArray) {
            var idCollection = [];
            Object.keys(nodeArray).forEach(function (node) {
                findAlertByOwnerAndCloseIt(nodeArray[node]);
                idCollection.push("&bull;&nbsp;" + nodeArray[node].id);
            });
            idCollection = idCollection.toString();
            var def = $q.defer();

            var confirmation = {
                type: "confirm",
                title: $scope.alertTitle + ' > Multiple delete',
                text: "Do you really want to remove this nodes? </br>" + idCollection.replace(/,/g,'</br>'),
                buttons: [
                    {
                        text: "Yes",
                        style: "action",
                        action: function (close) {
                            close();
                            def.resolve();
                            removeNodes(nodeArray);
                        }
                    },
                    {
                        text: "No",
                        style: "cancel",
                        action: function (close) {
                            close();
                            def.reject();
                        }
                    }
                ]
            };
            var alert = dashboardAlertsManager.addAlertInfo(confirmation);
            addAlertToRemoveAlerts(alert);

            return def.promise;
        }

        function removeNodes (nodeArray) {
            Object.keys(nodeArray).forEach(function (node) {
                $scope.$emit("node-remove-confirm.flowchart", nodeArray[node]);
            });
        }

        var currentlySelectedNode = null;
        var currentlySelectedConnection = null;

        // node is selected inside of the flowchart widget
        $scope.selectNode = function (node, event) {
            if (event) {
                event.stopPropagation();
            }
            var newNodeIsSelected = false;
            if (currentlySelectedNode === null) {
                newNodeIsSelected = true;
            } else {
                var sameNodeIsClicked = currentlySelectedNode === node;
                if (!sameNodeIsClicked) {
                    newNodeIsSelected = true;
                }
            }

            if (newNodeIsSelected || event.ctrlKey || event.metaKey) {
                $scope.$emit("node-select.flowchart", node, event.ctrlKey || event.metaKey);
                $scope.$emit('focus-catcher.bubbled-click', $scope.dashboardWidget);
            }
        };

        $scope.selectOpenNode = function (node, event) {
            if (event) {
                event.stopPropagation();
            }

            if (!$scope.$emit("node-double-clicked", node).defaultPrevented) {
                $scope.selectNode(node, event);
            }
        };

        // connection is selected inside of the flowchart widget
        $scope.selectConnection = function (connection) {
            var newConnectionIsSelected = false;
            if (currentlySelectedConnection === null) {
                newConnectionIsSelected = true;
            } else {
                var sameConnectionIsClicked = currentlySelectedConnection === connection;
                if (!sameConnectionIsClicked) {
                    newConnectionIsSelected = true;
                }
            }

            if (newConnectionIsSelected) {
                $scope.$emit("connection-select.flowchart", connection);
            }
        };

        $scope.confirmNodeDeletion = function (node) {
            findAlertByOwnerAndCloseIt(node);
            var def = $q.defer();

            var confirmation = {
                type: "confirm",
                title: $scope.alertTitle + ' > ' + node.id,
                text: "Do you really want to remove this node?",
                buttons: [
                    {
                        text: "Yes",
                        style: "action",
                        action: function (close) {
                            close();
                            def.resolve();
                        }
                    },
                    {
                        text: "No",
                        style: "cancel",
                        action: function (close) {
                            close();
                            def.reject();
                        }
                    }
                ]
            };
            var alert = dashboardAlertsManager.addAlertInfo(confirmation);
            addAlertToRemoveAlerts(alert, node, def);

            return def.promise;
        };

        $scope.onScreenClicked = function (event) {
            event.stopPropagation();
            if (currentlySelectedConnection
                && currentlySelectedConnection.$connection) {
                $scope.$emit("connection-deselect.flowchart", currentlySelectedConnection);
            }
            $scope.$emit("node-deselect.flowchart");
            if ($scope.selectedConnection) {
                $scope.$emit("connection-deselect.flowchart", $scope.selectedConnection);
            }
            $scope.$emit('focus-catcher.bubbled-click', $scope.dashboardWidget);
        };

        $scope.onScreenDoubleClicked = function (event) {
            event.stopPropagation();
            if (currentlySelectedConnection) {
                $scope.$emit("node-double-clicked", currentlySelectedConnection);
            }
        };

        $scope.deleteConnectionRequest = function (connection) {
            if (connection) {
                deleteConnectionRequest(connection);
            }
        };

        $scope.removeConnection = function(connection) {
            removeConnection(connection);
        }

        function selectNode(node) {
            deselectCurrentConnection();
            deselectCurrentNode();
            deleteOverlayVisible(false);
            if (node) {
                currentlySelectedNode = node;
                currentlySelectedNode.isSelected = true;
            }
        }

        function deselectCurrentNode() {
            if (currentlySelectedNode) {
                currentlySelectedNode.isSelected = false;
                currentlySelectedNode = null;
            }
        }

        function selectConnection(connection) {
            deselectCurrentNode();
            deselectCurrentConnection();
            deleteOverlayVisible(false);
            if (connection) {
                currentlySelectedConnection = connection;
                currentlySelectedConnection.$connection.endpoints.forEach(function (ep) {
                    ep.canvas.classList.add("selected");
                    deleteOverlayVisible(true);
                });
                currentlySelectedConnection.$connection.canvas.classList.add("selected");
            }
        }

        function removeConnection(connection) {
            if (connection) {
                deselectCurrentConnection();
                $scope.$emit("connection-remove.flowchart", connection);
            }
        }

        function deleteConnectionRequest(connection) {
            if (connection) {
                $scope.$emit("connection-remove.flowchart", connection);
            }
        }

        function deselectCurrentConnection() {
            if (currentlySelectedConnection &&
                currentlySelectedConnection.$connection &&
                currentlySelectedConnection.$connection.endpoints) {
                currentlySelectedConnection.$connection.endpoints.forEach(function (ep) {
                    ep.canvas.classList.remove("selected");
                });
                currentlySelectedConnection.$connection.canvas.classList.remove("selected");
                currentlySelectedConnection = null;
                deleteOverlayVisible(false);
            } else {
                currentlySelectedConnection = null;
                deleteOverlayVisible(false);
            }
        }

        function addAlertToRemoveAlerts(alert, owner, deferred) {
            removeAlerts.push({
                alert: alert,
                owner: owner,
                deferred: deferred
            });
        }

        function findAlertByOwnerAndCloseIt(owner) {
            removeAlerts.filter(function (alertContainer) {
                return alertContainer && alertContainer.owner === owner;
            }).forEach(function (alertContainer) {
                dashboardAlertsManager.closeAlert(alertContainer.alert);

                if (alertContainer.deferred) {
                    alertContainer.deferred.reject();
                }
            });
        }

        function deleteOverlayVisible(flag) {
            $scope.isDeleteOverlayVisible = flag;
        }
    }
});
