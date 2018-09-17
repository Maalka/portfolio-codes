/**
 * A building property directive
 * changes form inputs based on property type
 * and supports multiple property types
 */
define(['angular','./main'], function(angular) {
  'use strict';

  var mod = angular.module('common.directives');

    mod.directive('buildingInfo', [function() {
        return {
            restrict: 'A',
            scope: {
                sizeDefault: '=funner',
                model: '=model',
                forms: '=forms'

            },

            templateUrl: function(){
                   return 'javascripts/common/partials/property_fields.html';
            },

            controller: ["$scope", function ($scope) {

                $scope.buildingName =  ($scope.model.name) ? $scope.model.name : "Anonymous";
                console.log($scope.sizeDefault);

                $scope.benchmark = $scope.$parent;
                $scope.propFieldsRequired = false;
                $scope.propertyModel = {};
                $scope.model.propertyModel = $scope.propertyModel ;
                $scope.model.propertyModel.floor_area_units = "ftSQ";
                $scope.model.propertyModel.building_type = $scope.model.type;
                $scope.model.valid = false;

                $scope.buildingProperties = {
                    areaUnits: [
                            {id:"ftSQ",name:"sq.ft"},
                            {id:"mSQ",name:"sq.m"}
                    ],
                    buildingSizes: [
                        {name:"Very Small", floor_area:5000, floor_area_units:"ftSQ"},
                        {name:"Small", floor_area:15000, floor_area_units:"ftSQ"},
                        {name:"Medium", floor_area:25000, floor_area_units:"ftSQ"},
                        {name:"Medium-Large", floor_area:50000, floor_area_units:"ftSQ"},
                        {name:"Large", floor_area:100000, floor_area_units:"ftSQ"},
                        {name:"Very Large", floor_area:250000, floor_area_units:"ftSQ"}
                    ]
                };

                $scope.$watch("forms.baselineForm.$valid", function (validity) {
                    $scope.model.valid = validity;
                });

                $scope.removeProp = function() { 
                    $scope.$parent.removeProp(this);
                };

                $scope.$watch("forms.baselineForm.$valid", function () {
                    if($scope.forms.baselineForm.$valid){
                        $scope.propFieldsRequired = false;
                    } else {
                        $scope.propFieldsRequired = true;
                    }
                });
            }]
        };
    }]);



  return mod;
});


