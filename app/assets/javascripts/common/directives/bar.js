/**
 * A building property directive
 * changes form inputs based on property type
 * and supports multiple property types
 */
define(['angular','highcharts', './main'], function(angular) {
  'use strict';

  var mod = angular.module('common.directives');

  mod.directive('bar', [function() {
      return {

          restrict: 'E',
          //define the scope property, pass data through into this directive
          //isolate scope, the directive has its own scope, not the same as the scope in the html
          //get scope data off html and map it onto this scope
          replace: true,
          scope: {
            //mapping scope into isolate scope
            //key value pairs, to give this scope data
            //passing in data and bnding data
            data: '=',
            options:'='

          },template:'<div style="width:500px;height:500px;"></div>',
          link:function(scope,element){

            var options = {
              chart: {
                  type: 'bar',
                  margin: 100
                  },
                    title: {
                        text: scope.buildingName
                    },
                    xAxis: {
                        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                    },
                    series: [{
                        data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
                    }]
                };
            angular.element(element).highcharts(options);


      },
          controller: ["$scope",  function ($scope) {
            //have access to enduses on the scope
            var buildingName=[];
            var totalEuiList;
            var totalEnergyList;
            $scope.options.prop_types.forEach(function(term){
              if(term.building_name!==undefined){
                console.log(term);
                buildingName.push(term.building_name);

              }
            });

            $scope.data.values.forEach(function(term){

                if(term.total_eui_list!==undefined){

                    for(var i=0;i<term.total_eui_list.length;i++){
                      totalEuiList=term.total_eui_list[i];
                      console.log(totalEnergyList);
                    }
                }

            });
            $scope.data.values.forEach(function(term){

                if(term.total_energy_list!==undefined){
                  for(var i=0;i<term.total_energy_list.length;i++){
                    totalEnergyList=term.total_energy_list[i];
                    console.log(totalEnergyList);

                  }
                }
            });

            $scope.buildingName=buildingName;
            $scope.totalEuiList=totalEuiList[buildingName];
            $scope.totalEnergyList=totalEnergyList[buildingName];




          }]
        };
  }]);
});
