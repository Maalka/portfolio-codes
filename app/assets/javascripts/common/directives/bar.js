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
      templateUrl: function(){
             return 'javascripts/common/partials/split_bar.html';
      },
      link: function(scope, element){

        function connectLegends(current){
            var siblingChart=angular.element(element).parent().parent().find('.highcharts-container._energy').parent().highcharts();
          var currentChart=current;
          //if the chart legend is visible, if its not it was selected
          //so it should be hidden
          if(current.visible){
            siblingChart.series.forEach(function(item){
              if(item.name===currentChart.name){
                  item.hide();
              }
            });
          }else{
            siblingChart.series.forEach(function(item){
              if(item.name===currentChart.name){
                  item.show();
              }
            });
          }

          return true;
        }

        var options = {
          chart: {
            className:scope.options.id,
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
                    connectLegends(this);
                  }
              }
            }
          },
          tooltip: {
            shared: false,
            useHTML: true,
            formatter: function() {
            if(this.series.name===("differences"+scope.options.id)){
              return false;
            }
                return '<b>' + this.x + '</b><br/>' +
                  this.point.name+': '+Math.round(this.y)+' '+scope.options.axislabel+'<br/>'+
                  'Total: '  + Math.floor((this.point.scenario).toFixed(2)) + ' '+scope.options.axislabel+ '<br/>' +
                  'Total Base: ' + Math.floor((this.point.base).toFixed(2))+' '+scope.options.axislabel;
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
        var index;

        function createSeries() {
          index = 1;
          var legendIndex=0;
          for (var propEnergy in $scope.data) {
            if (propEnergy !== 'net') {
               var modelEnergy = {
                name: $scope.data[propEnergy][0].name,
                id: propEnergy+$scope.options.id,
                data: $scope.data[propEnergy],
                color: $scope.data[propEnergy][0].color,
                index: index,
                showInLegend:$scope.options.showInLegend[legendIndex++],
                linkedTo:$scope.options.linkedTo,
                stack:$scope.options.id,
                borderWidth: 0
              };
              index++;
             series.push(modelEnergy);
            }
          }
        }
        //show/hide data labels based on if data is present
        function showHideDataLabels(){
          var labelOptions= {
                enabled: $scope.options.enableLabels,
                 align:'left',
                 useHTML: true,
                 style: {
                   fontSize: '10px',
                   paddingLeft: '10px',
                 },
                formatter:function(){
                  return Math.round((((Math.round(this.y*100))/100))*100)+' %';
                }
            };
            if($scope.options.showLabels){
              labelOptions.color="#000000";
            }else{
              labelOptions.color="rgba(255, 255, 255, 0)";
            }
          return labelOptions;
        }
        function addInDifferences(){
            var differences = {
             name: 'differences'+$scope.options.id,
             id: 'differences'+$scope.options.id,
             data: $scope.differences,
             color: '#FFFFFF',
             showInLegend:false,
             stack:$scope.options.id,
             index:0,
             dataLabels:showHideDataLabels(),
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
