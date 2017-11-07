define(function (require) {
    "use strict";

    var angular = require("angular");
    var setImmediate = require("setImmediate");

    require('../ngModule').directive('dapCoreJsPlumbItem', ["generateUUID", "oozie.NodeConnectors", function (generateUUID, NodeConnectors) {
        return {
            require: '^dapCoreJsPlumbContainer',
            restrict: 'A',
            scope: {
                draggableOptions: '=',
                options: '=',
                node: '=',
                nodeValidatorCb: '='    // {function}  |  {false}
            },
            controller: function ($scope) {
                this.getNode = function () {
                    return $scope.node;
                };
            },
            link: function (scope, element, attrs, requires) {
                var jsPlumbContainerCtrl = requires;
                jsPlumbContainerCtrl.getInstance().then(function (instance) {

                    // check if element is already rendered in the browser (http://stackoverflow.com/a/21696585/2545680)
                    var nativeElement = element[0];
                    var elementIsRendered = false;
                    if (nativeElement.style.position !== "fixed") {
                        elementIsRendered = nativeElement.offsetParent !== null;
                    } else {
                        var elementStyle = window.getComputedStyle(nativeElement);
                        elementIsRendered = elementStyle.display !== 'none';
                    }

                    if (nativeElement.offsetParent
                        && scope.node.position.top === 16
                        && scope.node.position.left === 16) {
                        var left = nativeElement.offsetParent.parentElement.clientWidth * 0.75
                            + nativeElement.offsetParent.parentElement.scrollLeft;
                        scope.node.position.left = left;
                    }

                    if (!elementIsRendered) {
                        // schedule configuring endpoints after repaint
                        setImmediate(configureEndpoints.bind(null, instance, scope.node, scope));
                    } else {
                        configureEndpoints(instance, scope.node, scope);
                    }

                    var draggableOpts = angular.extend({
                        containment: 'parent',
                        grid: [16, 16],

                        // update node position
                        stop: function () {
                            var position = element.position();

                            scope.$apply(function () {
                                scope.node.position.top = position.top;
                                scope.node.position.left = position.left;
                            });
                        }
                    }, scope.draggableOptions);

                    instance.draggable(element, draggableOpts);

                    element.data("node", scope.node);

                    jsPlumbContainerCtrl.registerNode(scope.node, element);

                    scope.$watch('node.position.left', function () {
                        instance.repaint(element);
                    });
                    scope.$watch('node.position.top', function () {
                        instance.repaint(element);
                    });

                    if (scope.nodeValidatorCb !== false) {
                        scope.$watch(function () {
                            return scope.nodeValidatorCb(scope.node);
                        }, function (valid) {
                            scope.node.isValid = valid;
                        });
                    } else {
                        // node is readonly, skip validation
                        scope.node.isValid = true;
                    }
                });

                function configureEndpoints(jsPlumbInstance, node, scope) {
                    var nativeElement = element[0];
                    var elementIsRendered = false;
                    if (nativeElement.style.position !== "fixed") {
                        elementIsRendered = nativeElement.offsetParent !== null;
                    } else {
                        var elementStyle = window.getComputedStyle(nativeElement);
                        elementIsRendered = elementStyle.display !== 'none';
                    }

                    if (!elementIsRendered) {
                        // schedule configuring endpoints after repaint with in interval of 500 ms to avoid performance hit
                        setTimeout(configureEndpoints.bind(null, jsPlumbInstance, node, scope), 500);
                        return;
                    }
                    node.endpoints = [];

                    node.connectors.forEach(function (connectorType) {
                        var epConfig = NodeConnectors[connectorType];

                        if (angular.isUndefined(epConfig)) {
                            console.warn("No configuration exists for the connector with type " + connectorType);
                            return;
                        }

                        epConfig.uuid = generateUUID();
                        var ep = jsPlumbInstance.addEndpoint(element, epConfig);

                        node.endpoints.push({
                            id: epConfig.uuid,
                            connectorType: connectorType,
                            ep: ep
                        });
                    });

                    // TODO(maximk): refactor evalAsync (required since this `configureEndpoints` sometimes is called in digest by tree-control)
                    scope.$evalAsync(function () {
                        scope.$emit("endpoints-configured.js-plumb-item", node);
                    });
                }
            }
        };
    }]);
});
