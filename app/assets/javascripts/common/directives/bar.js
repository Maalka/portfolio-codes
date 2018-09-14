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
      template: '<div style="width:100%;height:600px;"></div>',
      link: function(scope, element) {

        var options = {
          chart: {
            type: 'bar',
            margin: 100

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
            width: 500,
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


        function getColor(){
          var colors=['#ec7b7d','#FDC168','#91d1be','#768FDf','#fddb64','#8e83bc','#F36993','#ec7b7d','#FDC168','#91d1be'];
          var rand=Math.floor((Math.random() * 9) + 0);
          return colors[rand];
        }

        function createSeries() {

          for (var propEui in eui) {
            if(propEui!=='net'){
            var modelEui = {
              name: propEui,
              id: propEui,
              data: eui[propEui],
              color:getColor(),
              borderWidth: 0
            };
            series.push(modelEui);
              }
          }
          for (var propEnergy in energyUse) {
            
          if(propEnergy!=='net'){
            var modelEnergyUse={
                name: propEnergy,
                data: energyUse[propEnergy],
                stack: 'eui',
                borderWidth: 0,
                linkedTo: propEnergy,
                color: getColor(),
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
