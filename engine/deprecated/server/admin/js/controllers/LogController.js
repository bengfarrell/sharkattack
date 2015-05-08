app.controller('LogController', function($scope, $http) {
    $http.get("../../logfiles.json").
        success(function(data) {
            $scope.logs = data;
            $scope.logTypes = [];
            for (type in data) {
                if ($scope.logTypes.indexOf(data[type].type) == -1) {
                    $scope.logTypes.push(data[type].type);
                }
            }
        }).
        error(function(data) {
            console.log("err: " + data)
        });

    $scope.loadLog = function(file) {
        $scope.currentFile = file;
        $scope.logData = "loading...";
        $http.get("../../data/" + file).
            success(function(data) {
                if (file.indexOf(".json") > -1) {
                    $scope.logData = PR.prettyPrintOne(JSON.stringify(data, null, '\t'));
                } else {
                    $scope.logData = PR.prettyPrintOne(data);
                }
            }).
            error(function(data) {
                console.log("err: " + data)
            });
    }

    $scope.gup = function(name){
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( window.location.href );
        if( results == null )    return "";
        else    return results[1];
    }

    $scope.currentLogType = $scope.gup("type");
    $scope.currentFile = "choose a file...";
});