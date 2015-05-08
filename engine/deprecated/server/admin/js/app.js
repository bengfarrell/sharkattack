var app = angular.module('app', []);

app.directive('ngHeadernav', function(){
    return {
        restrict: 'E',
        templateUrl: 'templates/navbar.html',
        controller: function($scope, $http, $attrs) {
            $scope.subhead = $attrs.name;
            $http.get("../../about.json").
                success(function(data) { $scope.about = data; }).
                error(function(data) { console.log("err: " + data) });
        }
    };
});

app.deleteItem = function(items, myitem) {
    for (var c = 0; c < items.length; c++) {
        if (items[c].$$hashKey == myitem.$$hashKey) {
            items.splice(c, 1);
        }
    }
}

app.addItem = function(items, parent, propname) {
    if (!items) {
        parent[propname] = [];
        parent[propname].push({});
        return;
    }
    items.push({});
}

app.save = function(service, data, url) {
    var data = JSON.stringify( data, null, "\t");
    service({
        url: url,
        method: "POST",
        data: data,
        headers: {'Content-Type': 'application/json'}
    }).success(function (data, status, headers, config) {
            console.log("Success");
        }).error(function (data, status, headers, config) {
            console.log("Error");
        });
}