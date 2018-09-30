/**
 * A building property directive
 * changes form inputs based on property type
 * and supports multiple property types
 */
define(['angular', './main', 'highcharts'], function(angular) {
  'use strict';
  var mod = angular.module('common.directives');
  mod.directive('bar', [function() {
    return {

      restrict: 'E',
      //define the scope property, pass data through into this directive
      //isolate scope, the directive has its own scope, not the same as the scope in the html
      //get scope data off html and map it onto this scope
      replace:true,
      scope: {
        //mapping scope into isolate scope
        //key value pairs, to give this scope data
        //passing in data and bnding data
        data: '=',
        differences:'=',
        options: '=',
        categories:'='

      },
      template:'<div id="container"></div>',
      link: function(scope, element){
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
      legend:{
       align: 'right',
       verticalAlign: 'top',
       layout: 'vertical',
            itemStyle: {
                lineHeight: '14px'
            }
        },
          plotOptions: {
            series: {
              stacking: 'normal'
            },
            bar: {
              maxPointWidth: 40,
              pointPadding: 0,
              events: {
                  legendItemClick: function () {
                      return false;
                  }
              }
            }
          },
          tooltip: {
            shared: false,
            useHTML: true,
            formatter: function() {
              console.log(this.point,'thispoint');

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
        var chart;
          angular.element(element).highcharts(options, function () {
              chart=this;
              scope.containerW=chart.containerWidth;
          });

          scope.$watch('containerW',function(){
            //on a container width change redraw the chart
              redraw();
          });
        //redraw the highcharts and set it to the contrainer width on resize
        function redraw(){
          chart.isDirtyBox=true;
          chart.chartWidth=chart.containerWidth;
          chart.reflow();
          chart.redraw();
        }
      },
      controller: ["$scope",function($scope) {


        var series = [];
        var colors = ['#FFF','#1F2C5C', '#3F58CE', '#5D70D4', '#08B4BB', '#6BD2D6', '#06A1F9', '#0579BB', '#F5B569', '#EB885C', '#D4483D', '#64467D', '#9A6ECE','#06AED5','#564787','#000000','#000000'];
        var index;

        function createSeries() {
          index = 1;
          for (var propEnergy in $scope.data) {
            if (propEnergy !== 'net') {
               var modelEnergy = {
                name: propEnergy,
                id: propEnergy+$scope.options.id,
                data: $scope.data[propEnergy],
                color: colors[index],
                index: index,
                showInLegend:$scope.options.showInLegend,
                linkedTo:$scope.options.linkedTo,
                stack:$scope.options.id,
                borderWidth: 0
              };
              index++;
             series.push(modelEnergy);
            }
          }
        }

        function addInDifferences(){
            var differences = {
             name: 'differences'+$scope.options.id,
             id: 'differences'+$scope.options.id,
             data: $scope.differences,
             color: '#DCDCDC',
             showInLegend:false,
             stack:$scope.options.id,
             index:0,
             dataLabels: {
                   enabled: $scope.options.showLabels,
                   align: 'left',
                   color: '#000000',
                   x: 20
               },
             borderWidth: 0
            };
            series.push(differences);

        }
        createSeries();
        addInDifferences();
        $scope.series = series;
        $scope.height = $scope.categories.length*10+360;
      }]
    };
  }]);
});
