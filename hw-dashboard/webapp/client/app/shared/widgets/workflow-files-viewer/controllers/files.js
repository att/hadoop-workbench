/*jshint maxcomplexity: 9*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('shared.filesViewerController', Controller);

    Controller.$inject = [
        '$scope',
        'savedFiles',
        'stagedFiles'
    ];
    /**
     *
     * @param $scope
     * @param {{title: string, sections: Array.<{title: string, icon: string, items: Array.<string>}>}}savedFiles
     * @param {{title: string, sections: Array.<{title: string, icon: string, items: Array.<string>}>}}stagedFiles
     * @constructor
     */
    function Controller($scope, savedFiles, stagedFiles) {
        ng.extend($scope, {
            saved: {
                title: savedFiles.title,
                sections: []
            },
            staged: {
                title: stagedFiles.title,
                sections: []
            }
        });

        init();

        function init() {
            savedFiles.sections.forEach(function (obj, index) {
                var section = {
                    title: obj.title,
                    icon: obj.icon,
                    items: obj.items,
                    isExpanded: obj.length > 0
                };
                section.expand = function (val) {
                    section.isExpanded = !!val;
                };
                $scope.saved.sections[index] = section;
            });
            stagedFiles.sections.forEach(function (obj, index) {
                var section = {
                    title: obj.title,
                    icon: obj.icon,
                    items: obj.items,
                    isExpanded: obj.length > 0
                };
                section.expand = function (val) {
                    section.isExpanded = !!val;
                };
                $scope.staged.sections[index] = section;
            });
        }
    }
});
