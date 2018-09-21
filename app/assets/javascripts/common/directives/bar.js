/**
 * A building property directive
 * changes form inputs based on property type
 * and supports multiple property types
 */
define(['angular', 'highcharts', './main'], function(angular) {
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
        options: '=',
        categories:'='

      },

      template: '<div id="container" style=";margin:0 auto;"></div>',
      link: function(scope, element) {

        var options = {
          chart: {
            type: 'bar',
            marginTop: 50,
            marginBottom: 70,
            height: scope.height

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
            },
            bar: {
              maxPointWidth: 40,
              pointPadding: 0
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

          title: {
            text: ''
          },
          xAxis: {
            categories: scope.categories,
            labels: {
              style: {
                fontSize: '11px',
                fontWeight: 100
              },
              enabled:scope.options.label

            }
          },
          series: scope.series
        };
        angular.element(element).highcharts(options);


      },
      controller: ["$scope", function($scope) {
        var series = [];
        var colors = ['#1F2C5C', '#3F58CE', '#5D70D4', '#08B4BB', '#6BD2D6', '#06A1F9', '#0579BB', '#F5B569', '#EB885C', '#D4483D', '#64467D', '#9A6ECE','#06AED5','#564787','#FDE74C'];
        var index;
        function createSeries() {
          index = 0;
          for (var propEnergy in $scope.data) {
            if (propEnergy !== 'net') {
              var modelEnergy = {
                name: propEnergy,
                id: propEnergy+'_energy',
                data: $scope.data[propEnergy],
                color: colors[index++],
                showInLegend: true,
                borderWidth: 0
              };
              series.push(modelEnergy);
            }
          }
        }
        createSeries();
        $scope.series = series;

        $scope.height = $scope.categories.length*10+240;
      }]
    };
  }]);
});
