app.controller('SourcesController', function($scope, $http) {
    $scope.app = app;

    $http.get("../../data/feed-library.json").
        success(function(data) {
            $scope.sources = data.sources;
        }).
        error(function(data) {
            console.log("err: " + data)
        });

    /**
     * model has been updated - save data
     */
    $scope.save = function() {
        var srcs = { "sources": angular.copy($scope.sources) };
        app.save($http, srcs, '../../save/sources');
    }
});