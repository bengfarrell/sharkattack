app.controller('PlaylistController', function($scope, $http) {

    $scope.app = app;

    $http.get("../../data/playlist-script.json").
        success(function(data) {
            $scope.playlist = data;
        }).
        error(function(data) {
            console.log("err: " + data)
        });

    /**
     * move up
     * @param item
     */
    $scope.moveUp = function(items, myitem) {
        for (var c = 0; c < items.length; c++) {
            if (items[c].$$hashKey == myitem.$$hashKey) {
                items.splice(c, 1);
                items.splice(c-1, 0, myitem);
                return;
            }
        }
    }

    /**
     * move down
     * @param item
     */
    $scope.moveDown = function(items, myitem) {
        for (var c = 0; c < items.length; c++) {
            if (items[c].$$hashKey == myitem.$$hashKey) {
                items.splice(c, 1);
                items.splice(c+1, 0, myitem);
                return;
            }
        }
    }

    /**
     * model has been updated - save data
     */
    $scope.save= function() {
        var show = angular.copy($scope.playlist);
        app.save($http, show, '../../save/show');
    }
});