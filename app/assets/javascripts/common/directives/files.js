/**
 * A directive
 * for uploading
 * CSV files
 */
define(['angular', './main', 'angular-file-upload'], function(angular) {
    'use strict';
    var mod = angular.module('common.directives');

    mod.directive('files', ['$log', 'errorPopoverService', 'playRoutes', 'Upload', function ($log, errorPopover, playRoutes, Upload) {
        return {
            restrict: 'E',
            scope: {
                csvData: '=data'
            },
            templateUrl: "javascripts/common/partials/files.html",
            controller: ["$scope", "$element", "$timeout", "playRoutes",
                function ($scope, $element, $timeout, playRoutes) {
                $scope.searchInput = "";

                $scope.submitFile = function() {
                    $scope.error = undefined;
                    if ($scope.attachment) {
                        $scope.futures = $scope.upload($scope.attachment);

                    }
                };

                $scope.getPropResponseField = function(propResponse,key){
                    var returnValue;

                    for (var i =0; i < propResponse.values.length; i ++) {
                        if (propResponse.values[i][key] !== undefined) {
                          returnValue = propResponse.values[i][key];
                          break;
                        }
                    }
                    return returnValue;
                };


                $scope.loadingFileFiller = {};
                $scope.loading = false;

                $scope.upload = function (file) {
                    $scope.loading = true;
                    Upload.upload({
                        //responseType: "arraybuffer",
                        //headers: {
                        //  'Content-Type': 'application/zip; charset=utf-8'
                        //},
                        url: playRoutes.controllers.CSVController.upload().url,
                        cache: false,

                        headers: [{name:'Accept', value:'application/json'}],
                        transformResponse: function (data) {
                            //The data argument over here is arraybuffer but $http returns response
                            // as object, thus returning the response as an object with a property holding the
                            // binary file arraybuffer data

                            return data;
                        },
                        data: {
                            attachment: file
                        }
                    }).then(function (data) {


                        var parsedData = JSON.parse(data.data);
                        $scope.data.siteMetrics = $scope.getPropResponseField(parsedData,"siteMetrics");
//                        $scope.data.sourceMetrics = $scope.getPropResponseField(data.data,"sourceMetrics");
//                        $scope.data.tdvMetrics = $scope.getPropResponseField(data.data,"tdvMetrics");
//                        $scope.data.carbonMetrics = $scope.getPropResponseField(data.data,"carbonMetrics");



//                        console.log($scope.data.sourceMetrics);
//                        console.log($scope.data.tdvMetrics);
//                        console.log($scope.data.carbonMetrics);


                        $scope.loading = false;

                        $scope.csvData = data.data;

                        $timeout(function () {
                            $scope.loadingFileFiller = {};
                        }, 1000);

                    }).catch(function (resp) {
                        $scope.loading = false;
                        if (resp.status === 400) {
                            var message = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(resp.data.arrayBuffer)));
                            $scope.error = {
                                'messageType': "Error",
                                'messageDescription': message.response
                            };
                        } else {
                            $scope.error = {
                                'messageType': "Error",
                                'messageDescription': "There is an error with the bulk csv that you are uploading.  Please make sure that the file contains all of the fields that are required"
                            };

                        }
                    });
                 };





            }]
        };
    }]);
});