define(function (require) {
    "use strict";

    require('../../ngModule').controller('deploy-component.wizards.base.clusterController', clusterController);

    clusterController.$inject = [
        '$scope',
        '$widgetParams',
        'clusters'
    ];

    function clusterController($scope, $widgetParams, clusters) {
        $scope.data = $widgetParams.data;
        $scope.stepNumber = $widgetParams.stepNumber;
        $scope.searchString = '';
        $scope.clustersFiltered = [];
        $scope.clusters = clusters;
        $scope.selectCluster = function (cluster) {
            $scope.data.cluster = cluster;
            $scope.$emit('next-step.deploy-component-service');
        };
        $scope.$watch('searchString', function (searchString) {
            var list = $scope.clusters.filter((clusterInfo) =>
                clusterInfo.id.toLowerCase().includes(searchString.toLowerCase())
            );
            $scope.clustersFiltered.splice(0);
            $scope.clustersFiltered.push.apply($scope.clustersFiltered, list);
        });

        $scope.showValidationErrors = false;
        $scope.$watch(()=> $widgetParams.showValidationErrors(), (show)=> {
            $scope.showValidationErrors = show;
        });

        let {deploymentDescriptor: {clusterId: preselectedClusterId = false} = {}} = $scope.data;
        let [preselectedCluster = false] = clusters.filter(({id}) => id === preselectedClusterId);
        if (preselectedClusterId !== false) {
            $scope.selectCluster(preselectedCluster);
        }

    }
});
