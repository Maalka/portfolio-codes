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

    $scope.barOptions.energy.label = true;
    $scope.barOptions.energy.axislabel = "Energy Use [kBtu]";
    $scope.barOptions.eui.label = false;
    $scope.barOptions.eui.axislabel = "[kBtu/ft<sup>2</sup>]";


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




    $scope.computeBenchmarkResult = function(submission){
        $log.info(submission);

        $scope.futures = benchmarkServices.getEnergyMetrics(submission);

     $q.resolve($scope.futures).then(function (results) {
            $scope.endUses = results;
            $scope.endUseProps=reformatEndUses(results);
            $scope.endUseProps=groupByBuildingType($scope.endUseProps);
            var series=createSeries($scope.endUseProps);
            $scope.energySeries=series.properties.energy;
            $scope.euiSeries=series.properties.eui;
            $scope.catergories=series.categories;

        });
    };
      function createSeries(endUse){
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
        endUse.forEach(function(item){
            categories.push(item.building);
            for(var term in item.energy){
                properties.energy[term].push(item.energy[term]);
            }
            for(var euiTerm in item.eui){
                properties.eui[euiTerm].push(item.eui[euiTerm]);
            }
        });
        return {
          properties:properties,
          categories:categories
        };
    }
    function reformatEndUses(results){
      var endUseProps=[];
      var energyList=results.values[3].end_use_energy_list;
      var euiList=results.values[2].end_use_eui_list;
        for(var i=0;i<energyList.length;i++){
          var endPoint={
            building:"",
            building_type:"",
            energy:[],
            eui:[]
          };
          endPoint.building=energyList[i].building_name;
          endPoint.building_type=energyList[i].building_type;
          Object.assign(endPoint.energy, energyList[i].energy_breakdown);
          Object.assign(endPoint.eui, euiList[i].eui_breakdown);
          endUseProps.push(endPoint);
        }
        return endUseProps;
    }
    function filter(endUseProps) {
      for(var s=0;s<endUseProps.length;s++){
        for (var z = 0; z < (endUseProps.length - s) - 1; z++) {
          var net = endUseProps[z].energy.net;
          var next = endUseProps[z + 1].energy.net;
          if (next > net) {
            var store = endUseProps[z];
            endUseProps[z] = endUseProps[z + 1];
            endUseProps[z + 1] = store;
          }
        }
      }
    }
    function findTotalEnergy(buildingTypes){
      //filter groups by net energy
      var orderBy=[];
      for(var category in buildingTypes){
        //operated for each category
       var sum=0;
        for(var z=0;z<buildingTypes[category].length;z++){
           sum+=buildingTypes[category][z].energy.net;
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
          console.log('Sorted by highest average',buildingAverages);
          buildingAverages.forEach(function(item){
            order.push(item.building);
          });
          return order;
    }
    function groupByBuildingType(endUseProps) {
      //building types for overarching groups defined
      //this is the inital order of the groupings
      //initial order is alphabetical to what the user sees
      var buildingTypes={
        Lib:[],
        Admin:[],
        SecSchl:[],
        fire_station:[],
        police_station:[]
      };
      var filteredArr=[];
      //add a building to each building type
      endUseProps.forEach(function(item){
        buildingTypes[item.building_type].push(item);
      });
      //then we want to define the order of the groupings
      for(var building in buildingTypes){
        for(var i=0;i<buildingTypes[building].length;i++){
          //this is what we need to pass into filter
            filter(buildingTypes[building]);
        }
      }


      var order=sortByHighestAverage(buildingTypes);
      //reformat data for end use with including sorting by highest average order
      order.forEach(function(item){
        for(var v=0;v<buildingTypes[item].length;v++){
          filteredArr.push(buildingTypes[item][v]);
        }
      });

      //filteredArray is the array to be returned
      console.log(filteredArr,'filtered and grouped array');
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


    $scope.computeEndUses = function(){

        console.log("Will compute here");

//        function nullZero(a) {
//            if(a===0){
//                return null;
//            } else {
//            return a;
//            }
//        }


//        var endUses = ["Heating", "Cooling", "Interior Lighting", "Plug Loads", "Service Hot Water", "Fans"];
//        var shortNames = ["htg", "clg", "intLgt", "intEqp", "swh", "fans"];
//        var othersEndUses = ["Exterior Equipment","Exterior Light","Generators","Heat Recovery","Heat Rejection","Humidity Control","Pumps","Refrigeration"];
//        var othersNames = ["extEqp","extLgt","gentor","heatRec","heatRej","humid","pumps","refrg"];
//
//
//        var endUsesTable = {} ;
//        endUsesTable.endUses = [] ;
//        endUsesTable.endUsesOther = [] ;
//        endUsesTable.endUsesTotal = [] ;
//
//
//        var endUseResponse = $scope.getPropResponseField(results,"prescriptive_metrics");
//
//        endUsesTable.eui = endUseResponse.site_eui;
//        endUsesTable.energy = endUseResponse.site_energy / 1000; // this will be either MBtu or MWh
//
//
//
//        for (var i =0; i < endUses.length; i ++) {
//
//            endUsesTable.endUses.push([
//                endUses[i],
//                nullZero(endUseResponse.prescriptive_electricity_metric_data[shortNames[i]]),
//                nullZero(endUseResponse.prescriptive_natural_gas_metric_data[shortNames[i]]),
//                nullZero(endUseResponse.prescriptive_end_use_metric_data[shortNames[i]]),
//                endUseResponse.prescriptive_end_use_metric_percents[shortNames[i]]*100
//            ]);
//        }


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
