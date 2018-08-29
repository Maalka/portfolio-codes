/**
 * A directive
 * for uploading
 * CSV files
 */
define(['angular', './main', 'angular-file-upload'], function(angular) {
    'use strict';
    var mod = angular.module('common.directives');

    mod.directive('files', ['$log', 'errorPopoverService', 'playRoutes', 'Upload', '$q', function ($log, errorPopover, playRoutes, Upload, $q) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: "javascripts/common/partials/files.html",
            controller: ["$scope", "$element", "$timeout", "playRoutes",
                function ($scope, $element, $timeout, playRoutes) {
                $scope.searchInput = "";

                $scope.submitFile = function() {
                    $scope.error = undefined;
                    if ($scope.attachment) {
                        $scope.futures = $scope.upload($scope.attachment);

                    $q.resolve($scope.futures).then(function (results) {
                          console.log(results);
                      });

                    }
                };


                $scope.loadingFileFiller = {};
                $scope.loading = false;

                $scope.upload = function (file) {
                    $scope.loading = true;
                    Upload.upload({
                        responseType: "arraybuffer",
                        url: playRoutes.controllers.CSVController.upload().url,
                        cache: false,
                        headers: {
                            'Content-Type': 'application/zip; charset=utf-8'
                        },
                        //headers: [{name:'Accept', value:'application/json'}],
                        transformResponse: function (data) {
                            //The data argument over here is arraybuffer but $http returns response
                            // as object, thus returning the response as an object with a property holding the
                            // binary file arraybuffer data


                            var response = {};
                            response.arrayBuffer = data;
                            return response;
                        },
                        data: {
                            attachment: file
                        }
                    }).then(function (resp) {


                        console.log(resp.data);
                        $scope.loading = false;

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