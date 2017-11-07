/*jshint maxparams: 13*/
define(function (require) {
    "use strict";

    var ng = require('angular');
    require('../ngModule').controller('userSettings.pages.SettingsNodesPageController', Controller);

    Controller.$inject = [
        '$scope',
        '$widgetParams',
        'dashboard.models.TabPage',
        'usersData',
        'rolesList',
        'currentUser',
        'userSettingsReadAccess'
    ];
    function Controller($scope, $widgetParams, TabPage, usersData, rolesList, currentUser, userSettingsReadAccess) {
        let nodes = [
            {
                title: 'Preferences',
                selected: false,
                icon: 'icon-settings-system',
                pages: [
                    {
                        name: 'user-settings.pages.user-settings-properties',
                        title: '',
                        icon: 'b-user-settings__properties-widget__icon'
                    }
                ]
            }
        ];

        if (userSettingsReadAccess) {
            nodes.push({
                title: 'Users',
                selected: false,
                icon: 'icon-settings-users',
                pages: [
                    {
                        name: 'user-settings.pages.users-settings-properties',
                        title: '',
                        icon: 'b-users-settings__properties-widget__icon',
                        params: {usersData, rolesList, currentUser}
                    },
                ]
            });
        }
        ng.extend($scope, {
            nodes: nodes
        });

        ng.extend($scope, {
            selectNode: function (node) {
                $scope.nodes.forEach(function (n) {
                    n.selected = false;
                });
                node.selected = true;

                $widgetParams.page.rightTabManager.clear();

                node.pages.forEach((page) => {
                    $widgetParams.page.rightTabManager.addTab(TabPage.factory({
                        active: true,
                        name: page.name,
                        params: page.params
                    }), page.title, '', page.icon, false);
                });

                $widgetParams.page.rightTabManager.setActive(0);
            }
        });

        init();

        function init() {
            var selectedNode = $scope.nodes.filter(function (n) {
                    return n.selected;
                })[0] || $scope.nodes[0];
            if (selectedNode) {
                $scope.selectNode(selectedNode);
            }
        }
    }
});
