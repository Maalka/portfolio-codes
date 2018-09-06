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
            restrict: 'A',
            scope: {
                csvData: '=data'
            },
            templateUrl: "javascripts/common/partials/files.html",
            controller: ["$scope", "$element", "$timeout", "playRoutes",
                function ($scope, $element, $timeout, playRoutes) {

                $scope.uploadText = "Upload your CA ZERO Code .CSV File exported from CBECC-Com";

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

                $scope.computeMetrics = function () {

                    var parsedData = JSON.parse($scope.dataTemp.data);

                    $scope.csvData.siteMetrics = $scope.getPropResponseField(parsedData,"siteMetrics");
                    $scope.csvData.sourceMetrics = $scope.getPropResponseField(parsedData,"sourceMetrics");
                    $scope.csvData.tdvMetrics = $scope.getPropResponseField(parsedData,"tdvMetrics");
                    $scope.csvData.carbonMetrics = $scope.getPropResponseField(parsedData,"carbonMetrics");
                    $scope.csvData.projectMetrics = $scope.getPropResponseField(parsedData,"projectMetrics");


                    $scope.loading = false;


                    $timeout(function () {
                        $scope.loadingFileFiller = {};
                    }, 1000);

                };

                $scope.loadingFileFiller = {};
                $scope.loading = false;

                $scope.upload = function (file) {
                    $scope.uploadText = "File Uploaded Successfully";
                    $scope.loading = true;
                    Upload.upload({

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

                        $scope.dataTemp = data;
                        $scope.computeMetrics();



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