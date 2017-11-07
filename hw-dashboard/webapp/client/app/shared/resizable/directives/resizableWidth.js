define(function (require) {
    "use strict";

    require('jqueryUi');
    require('../ngModule').directive('resizableWidthContainer', [function () {
        return {
            restrict: 'A',
            controller: ['$scope', '$element', function ($scope, $element) {
                this.linkedSectionElements = [];
                this.linkedSectionWidth = '';
                this.selLinkedSectionWidth = function (width) {
                    this.linkedSectionWidth = width;
                    this.linkedSectionElements.forEach(function (el) {
                        el.css('width', width);
                    });
                };
                this.addLinkedSectionElement = function ($element) {
                    if (this.linkedSectionElements.indexOf($element) === -1) {
                        this.linkedSectionElements.push($element);
                    }
                    if (this.linkedSectionWidth) {
                        this.selLinkedSectionWidth(this.linkedSectionWidth);
                    }
                };
            }]
        };
    }])
        .directive('resizableWidthLinkedSection', [function () {
            return {
                restrict: 'A',
                require: '^resizableWidthContainer',
                link: function (scope, elem, attrs, resizableWidthLinkedSection) {
                    resizableWidthLinkedSection.addLinkedSectionElement(elem);
                }
            };
        }])
        .directive('resizableWidth', [function () {
            return {
                restrict: 'A',
                require: '^resizableWidthContainer',
                link: function (scope, elem, attrs, resizableWidthLinkedSection) {
                    scope.$watch(attrs.resizableWidthShowSection, function (visible) {
                        if (!visible) {
                            resizableWidthLinkedSection.selLinkedSectionWidth('100%');
                            elem.css('left', 0);
                        } else {
                            calculateAndSetSize();
                        }
                    });
                    elem.on({
                        resize: function () {
                            calculateAndSetSize();
                        },
                        resizestop: function (event) {
                            return event.stopPropagation();
                        }
                    });

                    function calculateAndSetSize() {
                        /**
                         * Adding "1" additional pixel to comply with non-fullwidth windows (like then DEVTools open)
                         */
                        resizableWidthLinkedSection.selLinkedSectionWidth("calc(100% - " + (elem.outerWidth() + 1) + "px)");
                        elem.css('left', 0);
                    }
                }
            };
        }]);
});
