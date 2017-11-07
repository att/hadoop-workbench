define(function (require) {
    "use strict";

    const ng = require('angular');
    require('../ngModule').controller('contributors-widget.IndexController', Controller);

    Controller.$inject = [
        '$scope',
        '$dashboardWidget'
    ];

    function Controller($scope, $dashboardWidget) {
        $dashboardWidget.title = "Contributors";

        let nodes = [
            {
                name: 'Bala Esakkinathan',
                selected: false,
                icon: 'icon-settings-users',
                email: 'be3984@att.com',
                title: 'Director',
                pages: []
            }, {
                name: 'Thirumalai Devarajan',
                selected: false,
                icon: 'icon-settings-users',
                email: 'tk2908@att.com',
                title: 'Principal Software Engineer',
                pages: []
            }, {
                name: 'Mohan Giramkar',
                selected: false,
                icon: 'icon-settings-users',
                email: 'mg091e@att.com',
                title: 'Principal Software Engineer',
                pages: []
            }, {
                name: 'Param Thangavelu',
                selected: false,
                icon: 'icon-settings-users',
                email: 'pt949y@att.com',
                title: 'Big Data Architect',
                pages: []
            }, {
                name: 'Bala Sivalingam',
                selected: false,
                icon: 'icon-settings-users',
                email: 'bs606x@att.com',
                title: 'Big Data Architect',
                pages: []
            }, {
                name: 'Vasyl Vozdroganov',
                selected: false,
                icon: 'icon-settings-users',
                email: 'vv088t@att.com',
                title: 'Hadoopworkbench Developer',
                pages: []
            }, {
                name: 'Roman Lozovyk',
                selected: false,
                icon: 'icon-settings-users',
                email: 'rl216c@att.com',
                title: 'Hadoopworkbench Developer',
                pages: []
            }, {
                name: 'Shushma Rai',
                selected: false,
                icon: 'icon-settings-users',
                email: 'sr029e@att.com',
                title: 'Senior QA',
                pages: []
            }, {
                name: 'Don Toy',
                selected: false,
                icon: 'icon-settings-users',
                email: 'dt2161@att.com',
                title: 'Technical Project Manager',
                pages: []
            }
        ];


        ng.extend($scope, {
            nodes: nodes
        });


    }
});
