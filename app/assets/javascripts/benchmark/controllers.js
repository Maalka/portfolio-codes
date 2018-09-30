/*global
    maalkaIncludeHeader
*/
/**
 * Dashboard controllers.
 */
//define(["./test/sample_response_test_data"], function(sampleTestData) {
define(['angular'], function() {
  'use strict';
  var RootCtrl = function($rootScope) {
    $rootScope.includeHeader = maalkaIncludeHeader;
  };



  RootCtrl.$inject = ['$rootScope'];

  var DashboardCtrl = function($rootScope, $scope, $window, $sce, $timeout, $q, $log, benchmarkServices) {



    $rootScope.includeHeader = maalkaIncludeHeader;
    $rootScope.pageTitle = "Portfolio Codes";

    $scope.barOptions = {};
    $scope.barOptions.energy = {};
    $scope.barOptions.eui = {};
    $scope.barOptions.eui.showInLegend = true;
    $scope.barOptions.energy.showInLegend = false;
    $scope.barOptions.energy.linkedTo = '_eui';
    $scope.barOptions.eui.linkedTo = undefined;
    $scope.charts = [];

    $scope.barOptions.energy.label = true;
    $scope.barOptions.energy.id = '_energy';

    $scope.barOptions.energy.axislabel = "Energy Use [kBtu]";
    $scope.barOptions.eui.label = false;
    $scope.barOptions.eui.id = '_eui';

    $scope.barOptions.eui.axislabel = "EUI [kBtu/ft<sup>2</sup>]";


    $scope.auxModel = {};
    $scope.auxModel.climate_zone = null;
    $scope.auxModel.scenario = "base";
    $scope.auxModel.reporting_units = "imperial";


    $scope.sizeDefault = false;
    $scope.temp = {};
    $scope.tempModel = {};

    $scope.benchmarkResult = null;

    $scope.propOutputList = [];
    $scope.forms = {'hasValidated': false};
    $scope.propTypes = [];
    $scope.mainColumnWidth = "";
    $scope.propText = "Primary Building Use";

    $scope.csvData = {};



    if (window.matchMedia) {

        var printQueryList = window.matchMedia('print');
        var phoneQueryList = window.matchMedia('(max-width: 767px)');
        var tabletQueryList = window.matchMedia('(min-width: 768px) and (max-width: 1200px)');
        var desktopQueryList = window.matchMedia('(min-width: 1200px) and (max-width: 1919px');
        var largeQueryList = window.matchMedia('(min-width: 1919px)');

        var updateMatchMedia= function () {
            //console.log(q);
            if (printQueryList.matches) {
                $scope.media = "print";
            } else if (phoneQueryList.matches) {
                $scope.media = "phone";
            } else if (tabletQueryList.matches) {
                $scope.media = "tablet";
            } else if (desktopQueryList.matches) {
                $scope.media = "desktop";
            }

            if (largeQueryList.matches) {
                $scope.largeScreen = true;
            } else {
                $scope.largeScreen = false;
            }

           // console.log($scope.media);
            $timeout(function () {
                $scope.$apply();
            });
        };
        updateMatchMedia();

        printQueryList.addListener(updateMatchMedia);

        $scope.$on("$destroy", function handler() {
            printQueryList.removeListener(updateMatchMedia);
        });
    }

    function add(a, b) {
        return a + b;
    }


    $scope.$watch("tempModel.buildingType", function (v) {
        if (v === undefined || v === null) {
            return;
        }

        if(v){

            $scope.propTypes.push({
                changeTo: v,
                type: v.id,
                name: v.name,
            });

            $scope.propText="Add Another Building";
            $scope.tempModel.resetBuildingType = true;
            $scope.tempModel.buildingType = undefined;
        }
    });

    $scope.updatePropType = function($index) {

        $scope.propTypes[$index] = {
            changeTo: $scope.propTypes[$index].changeTo,
            type: $scope.propTypes[$index].changeTo.id,
            name: $scope.propTypes[$index].changeTo.name,
        };
    };


    $scope.$watch("auxModel.approach", function () {

        $scope.forms.hasValidated = false;
        $scope.endUses = null;
        $scope.endUseProps=null;

    });

    $scope.$watch("auxModel.scenario", function (newValue, oldValue) {

        if (newValue !== oldValue) {
            if (newValue === undefined) {
                return;
            } else {
                $timeout(function(){$scope.submit();},0);
            }
        }

    });


    $scope.print = function () {
        window.print();
    };

    $scope.removeProp = function(prop){
        var index;
        for(var i = 0; i < $scope.propTypes.length; i++ ) {
            if($scope.propTypes[i].name === prop.model.name) {
                index = i;
                break;
            }
        }
        $scope.propTypes.splice(index, 1);
    };

    $scope.showDivider = function() {
        if($scope.pvList.length > 1){
            return true;
            }else {
            return false;
                }
    };

    $scope.clearProp = function(prop){
        var index;

        for(var i = 0; i < $scope.propTypes.length; i++ ) {
            if($scope.propTypes[i].name === prop.name) {
                index = i;
                break;
            }
        }

        $scope.propTypes.splice(index, 1);
        if($scope.propTypes.length === 0){
            $scope.propText="Primary Building Use";
        }
    };


    function groupDiffs(endUses,energy,eui){
          var showLabels=true;
          for(var i=0;i<endUses.length;i++){
            if(energy[i].energy_diff<0){
              energy[i].energy_diff=0;
            }
            if(eui[i].eui_diff<0){
              eui[i].eui_diff=0;
            }
            endUses[i].energy_diff=Math.round(energy[i].energy_diff);
            endUses[i].eui_diff=Math.round(eui[i].eui_diff);
            if(eui[i].eui_diff===0||energy[i].energy_diff===0){
              showLabels=false;
            }
          }
          return showLabels;
    }
    $scope.computeBenchmarkResult = function(submission){
        $log.info(submission);

        $scope.futures = benchmarkServices.getEnergyMetrics(submission);

     $q.resolve($scope.futures).then(function (results) {
            $scope.endUses = results;
            var totalEnergy=results.values[0].total_eui_list;
            var totalEui=results.values[1].total_energy_list;
            $scope.endUseProps=results.values[4].end_uses;
            var energyDiffs=results.values[5].energy_diff;
            var euiDiffs=results.values[6].eui_diff;
            var showLabels=groupDiffs($scope.endUseProps,energyDiffs,euiDiffs);
            $scope.barOptions.eui.showLabels=showLabels;
            $scope.barOptions.energy.showLabels=showLabels;

            console.log(energyDiffs,'energyDiff');
            console.log(euiDiffs,'eui diff');

            $scope.portfolioEui=portfolioTotal(totalEnergy,'eui');
            $scope.portfolioEnergy=portfolioTotal(totalEui,'energy');
            $scope.endUseProps=groupByBuildingType($scope.endUseProps);
            var series=createSeries($scope.endUseProps);
            $scope.differences=series.differences;
            $scope.energySeries=series.properties.energy;
            $scope.euiSeries=series.properties.eui;
            $scope.negativeEui=series.properties.eui;
            console.log($scope.endUseProps,'endUses');
            console.log(JSON.stringify($scope.endUseProps),'endUses');
            console.log(  $scope.energySeries,'euiSeries');
            console.log($scope.euiSeries,'eseries');

            $scope.categories=series.categories;
          //  console.log('Formatting Data for Highcharts EndUse - Energy',series.properties.energy);
          //  console.log('Formatting Data for Highcharts EndUse - EUI',series.properties.eui);
          //  console.log('Formatting Data for Highcharts EndUse - Categories',series.categories);
            /*
            TESTING
            */
            testPerformance('portfolioTotal',portfolioTotal,totalEui);
            testPerformance('portfolioTotal',portfolioTotal,totalEnergy);
            testPerformance('groupByBuildingType',groupByBuildingType,$scope.endUseProps);

        });
    };

      function testPerformance(name,func,params){
        //var t0 = performance.now();
        func(params);   // <---- The function you're measuring time for
        //var t1 = performance.now();
        //console.log(name+ ":" + (t1 - t0) + " milliseconds.");
      }
      function portfolioTotal(list,energyType){
          var totalPortfolioEui=0;
          for(var i=0;i<list.length;i++){
            totalPortfolioEui+=list[i][energyType];
          }
          var rounded=Math.round(totalPortfolioEui);
          return rounded;
      }

      function createSeries(endUse){
        var categories = [];
        var differences={
          eui:[],
          energy:[]
        };

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


        console.log(properties,'props');
        endUse.forEach(function(item){
            differences.eui.push(item.eui_diff);
            differences.energy.push(item.energy_diff);
            categories.push(item.building_name);


            for(var term in item.energy_breakdown){
                properties.energy[term].push(Math.round(item.energy_breakdown[term]));
            }

            for(var euiTerm in item.eui_breakdown){
                properties.eui[euiTerm].push(item.eui_breakdown[euiTerm]);
            }
        });

        console.log(properties,'props');
        console.log(differences,'diff');

        return {
          properties:properties,
          differences:differences,
          categories:categories
        };
    }
    function filter(endUseProps) {
      for(var s=0;s<endUseProps.length;s++){
        for (var z = 0; z < (endUseProps.length - s) - 1; z++) {
          var net = endUseProps[z].energy_breakdown.net;
          var next = endUseProps[z + 1].energy_breakdown.net;
          if (next > net) {
            var store = endUseProps[z];
            endUseProps[z] = endUseProps[z + 1];
            endUseProps[z + 1] = store;
          }
        }
      }
    }
    function findTotalEnergy(buildingTypes){
      var orderBy=[];
      for(var category in buildingTypes){
        //operated for each category
       var sum=0;
        for(var z=0;z<buildingTypes[category].length;z++){
           sum+=buildingTypes[category][z].energy_breakdown.net;
        }
        if(sum!==0){
          orderBy.push({building:category,total:sum,size:buildingTypes[category].length});
        }

      }
      return orderBy;
    }
    function findAverageEnergy(buildingGroup){
          var averageArr=[];
          var totalEnergy=findTotalEnergy(buildingGroup);
          totalEnergy.forEach(function(item){
            var average=(item.total/item.size);
            averageArr.push({building:item.building,average:average});
          });
          return averageArr;
    }
    function sortByHighestAverage(buildingGroup){
          var buildingAverages=findAverageEnergy(buildingGroup);
          var order=[];
            for(var i=0;i<buildingAverages.length;i++){
              for (var v = 0; v < (buildingAverages.length - i) - 1; v++) {
                var average = buildingAverages[v].average;
                var next = buildingAverages[v + 1].average;
                if (next > average) {
                  var store = buildingAverages[v];
                  buildingAverages[v] = buildingAverages[v + 1];
                  buildingAverages[v + 1] = store;
                }
              }
          }
          buildingAverages.forEach(function(item){
            order.push(item.building);
          });
          return order;
    }
    function sortBuildings(buildingTypes){
      //sorting buildings in each group by net energy type
      for(var building in buildingTypes){
        for(var i=0;i<buildingTypes[building].length;i++){
            filter(buildingTypes[building]);
        }
      }
    }
    function groupByBuildingType(endUseProps) {
      //building types for overarching groups defined
      //inital order of the building groupings
      var filteredArr=[];
      var buildingTypes={
        Lib:[],
        Admin:[],
        SecSchl:[],
        fire_station:[],
        police_station:[]
      };
      //add a building to each building type
      endUseProps.forEach(function(item){
        buildingTypes[item.building_type].push(item);
      });
      //sorting buildings in each group by net energy type
      sortBuildings(buildingTypes);
      var order=sortByHighestAverage(buildingTypes);
      //reformat data for end use with including sorting by highest average order
      order.forEach(function(item){
        for(var v=0;v<buildingTypes[item].length;v++){
          filteredArr.push(buildingTypes[item][v]);
        }
      });
      //filteredArray is the array to be returned
      return filteredArr;
    }



    $scope.submitErrors = function () {
        if($scope.forms.baselineForm.$error.required){
            for (var i = 0; i < $scope.forms.baselineForm.$error.required.length; i++){
                $log.info($scope.forms.baselineForm.$error.required[i].$name);
            }
            $scope.performanceError = false;
        } else {
            $scope.performanceError = true;
        }
    };

    $scope.submit = function () {
        $scope.endUses = null;
        if($scope.auxModel.approach === "manual"){
            $scope.submitForm();
        } else {
            $scope.submitCSV();
        }
    };


    $scope.submitCSV = function () {

            if ($scope.csvData) {
                var csvJSON = [];

                if ($scope.csvData.sites) {
                    $scope.csvData.sites.scenario = $scope.auxModel.scenario;
                }

                csvJSON.push($scope.csvData.sites);
                $scope.computeBenchmarkResult(csvJSON);

            } else {
                console.log("No CSV Processed.");
            }

    };

    $scope.submitForm = function () {

        if($scope.sizeDefault === true) {
            for (var i =0; i < $scope.propTypes.length; i ++) {
                $scope.propTypes[i].propertyModel.floor_area_units = "ftSQ";
            }
        }

        $scope.endUses = null;

        if($scope.forms.baselineForm === undefined) {
            return;
        }

        $scope.forms.hasValidated = true; /// only check the field errors if this form has attempted to validate.


        var getPropTypes = function () {

            var props = [];
            for (var i =0; i < $scope.propTypes.length; i ++) {
                props.push($scope.propTypes[i].propertyModel);
                }
            return props;
        };



        if($scope.forms.baselineForm.$valid){

            $scope.submitArray = [];
            $scope.auxModel.prop_types = getPropTypes();
            $scope.submitArray.push($scope.auxModel);

            $scope.computeBenchmarkResult($scope.submitArray);

        }else {
            $scope.displayErrors();
        }

    };

    $scope.getPropResponseField = function(propResponse,key){
        var returnValue;

        for (var i =0; i < propResponse.values.length; i ++) {
            if (propResponse.values[i][key] !== undefined) {
              returnValue = propResponse.values[i][key];
              break;
            }
        }
        return returnValue;
    };

    $scope.getPropSize = function(building_sub_types){

        var size = [];
        for (var i =0; i < building_sub_types.length; i ++) {
            size.push(building_sub_types[i].floor_area);
        }

        return size.reduce(add, 0);
    };


    $scope.displayErrors = function () {
        $scope.submitErrors();
        $scope.benchmarkResult = null;
    };

    $scope.scenarios = [
        {id:"base",name:"Base"},
        {id:"EEM1(calibration)",name:"Low Cost"},
        {id:"EEM2",name:"Medium Cost"},
        {id:"EEM3",name:"High Cost"},
        {id:"EEM4",name:"Extravagant"}
    ];

    $scope.buildingProperties = {

        buildingType: {
            commercial: [
                {name:"K-12 School",id:"SecSchl"},
                {name:"City Hall/Administration",id:"Admin"},
                {name:"Public Library",id:"Lib"},
                {name:"Fire Station",id:"fire_station"},
                {name:"Police Station",id:"police_station"}
            ]
        }
    };

    $scope.geographicProperties = {
        country : [],
        city : [],
        climate_info : [
            {id:"1A"},
            {id:"2A"},
            {id:"2B"},
            {id:"3A"},
            {id:"3B"},
            {id:"3C"},
            {id:"4A"},
            {id:"4B"},
            {id:"4C"},
            {id:"5A"},
            {id:"5B"},
            {id:"6A"},
            {id:"6B"},
            {id:"7"},
            {id:"8"}
        ]
    };





  };
  DashboardCtrl.$inject = ['$rootScope', '$scope', '$window','$sce','$timeout', '$q', '$log', 'benchmarkServices'];
  return {
    DashboardCtrl: DashboardCtrl,
    RootCtrl: RootCtrl

  };
});
