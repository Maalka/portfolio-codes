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

      template: '<div id="container" style=";margin:0 auto;"></div>',
      link: function(scope, element) {

        var options = {
          chart: {
            type: 'bar',
            marginTop: 50,
            marginBottom: 70,
            height: scope.height

          },

          yAxis: [{
            min: 0,
            opposite: true,
            gridLineColor: 'transparent',
            gridLineWidth: 0,
            lineWidth: 1,
            title: {
              useHTML: true
            }
          }, {
            min: 0,
            gridLineColor: 'transparent',
            gridLineWidth: 0,
            opposite: false,
            lineWidth: 1,
            title: {
              text: scope.options.axislabel
            }
          }],
          plotOptions: {
            series: {
              stacking: 'normal'
            },
            bar: {
              maxPointWidth: 18,
              pointPadding: 0.1,
            }
          },
          tooltip: {
            shared: false,
            useHTML: true,
            formatter: function() {
              if (this.series.stackKey === 'bareui') {
                return '<b>' + this.x + '</b><br/>' +
                  this.series.name + ': ' + this.y + ' EUI [kBtu/ft<sup>2</sup>]' + '<br/>' +
                  'Total: ' + this.point.stackTotal;
              } else if (this.series.stackKey === 'bar') {
                return '<b>' + this.x + '</b><br/>' +
                  this.series.name + ': ' + this.y + ' Energy Use [kBtu]' + '<br/>' +
                  'Total: ' + this.point.stackTotal;
              } else {
                //set a default if something went wrong
                return '<b>' + this.x + '</b><br/>' +
                  this.series.name + ': ' + this.y + '<br/>' +
                  'Total: ' + this.point.stackTotal;
              }
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
              }

            }
          },
          series: scope.series
        };
        angular.element(element).highcharts(options);


      },
      controller: ["$scope", function($scope) {

        console.log($scope);

        var categories = [];

        var terms = {
          clg: {},
          extEqp: {},
          extLgt: {},
          fans: {},
          gentor: {},
          heatRec: {},
          heatRej: {},
          htg: {},
          humid: {},
          intEqp: {},
          intLgt: {},
          pumps: {},
          refrg: {},
          swh: {},
          net: {}
        };
        var properties = {
          eui: {},
          energy: {}
        };
        for (var term in terms) {
          properties.eui[term] = [];
          properties.energy[term] = [];
        }


        function filter() {
          var energyList = $scope.data.values[3].end_use_energy_list;
          for (var i = 0; i < energyList.length; i++) {
            for (var z = 0; z < (energyList.length - i) - 1; z++) {
              var net = energyList[z].energy_breakdown.net;
              var next = energyList[z + 1].energy_breakdown.net;
              if (next > net) {
                var store = energyList[z];
                energyList[z] = energyList[z + 1];
                energyList[z + 1] = store;
              }
            }
          }
        }
        filter();
        $scope.data.values[2].end_use_eui_list.forEach(function(term) {
          categories.push(term.building_name);
          for (var item in term.eui_breakdown) {
            properties.eui[item].push(term.eui_breakdown[item]);
          }
        });
        $scope.data.values[3].end_use_energy_list.forEach(function(term) {
          for (var item in term.energy_breakdown) {
            var rounded = (term.energy_breakdown[item]).toFixed(2);
            //keeps to 2 decimal places
            properties.energy[item].push(Number.parseFloat(rounded));
          }
        });
        $scope.height = categories.length * 20 + 120;

        var series = [];
        var colors = ['#1F2C5C', '#3F58CE', '#5D70D4', '#08B4BB', '#6BD2D6', '#06A1F9', '#0579BB', '#F5B569', '#EB885C', '#D4483D', '#64467D', '#9A6ECE','#06AED5','#564787','#FDE74C'];
        var index;
        function createSeries() {
          index = 0;
          for (var propEnergy in properties.energy) {
            if (propEnergy !== 'net') {
              var modelEnergy = {
                name: propEnergy,
                id: propEnergy+'_energy',
                data: properties.energy[propEnergy],
                color: colors[index++],
                showInLegend: true,
                borderWidth: 0
              };
              series.push(modelEnergy);
            }
          }
          index = 0;
          for (var propEui in properties.eui) {
            if (propEui !== 'net') {
              var modelEui = {
                name: propEui,
                data: properties.eui[propEui],
                stack: 'eui',
                borderWidth: 0,
                linkedTo: propEui+'_energy',
                showInLegend: true,
                color: colors[index++],
                yAxis: 1
              };
              series.push(modelEui);
            }
          }
        }
        createSeries();
        $scope.series = series;
        $scope.categories = categories;

      }]
    };
  }]);
});
