/**
 * A building property directive
 * changes form inputs based on property type
 * and supports multiple property types
 */
define(['angular', 'highcharts','maalkaflags', './main'], function(angular) {
  'use strict';
  var mod = angular.module('common.directives');
  mod.directive('negative', [function() {
    return {
      restrict: 'E',
      //define the scope property, pass data through into this directive
      //isolate scope, the directive has its own scope, not the same as the scope in the html
      //get scope data off html and map it onto this scope
      replace: false,
      scope: {
        //mapping scope into isolate scope
        //key value pairs, to give this scope data
        //passing in data and bnding data
        eui: '=',
        energy:'=',
        options: '=',
        categories:'='

      },
      template: '<div></div>',
      link: function(scope, element) {

        var options={
            chart: {
                type: 'bar'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: scope.categories,

            },
            yAxis: {
              min: 0,
              gridLineColor: 'transparent',
              gridLineWidth: 0,
              lineWidth: 1,
              title: {
                useHTML:true,
                text: scope.options.axislabel
              }
            },
            plotOptions: {
                series: {
                    stacking: 'normal'
                }
            },
            tooltip: {
              shared: false,
              useHTML: true,
              formatter: function() {
                  return '<b>' + this.x + '</b><br/>' +
                    this.series.name + ': ' + this.y + ' '+scope.options.axislabel+ '<br/>' +
                    'Total: ' + this.point.stackTotal;
              }
            },
            series: scope.series
        };

      angular.element(element).highcharts(options);
      },
      controller: ["$scope","$element",function($scope,$element) {
        var series = [];
        var colors = ['#1F2C5C', '#3F58CE', '#5D70D4', '#08B4BB', '#6BD2D6', '#06A1F9', '#0579BB', '#F5B569', '#EB885C', '#D4483D', '#64467D', '#9A6ECE','#06AED5','#564787','#FDE74C'];
        var index;
        console.log($scope,'scope');

        function negate(array){
          var negativeArray=[];
          for(var i=0;i<array.length;i++){
            negativeArray.push(-Math.abs(array[i]));
          }
          return negativeArray;
        }

        function createSeries() {
          index = 0;
          for (var propEui in $scope.eui) {
            if (propEui !== 'net') {
              var modelEui = {
                name: propEui,
                id: propEui+'_eui',
                stack:'eui',
                data: negate($scope.eui[propEui]),
                color: colors[index++],
                borderWidth: 0
              };
              series.push(modelEui);
          }
        }
        index = 0;
        for (var propEnergy in $scope.energy) {
          if (propEnergy !== 'net') {
            var modelEnergy = {
              name: propEnergy,
              id: propEnergy+'_energy',
              stack:'energy',
              data: $scope.energy[propEnergy],
              color: colors[index++],
              borderWidth: 0
            };
            series.push(modelEnergy);
        }
      }
    }


       createSeries();
       console.log(JSON.stringify(series),'series');

       console.log(series,'series');
        $scope.series = series;
        $scope.height = $scope.categories.length*10+360;
        console.log($element);
      }]
    };
  }]);
});
