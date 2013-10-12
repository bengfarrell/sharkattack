app.controller('RadioController', function($scope, $http) {
    $scope.refreshPlayHistory = function() {
        $http.get("../stream/nowplaying.json").
            success(function(data) {
                $scope.playHistory = data;
            }).
            error(function(data) {
                console.log("err: " + data)
            });
    }
    $scope.refreshPlayHistory();
    setInterval($scope.refreshPlayHistory, 5000);

    $http.get("../../about.json").
        success(function(data) { $scope.about = data; }).
        error(function(data) { console.log("err: " + data) });
});