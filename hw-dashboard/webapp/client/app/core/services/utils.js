define(function (require) {
    "use strict";
    var $ = require('jquery');
    require('jqueryCaret');

    var ng = require("angular");
    require('../ngModule').provider('core.utils', utilsProvider);

    function utilsProvider() {
        this.$get = UtilsService;
    }
    UtilsService.$inject = ['$window'];

    function UtilsService ($window) {
        return new utils();

        function utils() {

            /*
             description: returns index of searched Object in Array of Objects
             in: Array searchArray , Object searchObject
             out: position searched Object in Array, or -1
             example: var idx = utils.objectInArray([{object}, {object}, ... {object}], {object})
             */
            this.objectInArray = function (searchArray, searchObject) {
                for (var i = 0, len = searchArray.length; i < len; i++) {
                    if (JSON.stringify(searchArray[i]) === JSON.stringify(searchObject) ) {
                        return i;
                    }
                }
                return -1;
            };

            this.objectInArrayByField = function (searchArray, searchField, searchValue) {
                // TODO: need to refactor, please do not use this method yet
                // not used now
                var res;
                for (var i = 0, len = searchArray.length; i < len; i++) {
                    if (!res) {
                        res = _findField(searchArray[i], searchField, searchValue);
                    }
                }
                return res;

                function _findField(obj, fld, val) {
                    var res;
                    Object.keys(obj).filter(function(item) {
                        if (typeof obj[item] == 'object') {
                            res = _findField(obj[item], fld, val);
                            if (res) {
                                res = obj;
                            }
                        } else if (item == fld && obj[item] == val) {
                            res = obj;
                        }
                    });
                    return res;
                }
            };

            this.clipboard = function() {

                var Clipboard = function() {

                    var _copiedData;
                    // data stores in $window.localStorage.clipboard

                    this.hotkeyBindings = function(cbs) {

                        if (typeof cbs != 'object') {

                            return [];

                        } else {

                            return [
                                {
                                    key: "mod+c",
                                    preventDefault: true,
                                    cb: (cbs && typeof cbs.copySelection == 'function') ? cbs.copySelection : function(){}
                                },
                                {
                                    key: "mod+v",
                                    preventDefault: true,
                                    cb: (cbs && typeof cbs.pasteSelection == 'function') ? cbs.pasteSelection : function(){}
                                },
                                {
                                    key: "escape",
                                    preventDefault: true,
                                    cb: (cbs && typeof cbs.clearSelection == 'function') ? cbs.clearSelection : function(){}
                                },
                                {
                                    key: "del",
                                    preventDefault: true,
                                    cb: (cbs && typeof cbs.deleteNode == 'function') ? cbs.deleteNode : function(){}
                                }
                            ];

                        }
                    };

                    this.save = function (data, section) {
                        section = section || 'common';

                        var _object = {};
                        _object[section] = data;
                        $window.localStorage.clipboard = JSON.stringify(_object);
                    };

                    this.restore = function (keepCopiedData, section) {
                        section = section || 'common';

                        var _object = JSON.parse($window.localStorage.clipboard || '{}');
                        _object = _object[section];

                        if (!keepCopiedData) {
                            delete $window.localStorage.clipboard;
                        }

                        return _object || false;
                    };

                    this.isEmptyClipboard = function(section) {
                        section = section || 'common';

                        var _object = JSON.parse($window.localStorage.clipboard || '{}');
                        return (_object[section] && !ng.equals({}, _object[section])) ? false : true;
                    };

                    this.clean = function(section) {
                        section = section || 'common';

                        var _object = JSON.parse($window.localStorage.clipboard || '{}');
                        delete _object[section];

                        $window.localStorage.clipboard = JSON.stringify(_object);
                    };

                };

                return new Clipboard();
            };

            /**
             * Works with <input> and contenteditable elements
             * @param domElement
             * @returns {*|jQuery}
             */
            this.getCaretPosition = function (domElement) {
                if (domElement) {
                    var pos = $(domElement).caret('pos');
                }
                return pos;
            };

            /**
             *  Works with <input> and contenteditable elements
             * @param domElement
             * @param position
             */
            this.setCaretPosition = function (domElement, position) {
                if (domElement) {
                    $(domElement).caret('pos', position);
                }
            };

            /**
             * Set caret position to the end of passed dom-element
             *  dom-element is element[0]
             *
             *
             * @param {object} el
             * @param {number} desiredCaretPosition [optional]
             */
            this.focusAndSetCaretTo = function (el, desiredCaretPosition) {
                var isSetToEnd = desiredCaretPosition === undefined;
                var textElement = el && el[0] && el[0].childNodes && el[0].childNodes[0];

                if (!textElement) {
                    if (el) {
                        el.focus();
                    }
                    return;
                }
                var range = $window.document.createRange();
                var sel = $window.getSelection();
                el.focus();

                var endPosition = el[0].childNodes[0].length;
                // 1
                // 0 1 2 3 4 5 6

                if (!isSetToEnd) {
                    if (desiredCaretPosition < endPosition) {
                        endPosition = desiredCaretPosition;
                    }
                }
                range.setStart(el[0].childNodes[0], endPosition);

                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                el.focus();
            };

            this.focusAndSetCaretToEnd = function (el) {
                var textElement = el && el[0] && el[0].childNodes && el[0].childNodes[0];

                if (!textElement) {
                    if (el) {
                        el.focus();
                    }
                    return;
                }
                var range = window.document.createRange();
                var sel = window.getSelection();
                el.focus();
                range.setStart(el[0].childNodes[0], el[0].childNodes[0].length);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                el.focus();
            }

        }
    }
});
