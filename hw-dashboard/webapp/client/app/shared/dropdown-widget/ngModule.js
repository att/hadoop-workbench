/**
 * @license MIT http://jseppi.mit-license.org/license.html
 */
define(function (require) {
    "use strict";

    var angular = require("angular");

    var dd = angular.module('dap.shared.dropdownWidget', []);

    dd.run(['$templateCache', function ($templateCache) {
        $templateCache.put('ngDropdowns/templates/dropdownSelect.html', [
            '<div class="wrap-dd-select">',
            '<span class="selected" placeholder-text="{{placeholderText}}">{{dropdownModel}}</span>',
            '<ul class="dropdown">',
            '<li ng-repeat="item in dropdownSelect"',
            ' class="dropdown-item"',
            ' dropdown-select-item="item" is-selected="isItemSelected(item)"',
            ' dropdown-item-label="labelField">',
            '</li>',
            '</ul>',
            '</div>'
        ].join(''));

        $templateCache.put('ngDropdowns/templates/dropdownSelectItem.html', [
            '<li ng-class="{divider: (dropdownSelectItem.divider && !dropdownSelectItem[dropdownItemLabel]), \'divider-label\': (dropdownSelectItem.divider && dropdownSelectItem[dropdownItemLabel])}">',
            '<a href=""',
            ' ng-class="{\'is-selected\':isSelected()}"',
            ' ng-if="!dropdownSelectItem.divider"',
            ' ng-href="{{dropdownSelectItem.href}}"',
            ' ng-click="selectItem()">',
            '{{dropdownSelectItem[dropdownItemLabel]}}',
            '</a>',
            '<span ng-if="dropdownSelectItem.divider">',
            '{{dropdownSelectItem[dropdownItemLabel]}}',
            '</span>',
            '</li>'
        ].join(''));

    }]);

    dd.directive('dropdownSelect', ['DropdownService',
        function (DropdownService) {
            return {
                restrict: 'A',
                replace: true,
                scope: {
                    dropdownSelect: '=',
                    dropdownModel: '=',
                    dropdownOnchange: '&',
                    placeholderText: '@'
                },

                controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                    $scope.labelField = $attrs.dropdownItemLabel || 'text';

                    DropdownService.register($element);

                    this.select = function (selected) {
                        if (selected !== $scope.dropdownModel) {
                            $scope.dropdownModel = selected.value;
                        }
                        $scope.dropdownOnchange({
                            selected: selected
                        });
                    };

                    this.isItemSelected = function (item) {
                        return item.id === $scope.dropdownModel.id;
                    };

                    $element.bind('click', function (event) {
                        event.stopPropagation();
                        DropdownService.toggleActive($element);
                    });

                    $scope.$on('$destroy', function () {
                        DropdownService.unregister($element);
                    });
                }],
                templateUrl: 'ngDropdowns/templates/dropdownSelect.html'
            };
        }
    ]);

    dd.directive('dropdownSelectItem', [
        function () {
            return {
                require: '^dropdownSelect',
                replace: true,
                scope: {
                    dropdownItemLabel: '=',
                    dropdownSelectItem: '='
                },

                link: function (scope, element, attrs, dropdownSelectCtrl) {
                    scope.selectItem = function () {
                        if (scope.dropdownSelectItem.href) {
                            return;
                        }
                        dropdownSelectCtrl.select(scope.dropdownSelectItem);
                    };

                    scope.isSelected = function () {
                        return dropdownSelectCtrl.isItemSelected(scope.dropdownSelectItem);
                    };
                },

                templateUrl: 'ngDropdowns/templates/dropdownSelectItem.html'
            };
        }
    ]);

    dd.factory('DropdownService', ['$document',
        function ($document) {
            var body = $document.find('body'),
                service = {},
                _dropdowns = [];

            body.bind('click', function () {
                angular.forEach(_dropdowns, function (el) {
                    el.removeClass('active');
                });
            });

            service.register = function (ddEl) {
                _dropdowns.push(ddEl);
            };

            service.unregister = function (ddEl) {
                var index;
                index = _dropdowns.indexOf(ddEl);
                if (index > -1) {
                    _dropdowns.splice(index, 1);
                }
            };

            service.toggleActive = function (ddEl) {
                angular.forEach(_dropdowns, function (el) {
                    if (el !== ddEl) {
                        el.removeClass('active');
                    }
                });

                ddEl.toggleClass('active');
            };

            return service;
        }
    ]);

    return dd;

});