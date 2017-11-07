/*jshint maxparams:14*/
define(function (require) {
        "use strict";

        require('../ngModule').controller('oozie.pages.JobLogController', indexController);

        var ng = require("angular");

        indexController.$inject = [
            '$scope',
            '$sce',
            '$timeout',
            '$widgetParams',
            'dashboard-isolated-widget-accessor.WidgetStore',
            'oozie.job-rest-service'
        ];

        function indexController($scope, $sce, $timeout, $widgetParams, WidgetStore, restService) {

            var widget = WidgetStore.getWidget();
            var source = widget.params.source;
            var jobId = $widgetParams.params.jobId;
            var actionMetaGetter = $widgetParams.params.actionMetaGetter;

            var isFirstRun = true;
            var lastInternalId = null;
            var lastExternalId = null;

            var lastResult = [];
            var lastMessageRaw = emptyStringReferenceContainer();

            var internalId = null;
            var externalId = null;
            var resDynamicLogArray = [];

            var last = {
                internalResult: {},
                internalMessageRaw: {},
                externalMessageRaw: {}
            };

            var externalLogTypesObject = {
                stdOut: 'stdout',
                stdErr: 'stderr',
                syslog: 'syslog'
            };

            var refreshKeys = {
                job: 'job',
                internal: 'internal',
                external: 'external'
            };

            ng.extend($scope, {
                refreshIntervalTimeout: {
                    job: null,
                    internal: null,
                    external: null
                },
                isAutoRefresh: true,
                refreshInterval: 5000,
                isSwitchTransitionActive: false,
                isSwitchTransitionInternalActive: false,
                isSwitchTransitionExternalActive: false,

                isNodeSelected: false,

                messages: [],
                internalMessages: [],
                externalLogDynamicArray: [],
                externalLogTypesArray: [
                    'stdOut',
                    'stdErr',
                    'syslog'
                ],
                messagesRaw: "",
                internalMessageRaw: "",
                externalMessageRaw: emptyExternalMessageRaw(),

                // Errors
                messagesErrorRaw: "",
                isMessagesError: false,
                internalMessageErrorRaw: "",
                isInternalMessageError: false,
                externalMessageErrorRaw: "",
                isExternalMessageError: false,

                isInternalActive: true,
                isExternalActive: false,
                isExternalAvailable: false,
                isExternalSectionActive: {
                    stdOut: true,
                    stdErr: false,
                    syslog: false
                },
                externalDynamicActiveId: 0,
                externalSectionActive: 'stdOut',

                isErrorTextExpanded: false,
                //
                // codeMirrorOptions: {
                //     lineWrapping: true,
                //     readOnly: true,
                //     pagination: false
                // }

            });

            // ng.extend($scope, {
            //     container: {
            //         text: $scope.messagesRaw
            //     },
            //     containerInternal: {
            //         text: $scope.internalMessageRaw
            //     }
            // });
            ng.extend($scope, {
                switchToInternalLog: function () {
                    $scope.isExternalActive = false;
                    $scope.isInternalActive = true;
                    updateLogRequest();
                },
                switchToExternalLog: function () {

                    if ($scope.isExternalAvailable) {
                        $scope.isInternalActive = false;
                        $scope.isExternalActive = true;
                        $scope.switchToExternalLogSubtype('stdOut');
                        updateLogRequest();
                    } else {
                        // no action;
                    }
                },
                switchExternalLogDynamic: function (dynamicId) {
                    $scope.externalDynamicActiveId = dynamicId;
                },
                switchToExternalLogSubtype: function (subtype) {
                    $scope.externalSectionActive = subtype;
                    $scope.externalLogTypesArray.forEach(function (type) {
                        $scope.isExternalSectionActive[type] = false;
                    });
                    $scope.isExternalSectionActive[subtype] = true;
                },
                isSelectedLogEmpty: function () {
                    if (!$scope.isNodeSelected) {
                        return $scope.messagesRaw.length == 0;
                    } else {
                        if ($scope.isInternalActive) {
                            return $scope.internalMessageRaw.length == 0;
                        }
                        if ($scope.isExternalActive) {
                            let dynamicSection = $scope.externalMessageRaw[$scope.externalDynamicActiveId];
                            return dynamicSection && dynamicSection[$scope.externalSectionActive].length == 0;
                        }
                        return true;
                    }
                },
                isSelectedLogError: function () {
                    if (!$scope.isNodeSelected) {
                        return $scope.isMessagesError;
                    } else {
                        if ($scope.isInternalActive) {
                            return $scope.isInternalMessageError;
                        }
                        if ($scope.isExternalActive) {
                            return $scope.isExternalMessageError;
                        }
                        return false;
                    }
                },
                isLoadingVisible: function () {
                    if (!$scope.isNodeSelected) {
                        return $scope.isSwitchTransitionActive;
                    } else {
                        if ($scope.isInternalActive) {
                            return $scope.isSwitchTransitionInternalActive;
                        }
                        if ($scope.isExternalActive) {
                            return $scope.isSwitchTransitionExternalActive;
                        }
                        return false;
                    }
                }
            });

            init();

            function init() {
                /**
                 * Read inital widget state
                 */
                parseActionMeta(actionMetaGetter());

                subscribeEvents();

                initWatchers();

                /**
                 * Run REST requests loop
                 */
                updateLogRequest();
            }

            function emptyStringReferenceContainer() {
                return {
                    strRef: ""
                }
            }

            function emptyExternalResultObject() {
                return {
                    stdOut: "",
                    stdErr: "",
                    syslog: ""
                };
            }

            function emptyExternalMessageRaw() {
                return [emptyExternalMessageRawObject()];
            }

            function emptyExternalMessageRawObject() {
                return {
                    stdOut: emptyStringReferenceContainer(),
                    stdErr: emptyStringReferenceContainer(),
                    syslog: emptyStringReferenceContainer()
                };
            }


            /**
             * Split String into rows usign "\n" as separator
             * Concatenate string which starts with "\t" into one.
             *
             * @param {String} stringLog
             */
            function splitLogLowLevel(stringLog) {
                var splittedArr = stringLog.split('\n');
                var resultArr = [];
                var cacheArr = [];
                var currentStrElement = null;
                var nextStrElement = null;

                var isLast = false;
                var isNextShouldBeConcatenated = false;
                for (var i = 0; i < splittedArr.length; i++) {
                    currentStrElement = splittedArr[i];
                    isLast = i + 1 == splittedArr.length;
                    if (!isLast) {
                        nextStrElement = splittedArr[i + 1];
                        isNextShouldBeConcatenated = nextStrElement.length > 0 && nextStrElement.charAt(0) == "\t";
                    } else {
                        isNextShouldBeConcatenated = false;
                    }
                    /**
                     * Skip empty lines
                     */
                    if (currentStrElement) {
                        cacheArr.push(currentStrElement);
                    }

                    if (!isNextShouldBeConcatenated && cacheArr.length > 0) {
                        resultArr.push(cacheArr.join("\n\t"));
                        cacheArr = [];
                    }

                }
                return resultArr;
            }

            function updateLogRequest() {
                if (!$scope.isNodeSelected) {
                    if (isFirstRun) {
                        isFirstRun = false;
                        $scope.isSwitchTransitionActive = true;
                        lastResult = [];
                        lastMessageRaw = emptyStringReferenceContainer();
                    }
                    restService.silent().getJobLog(source, jobId).then(function (res) {
                            $scope.isMessagesError = false;
                            // @TODO: improve performance
                            $scope.messagesRaw = $sce.trustAsHtml(highlightMessageType(res));

                            autoRefreshData(refreshKeys.job);
                        }
                    ).catch(function (error) {
                            $scope.isMessagesError = true;
                            $scope.messagesErrorRaw = getErrorText(error);
                        }).finally(function () {
                            $scope.isSwitchTransitionActive = false;
                        });
                }
                if ($scope.isInternalActive && $scope.isNodeSelected) {
                    if (internalId) {
                        if (internalId != lastInternalId) {
                            lastInternalId = internalId;
                            if (!last.internalResult[internalId]) {
                                last.internalResult[internalId] = [];
                                last.internalMessageRaw[internalId] = emptyStringReferenceContainer();
                            } else {
                                $scope.internalMessages = last.internalResult[internalId];
                                $scope.internalMessageRaw = last.internalMessageRaw[internalId].strRef;
                            }
                            $scope.isSwitchTransitionInternalActive = true;
                        }
                        (function () {
                            restService.silent().getJobActionLog(source, jobId, internalId).then(function (res) {
                                $scope.isInternalMessageError = false;
                                // @TODO: improve performance
                                $scope.internalMessageRaw = $sce.trustAsHtml(highlightMessageType(res));

                                autoRefreshData(refreshKeys.internal);

                            })
                                .catch(function (error) {
                                    $scope.isInternalMessageError = true;
                                    $scope.internalMessageErrorRaw = getErrorText(error);
                                }).finally(function () {
                                    $scope.isSwitchTransitionInternalActive = false;
                                });
                        }({internalId: internalId}));
                    } else {
                        // lastInternalId = internalId;
                        $scope.internalMessageRaw = "";
                        $scope.internalMessages.splice(0);
                    }
                }

                if ($scope.isExternalActive && $scope.isNodeSelected) {
                    if (externalId) {
                        if (externalId != lastExternalId) {
                            lastExternalId = externalId;
                            $scope.isSwitchTransitionExternalActive = true;
                            if (!last.externalMessageRaw[externalId]) {
                                last.externalMessageRaw[externalId] = emptyExternalMessageRaw();
                            } else {
                                last.externalMessageRaw[externalId].forEach((item, dynamicId) => {
                                    $scope.externalLogTypesArray.forEach(function (logType) {
                                        $scope.externalMessageRaw[dynamicId][logType] = last.externalMessageRaw[externalId][dynamicId][logType].strRef;
                                    });
                                })
                            }
                        }
                        (function () {
                            restService.silent().getJobExternalActionLog(source, jobId, externalId).then(function (res) {
                                // "res" example :
                                // {
                                //     logs: [
                                //         {appType: "LABEL", jobLogTraces: {strOut, stdErr, syslog}}
                                //         {appType: "LABEL OTHER", jobLogTraces: {strOut, stdErr, syslog}}
                                //     ]
                                //
                                // }
                                resDynamicLogArray = !isEmptyObject(res) ? res.logs: [];

                                $scope.isExternalMessageError = false;
                                $scope.externalLogDynamicArray = resDynamicLogArray.map(({appType}) => appType);
                                resDynamicLogArray.forEach(({jobLogTraces}, dynamicId) => {
                                    {
                                        $scope.externalLogTypesArray.forEach(function (logType) {
                                            if (!$scope.externalMessageRaw[dynamicId]) {
                                                $scope.externalMessageRaw[dynamicId] = [];
                                            }
                                            $scope.externalMessageRaw[dynamicId][logType] = $sce.trustAsHtml(highlightMessageType(jobLogTraces[logType]));
                                        });
                                    }
                                });

                                autoRefreshData(refreshKeys.external);

                            }).catch(function (error) {
                                $scope.isExternalMessageError = true;
                                $scope.externalMessageErrorRaw = getErrorText(error);
                            }).finally(function () {
                                $scope.isSwitchTransitionExternalActive = false;
                            });

                        }({externalId: externalId}));
                    } else {
                        $scope.externalMessageRaw = emptyExternalMessageRaw();
                    }
                }
            }

            function getErrorText(error) {
                return 'Load log failed' + (error && error.message ? ': ' + error.message : '');
            }

            function isExternalIdNotEmpty(id) {
                return !!id && id != '-';
            }

            function filterExternalId(id) {
                return isExternalIdNotEmpty(id) ? id : null;
            }

            function splitRawLog(newInputString, lastInputStringContainer, targetResultArrReference, lastResultArrReference) {
                var inputStringNewPart = '';
                var messagesArrayNewPart = [];
                var cutOfNewInputStringInLengthOfLastInputString = '';

                if (newInputString.length == lastInputStringContainer.strRef.length) {
                    // no new records expected
                    if (newInputString == lastInputStringContainer.strRef) {
                        targetResultArrReference = lastResultArrReference;
                        return;
                    }
                } else if (newInputString.length > lastInputStringContainer.strRef.length) {
                    // calculate possible same starting part of string
                    cutOfNewInputStringInLengthOfLastInputString = newInputString.slice(lastInputStringContainer.strRef.length);
                }

                // verify that possible same starting part of string is true starting part of string
                if (newInputString.length > lastInputStringContainer.strRef.length &&
                    cutOfNewInputStringInLengthOfLastInputString == lastInputStringContainer.strRef
                ) {
                    // add new results to existing
                    inputStringNewPart = cutOfNewInputStringInLengthOfLastInputString;
                    messagesArrayNewPart = splitLogLowLevel(inputStringNewPart);
                    targetResultArrReference = lastResultArrReference;
                    pushNewResultsIntroTargetAndLastResult();
                } else {
                    // starting part of strings are not same, so
                    // it totally new string
                    targetResultArrReference.splice(0);
                    messagesArrayNewPart = splitLogLowLevel(newInputString);
                    pushNewResultsIntroTargetAndLastResult();
                }
                lastInputStringContainer.strRef = newInputString;

                function pushNewResultsIntroTargetAndLastResult() {
                    if (ng.isArray(messagesArrayNewPart) && messagesArrayNewPart.length) {

                        targetResultArrReference.forEach(function (rowObj) {
                            rowObj.isNew = false;
                        });

                        messagesArrayNewPart.forEach(function (row) {
                            var newRow = {
                                text: row,
                                isNew: false
                                /*
                                 * Feature disabled
                                 */
                                //isNew: true && !isFirstRun
                            };
                            targetResultArrReference.push(newRow);
                            lastResultArrReference.push(newRow);
                        });
                    }
                }
            }

            function autoRefreshData(key) {
                if ($scope.refreshIntervalTimeout[key]) {
                    $timeout.cancel($scope.refreshIntervalTimeout[key]);
                    $scope.refreshIntervalTimeout[key] = null;
                }
                $scope.refreshIntervalTimeout[key] = $timeout(function () {
                    if ($scope.isAutoRefresh) {
                        updateLogRequest();
                    }
                }, $scope.refreshInterval);
            }

            function initWatchers() {
                $scope.$watch(function () {
                    return $widgetParams.params.checkIfTabActive();
                }, function (isTabActive, oldValue) {
                    if (isTabActive && isTabActive !== oldValue) {
                        resume();
                    }
                    if (!isTabActive) {
                        suspendFn();
                    }
                });

                $scope.$watch(function () {
                    return $widgetParams.params.checkIfParentTabActive();
                }, function (isTabActive, oldValue) {
                    if (isTabActive && isTabActive !== oldValue) {
                        resume();
                    }
                    if (!isTabActive) {
                        suspendFn();
                    }
                });
            }

            function subscribeEvents() {

                $scope.$on('$destroy', function () {
                    suspendFn();
                });

                $widgetParams.page.on('log-action-changed', function (event, actionMeta) {
                    parseActionMeta(actionMeta);
                    updateLogRequest();
                });
            }

            function parseActionMeta(actionMeta) {
                $scope.isNodeSelected = actionMeta.isNodeSelected;
                internalId = actionMeta.internalId;
                externalId = filterExternalId(actionMeta.externalId);
                $scope.isExternalAvailable = !!externalId;
                if (!$scope.isExternalAvailable) {
                    $scope.switchToInternalLog();
                }
            }

            function resume() {
                $scope.isAutoRefresh = true;
                updateLogRequest();
            }

            function suspendFn() {

                $scope.isAutoRefresh = false;
                $scope.isSwitchTransitionActive = false;
                $scope.isSwitchTransitionInternalActive = false;
                $scope.isSwitchTransitionExternalActive = false;
                Object.keys($scope.refreshIntervalTimeout).forEach(function (key) {
                    if ($scope.refreshIntervalTimeout[key]) {
                        $timeout.cancel($scope.refreshIntervalTimeout[key]);
                        $scope.refreshIntervalTimeout[key] = null;
                    }
                });
            }

            function arrayDiff(toCompare, base) {
                if (base.length === 0) {
                    return toCompare;
                }
                return toCompare.filter(function (item) {
                    return base.indexOf(item) < 0;
                });
            }

            function highlightMessageType(messages) {

                return messages
                    .replace(/exception|error/gi, '<span class="error-marker">$&</span>')
                    .replace(/ERR/g, '<span class="error-marker">$&</span>')
                    .replace(/critical|fatal /gi, '<span class="critical-marker">$&</span>')
                    .replace(/CRIT/g, '<span class="critical-marker">$&</span>')
                    .replace(/warning/gi, '<span class="warning-marker">$&</span>')
                    .replace(/WARN/g, '<span class="warning-marker">$&</span>');
            }

            /**
             * Verify if value === {}
             *
             * @param value
             * @returns {boolean}
             */
            function isEmptyObject(value) {
                if (typeof value === "object" && Object.keys(value).length == 0) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }
);
