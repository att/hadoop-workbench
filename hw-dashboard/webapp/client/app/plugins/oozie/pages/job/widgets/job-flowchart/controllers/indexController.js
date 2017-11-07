define(function (require) {
    "use strict";

    var ng = require("angular");
    require("../ngModule").controller('oozie.widgets.job-flowchart.IndexController', controller);

    controller.$inject = [
        "$scope",
        "$q",
        "main.alerts.alertsManagerService"
    ];

    function controller($scope, $q,  dashboardAlertsManager) {
        var removeAlerts = [];

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
            if (connection !== null) {
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

            if (newNodeIsSelected) {
                $scope.$emit("node-select.flowchart", node);
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

        $scope.deleteConnectionRequest = function (connection) {
            if (connection) {
                deleteConnectionRequest(connection);
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
            if (currentlySelectedNode) {
                $scope.$emit("node-deselect.flowchart", currentlySelectedNode);
            }
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

        function selectNode(node) {
            deselectCurrentConnection();
            deselectCurrentNode();

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

            if (connection) {
                currentlySelectedConnection = connection;
                currentlySelectedConnection.$connection.canvas.classList.add("selected");
                currentlySelectedConnection.$connection.endpoints.forEach(function (ep) {
                    ep.canvas.classList.add("selected");
                });
            }
        }

        function deselectCurrentConnection() {
            if (currentlySelectedConnection && currentlySelectedConnection.$connection) {
                currentlySelectedConnection.$connection.canvas.classList.remove("selected");
                currentlySelectedConnection.$connection.endpoints.forEach(function (ep) {
                    ep.canvas.classList.remove("selected");
                });
                currentlySelectedConnection = null;
            } else {
                currentlySelectedConnection = null;
            }
        }

        function deleteConnectionRequest(connection) {
            $scope.$emit("connection-remove.flowchart", connection);
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
    }
});
