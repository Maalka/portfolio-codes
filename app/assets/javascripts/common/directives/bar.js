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
        options: '='

      },
      template: '<div style="width:100%;height:100%;"></div>',
      link: function(scope, element) {

        var options = {
          chart: {
            type: 'bar'

          },
          labels: {
            style: {
              fontSize: '11px',
              fontWeight: 100
            }
          },
          tooltip: {
            formatter: function() {
              return '<b>' + this.x + '</b><br/>' +
                this.series.name + ': ' + this.y + '<br/>' +
                'Total: ' + this.point.stackTotal;
            }
          },
          legend: {
            reversed: true,
            symbolWidth: 10,
            symbolHeight: 10,
            itemDistance: 10,
            padding: 3,

            itemStyle: {
              fontSize: '10px',
              fontWeight: 100,
              width: '150px'
            }
          },
          yAxis: [{
            min: 0,
            opposite: false,
            gridLineColor: 'transparent',
            gridLineWidth: 0,
            lineWidth: 1,
            title: {
              useHTML: true,

              text: 'EUI [kBtu/ft<sup>2</sup>]'
            }
          }, {
            min: 0,
            gridLineColor: 'transparent',
            gridLineWidth: 0,
            opposite: true,
            lineWidth: 1,

            title: {
              text: 'Energy Use [kBtu]'
            }
          }],
          plotOptions: {
            series: {
              stacking: 'normal'
            }
          },
          title: {
            text: ''
          },
          xAxis: {
            categories: scope.categories
          },

          series: scope.series
        };
        angular.element(element).highcharts(options);
      },
      controller: ["$scope", function($scope) {

        var categories = [];

        var eui = {
          clg: [],
          extEqp: [],
          extLgt: [],
          fans: [],
          gentor: [],
          heatRec: [],
          heatRej: [],
          htg: [],
          humid: [],
          intEqp: [],
          intLgt: [],
          pumps: [],
          refrg: [],
          swh: [],
          net: []
        };
        var energyUse = {
          clg: [],
          extEqp: [],
          extLgt: [],
          fans: [],
          gentor: [],
          heatRec: [],
          heatRej: [],
          htg: [],
          humid: [],
          intEqp: [],
          intLgt: [],
          pumps: [],
          refrg: [],
          swh: [],
          net: []
        };

        $scope.data.values.forEach(function(term) {
          if (term.end_use_energy_list !== undefined) {
            for (var i = 0; i < term.end_use_energy_list.length; i++) {
              for (var property in term.end_use_energy_list[i].energy_breakdown) {

                //if its not equal to zero print them out
                //console.log(term.end_use_eui_list[i].eui_breakdown[property]);
                console.log(term.end_use_energy_list[i].energy_breakdown[property]);
                energyUse[property].push(term.end_use_energy_list[i].energy_breakdown[property]);
              }
            }
          }
        });

        $scope.data.values.forEach(function(term) {
          if (term.end_use_eui_list !== undefined) {
            for (var i = 0; i < term.end_use_eui_list.length; i++) {
              for (var property in term.end_use_eui_list[i].eui_breakdown) {

                //if its not equal to zero print them out
                //console.log(term.end_use_eui_list[i].eui_breakdown[property]);
                eui[property].push(term.end_use_eui_list[i].eui_breakdown[property]);

              }
              categories.push(term.end_use_eui_list[i].building_name);
            }
          }
        });
        $scope.categories = categories;
        $scope.eui = eui;
        $scope.energyUse = energyUse;
        var series=[];

        var colors = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
        		  '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
        		  '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
        		  '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
        		  '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
        		  '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
        		  '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
        		  '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
        		  '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
        		  '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

var index;
        function createSeries() {
          index=0;

          for (var propEui in eui) {
            if(propEui!=='net'){
            var modelEui = {
              name: propEui,
              id: propEui,
              data: eui[propEui],
              color:colors[index++],
              borderWidth: 0
            };
            series.push(modelEui);
          }
          }
          index=0;
          for (var propEnergy in energyUse) {

          if(propEnergy!=='net'){
            var modelEnergyUse={
                name: propEnergy,
                data: energyUse[propEnergy],
                stack: 'eui',
                borderWidth: 0,
                linkedTo: propEnergy,
                color: colors[index++],
                yAxis: 1
              };

              series.push(modelEnergyUse);
          }
          }
        }
        createSeries();
        $scope.series=series;



      }]
    };
  }]);
});
