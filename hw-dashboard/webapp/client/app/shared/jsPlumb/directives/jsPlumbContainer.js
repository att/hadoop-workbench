define(function (require) {
    "use strict";

    var jsPlumb = require('jsPlumb');
    var $ = require('jquery');
    var angular = require("angular");

    require('../ngModule').directive('dapCoreJsPlumbContainer', ["$q", "generateUUID", "oozie.NodeConnectors", function ($q, generateUUID, NodeConnectors) {
        return {
            restrict: 'A',
            scope: {
                options: '=',
                node: '=',
                onBeforeConnection: '&',
                onConnection: '&',
                selectedModule: '=',
                onBeforeDetach: '&',
                onConnectionDetached: '&',
                onConnectionSelected: "&",
                onConnectionDeselect: "&",
                onConnectionDeleteRequest: "&",
                deleteIconShowStatus: "="
            },
            controller: function ($scope, $element, $q, $timeout) {
                var overlayClass = 'jsplumb-icon-connection-delete';
                var _counter = 0;
                var removeButtonTemplate = $('<div>&nbsp;</div>');
                var opts = angular.extend({
                    Container: $element,
                    Connector: ["Bezier", {curviness: 30}],
                    PaintStyle: {strokeStyle: "#7c92a7", lineWidth: 2},
                    Overlays: [
                        ["PlainArrow", {width: 10, length: 10, location: 0.5}],
                        ["Custom", {
                            create: function (component) {
                                return removeButtonTemplate.clone();
                            },
                            location: -1,
                            id: overlayClass,
                            cssClass: overlayClass
                        }]
                    ],
                }, $scope.options);

                $scope.nodeList = [];


                $scope.$watch("deleteIconShowStatus", function (isVisible) {
                    if (isVisible !== true) {
                        $("." + overlayClass).fadeOut(300);
                    }
                });

                function scrollToHidden() {
                    var parentContainer = $element[0];
                    var children = parentContainer.children;
                    var maxOffsetLeft = null;
                    var scrollChildId = null;

                    for (var i = 0, length = children.length; i < length; i++) {
                        if (children[i] && children[i].offsetLeft && children[i].id
                            && children[i].id.startsWith("jsPlumb") && children[i].offsetLeft > maxOffsetLeft) {
                            maxOffsetLeft = children[i].offsetLeft;
                            scrollChildId = children[i].id;
                        }
                    }

                    $timeout(function () {
                        $('#' + scrollChildId).parent().parent().scrollLeft(maxOffsetLeft);
                    }, 50);
                }

                var isInitializing = false;
                var instanceDefer = $q.defer();
                var instance = null;

                this.getInstance = function () {
                    var defer = $q.defer();
                    if (instance) {
                        defer.resolve(instance);
                    } else if (!isInitializing) {
                        isInitializing = true;
                        jsPlumb.ready(function () {

                            instance = jsPlumb.getInstance(opts);

                            instance.bind("connectionDrag", onConnectionDrag.bind(this));

                            instance.bind("beforeDrop", beforeDrop.bind(this));

                            instance.bind("connection", onConnection.bind(this));

                            instance.bind("connectionDetached", onConnectionDetached);

                            instance.bind("click", function (connection, event) {

                                event.stopPropagation();

                                var clickedElement = event.currentTarget;

                                if (clickedElement.classList.contains("_jsPlumb_overlay")) {
                                    //Hack for confirmAndRemoveConnection function
                                    connection = {
                                        $connection: connection
                                    };
                                    $scope.$apply(function () {
                                        $scope.onConnectionDeleteRequest({
                                            connection: connection
                                        });
                                    });
                                    $(clickedElement).fadeOut(300);
                                } else {
                                    $("." + overlayClass).fadeOut(300);
                                    $(connection.canvas).next('div').css({
                                        "width": 0,
                                        "height": 0
                                    }).show().animate({width: "13px", height: "13px"}, 400);

                                    $scope.$apply(function () {
                                        $scope.onConnectionSelected({
                                            connection: connection
                                        });
                                    });
                                }

                            });

                            $element.data('jsPlumbInstance', instance);
                            instanceDefer.resolve(instance);
                            defer.resolve(instance);
                        });
                    } else {
                        instanceDefer.promise.then(function (instance) {
                            defer.resolve(instance);
                        });
                    }

                    return defer.promise;
                };

                /**
                 * Node is registered by the JsPlumbItem directive on DOM element when it is added with ng-repeat
                 */
                this.registerNode = function (data, element) {
                    var nodeIsRegistered = $scope.nodeList.some(function (n) {
                        return n.element === element;
                    });
                    if (nodeIsRegistered) {
                        return;
                    }
                    $scope.nodeList.push({node: data, element: element});
                };

                this.getNodes = function () {
                    return $scope.nodeList;
                };

                this.getNode = function (nodeId) {
                    var result = $scope.nodeList.filter(function (n) {
                        return n.node.id === nodeId;
                    })[0];

                    return result;
                };


                /**
                 * Notification a Connection was established.
                 *
                 * @param {object} info
                 * @param {jsPlumb.Connection} info.connection  - the new Connection. you can register listeners on this etc.
                 * @param {string} info.sourceId: - id of the source element in the Connection
                 * @param {string} info.targetId:  - id of the target element in the Connection
                 * @param {HTMLElement} info.source: - the source element in the Connection
                 * @param {HTMLElement} info.target - the target element in the Connection
                 * @param {jsPlumb.Endpoint} info.sourceEndpoint - the source Endpoint in the Connection
                 * @param {jsPlumb.Endpoint} info.targetEndpoint - the targetEndpoint in the Connection
                 * }
                 */
                function onConnection(info) {
                    var from = $(info.source).data('node');
                    var to = $(info.target).data('node');
                    $scope.$apply(function () {
                        // assume that in the array connection.connection.endpoints the first endpoint is a source endpoint
                        var srcEndpointUuid = info.connection.endpoints[0].getUuid();
                        // assume that in the array connection.connection.endpoints the second endpoint is a target endpoint
                        var targetEndpointUuid = info.connection.endpoints[1].getUuid();

                        $scope.onConnection({
                            info: {
                                connection: info.connection,
                                from: from,
                                to: to,
                                endpointUuids: {
                                    from: srcEndpointUuid,
                                    to: targetEndpointUuid
                                }
                            }
                        });
                    });
                }

                var isMoved = null;

                function onConnectionDrag(info) {
                    var src = info.sourceId;
                    var con = instance.getConnections({source: src});
                    if (con.length != 0 && info) {
                        for (var i = 0; i < con.length; i++) {
                            if (con[i].id === info.id) {
                                isMoved = true;
                            }
                        }
                    }
                }

                function beforeDrop(info) {
                    var from = $(info.connection.source).data("node");
                    var to = $(info.connection.target).data("node");

                    if (isMoved) {
                        if (to.endpoints[0].ep.connections.length !== 0) {
                            return false;
                        }
                        let connection = {
                            connection: info.connection,
                            from: from,
                            to: to,
                            endpointUuids: {
                                from: info.connection.endpoints[0].getUuid(),
                                to: info.dropEndpoint.getUuid()
                            }
                        };

                        $scope.$emit("connection-moved.flowchart", {info, connection});
                        isMoved = null;
                        return true;
                    } else {
                        // if (from.subtype === "decision") {
                        //     _counter++;
                        //     addDecisionCase(info);
                        // }
                        /* TODO(maximk): create model that represents connection created by JsPlumb (model with
                         endpointUuids property and without nodes/connections explicit property) */

                        // before connection is established jsPlumb keeps target connection in `dropEndpoint` property
                        var connection = {
                            connection: info.connection,
                            from: from,
                            to: to,
                            endpointUuids: {
                                from: info.connection.endpoints[0].getUuid(),
                                to: info.dropEndpoint.getUuid()
                            }
                        };

                        var event = null;

                        $scope.$apply(function () {
                            event = $scope.$emit("connectionadd.flowchart", connection);
                        });

                        return !event.defaultPrevented;
                    }
                }

                /**
                 * Notification a Connection was detached
                 *
                 * @param {object} info
                 * @param {jsPlumb.Connection} info.connection - the new Connection. you can register listeners on this etc.
                 * @param {string} info.sourceId - id of the source element in the Connection
                 * @param {string} info.targetId - id of the target element in the Connection
                 * @param {HTMLElement} info.source - the source element in the Connection
                 * @param {HTMLElement} info.target - the target element in the Connection
                 * @param {jsPlumb.Endpoint} info.sourceEndpoint - the source Endpoint in the Connection
                 * @param {jsPlumb.Endpoint} info.targetEndpoint - the targetEndpoint in the Connection
                 * @param {object=} originalEvent
                 */
                function onConnectionDetached(info) {
                    // TODO(maximk): this callback is also triggered when connection is detached during dragging
                    // TODO(maximk): in that case we don't want to trigger `onConnectionDetached` - find a way to do that

                    // deletion should already be triggered inside digest cycle since connection can be currently
                    // removed only through UI elements' click action triggering digest cycle
                    $scope.onConnectionDetached({
                        info: info
                    });
                }

            },
            compile: function (element, attrs) {
                var rightPadding = +attrs["flowchartRightPadding"];
                return function (scope, element) {
                    // this watcher sets the width of the container by the position of nodes
                    scope.$watch(function () {
                        var maxOffset = 0;
                        element.find("[dap-core-js-plumb-item]").each(function (index, element) {
                            element = angular.element(element);
                            var offset = element.position().left + element.outerWidth(true);
                            if (maxOffset < offset) {
                                maxOffset = offset;
                            }
                        });

                        return maxOffset;
                    }, function (newWidth) {
                        element.width(newWidth + rightPadding);
                    });
                };
            }
        };
    }]);
});