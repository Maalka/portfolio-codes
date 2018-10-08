/*global
    maalkaIncludeHeader
*/
/**
 * Dashboard controllers.
 */
//define(["./test/sample_response_test_data"], function(sampleTestData) {
define(['angular'], function() {
  'use strict';
  let RootCtrl = function($rootScope) {
    $rootScope.includeHeader = maalkaIncludeHeader;
  };
  RootCtrl.$inject = ['$rootScope'];
  let DashboardCtrl = function($rootScope, $scope, $window, $sce, $timeout, $q, $log, benchmarkServices) {


    $rootScope.includeHeader = maalkaIncludeHeader;
    $rootScope.pageTitle = "Portfolio Codes";

    $scope.barOptions = {};
    $scope.barOptions.energy = {};
    $scope.barOptions.eui = {};
    $scope.barOptions.eui.enableLabels = false;
    $scope.barOptions.energy.enableLabels = true;

    $scope.barOptions.energy.linkedTo = '_eui';
    $scope.barOptions.eui.linkedTo = undefined;
    $scope.barOptions.eui.labelSpacing = 10;
    $scope.barOptions.energy.labelSpacing = 30;

    $scope.barOptions.energy.label = true;
    $scope.barOptions.energy.id = '_energy';

    $scope.barOptions.energy.axislabel = " [MBtus]";
    $scope.barOptions.eui.label = false;
    $scope.barOptions.eui.id = '_eui';

    $scope.barOptions.eui.axislabel = " [kBtu/ft<sup>2</sup>]";


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

        let printQueryList = window.matchMedia('print');
        let phoneQueryList = window.matchMedia('(max-width: 767px)');
        let tabletQueryList = window.matchMedia('(min-width: 768px) and (max-width: 1200px)');
        let desktopQueryList = window.matchMedia('(min-width: 1200px) and (max-width: 1919px');
        let largeQueryList = window.matchMedia('(min-width: 1919px)');

        let updateMatchMedia= function () {
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
        $scope.endUses=null;

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
        let index;
        for(let i = 0; i < $scope.propTypes.length; i++ ) {
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
        let index;

        for(let i = 0; i < $scope.propTypes.length; i++ ) {
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


    function attachDifferences(endUses,energyDiff,euiDiff){
          for(let i=0;i<endUses.length;i++){
            if(energyDiff[i].energy_diff<0){
              energyDiff[i].energy_diff=0;
            }
            if(euiDiff[i].eui_diff<0){
              euiDiff[i].eui_diff=0;
            }
            //TODO: net energy is off by 3*area units
            //diff+senario=base and you want diff/base

            let energyScenario=energyDiff[i].energy;
            let euiScenario=euiDiff[i].eui;


            let energyBase=energyDiff[i].energy_diff+energyScenario;
            let euiBase=euiDiff[i].eui_diff+euiScenario;

            let differenceEnergy=(energyDiff[i].energy_diff/energyBase);
            let differenceEui=(euiDiff[i].eui_diff/euiBase);
            endUses[i].energy={
              base:energyBase,
              difference:differenceEnergy,
              scenario:energyScenario
            };
            endUses[i].eui={
              base:euiBase,
              difference:differenceEui,
              scenario:euiScenario
            };

          }
          $scope.endUses=endUses;
    }


    $scope.computeBenchmarkResult = function(submission){
        $log.info(submission);

        $scope.futures = benchmarkServices.getEnergyMetrics(submission);

     $q.resolve($scope.futures).then(function (results) {

        let energyDifference;
        let euiDifference;
        let endUses;
            results.values.forEach(function(item){
                if(Object.keys(item)[0]==='end_uses'){
                   endUses=item.end_uses;
                }else if(Object.keys(item)[0]==='energy_diff'){
                   energyDifference=item.energy_diff;
                }else if(Object.keys(item)[0]==='eui_diff'){
                   euiDifference=item.eui_diff;
                }
            });
            $scope.endUses=endUses;
            //attaches differences to endUses
            attachDifferences($scope.endUses,energyDifference,euiDifference);


            //calculates portfolio totals
            let portfolioTotals=portfolioTotal($scope.endUses);
            $scope.portfolioEui=portfolioTotals.eui;
            $scope.portfolioEnergy=portfolioTotals.energy;

            //groups buildings by type
            $scope.endUses=groupByBuildingType($scope.endUses);

            var series=createSeries($scope.endUses);

            //always hide the labels for eui
            $scope.barOptions.eui.showLabels=false;
            //show labels for eui depending of if the sum of each term is > 0
            $scope.barOptions.energy.showLabels=showLabels($scope.endUses);
            //always want to hide the energy legend
            $scope.barOptions.energy.showInLegend = false;
            //show in legend, if the total values for a particular term is > 0
            $scope.barOptions.eui.showInLegend=inLegend(series.properties);

            //differences series
            $scope.differences=series.differences;
            //building properties series energy
            $scope.energySeries=series.properties.energy;
            //building properties series eui
            $scope.euiSeries=series.properties.eui;
            //building categories
            $scope.categories=series.categories;
        });
    };


    function portfolioTotal(endUse){

      let totalBaseEnergy=0;
      let totalBaseEui=0;
      endUse.forEach(function(item){
          totalBaseEnergy+=Math.floor((item.energy.base)/1000);
          totalBaseEui+=Math.floor(item.eui.base);
      });
      return {
        eui:totalBaseEui,
        energy:totalBaseEnergy
      };
    }
      function inLegend(series){
        let inLegend=[];
        for (let term in $scope.propertyTerms) {
            let total=0;
            for(let i=0;i<series.energy[term].length;i++){
                total+=series.energy[term][i].y;
            }
            if(total===0){
              inLegend.push(false);
            }else{
              inLegend.push(true);
            }
        }
        return inLegend;
      }

      function convertToMBtus(value){
        return value/1000;
      }

      function createSeries(endUse){
        let categories = [];
        let differences={
          eui:[],
          energy:[]
        };
        //Cooling, Ext. Equipment, Ext. Lighting,
        //Fans, Generator, Heat Recovery, Heat Rejection, Heating, Humidity, Int. Equipment, Int. Lighting, Pumps, Refrigeration, Hot Water
        let terms = {
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

        let properties = {
          eui: {},
          energy: {}
        };
        for (let term in terms) {
          properties.eui[term] = [];
          properties.energy[term] = [];
        }
        endUse.forEach(function(item){
            differences.eui.push(item.eui.difference);
            differences.energy.push(item.energy.difference);
            categories.push(item.building_name);
            for(let term in item.energy_breakdown){
                properties.energy[term].push({y:convertToMBtus(item.energy_breakdown[term]),difference:item.energy.difference,total:convertToMBtus(item.energy.scenario),base:convertToMBtus(item.energy.base),name:prettyNames[term]});
            }
            for(let term in item.eui_breakdown){
                properties.eui[term].push({y:item.eui_breakdown[term],difference:item.eui.difference,total:item.eui.scenario,base:item.eui.base,name:prettyNames[term]});
            }

        });
        return {
          properties:properties,
          differences:differences,
          categories:categories
      };
    }

    function showLabels(endUses){
      //if the difference in energy is equal to Zero
      //then we do not want to show the labels
      //because there has been no change from base
      if(endUses[0].energy.difference===0){
        return false;
      }else{
        return true;
      }
    }

    function filter(endUses) {
      for(let s=0;s<endUses.length;s++){
        for (let z = 0; z < (endUses.length - s) - 1; z++) {
          let net = endUses[z].energy_breakdown.net;
          let next = endUses[z + 1].energy_breakdown.net;
          if (next > net) {
            let store = endUses[z];
            endUses[z] = endUses[z + 1];
            endUses[z + 1] = store;
          }
        }
      }
    }
    function findTotalEnergy(buildingTypes){
      let orderBy=[];
      for(let category in buildingTypes){
        //operated for each category
       let sum=0;
        for(let z=0;z<buildingTypes[category].length;z++){
           sum+=buildingTypes[category][z].energy_breakdown.net;
        }
        if(sum!==0){
          orderBy.push({building:category,total:sum,size:buildingTypes[category].length});
        }
      }
      return orderBy;
    }
    function findAverageEnergy(buildingGroup){
          let averageArr=[];
          let totalEnergy=findTotalEnergy(buildingGroup);
          totalEnergy.forEach(function(item){
            let average=(item.total/item.size);
            averageArr.push({building:item.building,average:average});
          });
          return averageArr;
    }
    function sortByHighestAverage(buildingGroup){
          let buildingAverages=findAverageEnergy(buildingGroup);
          let order=[];
            for(let i=0;i<buildingAverages.length;i++){
              for (let v = 0; v < (buildingAverages.length - i) - 1; v++) {
                let average = buildingAverages[v].average;
                let next = buildingAverages[v + 1].average;
                if (next > average) {
                  let store = buildingAverages[v];
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
      for(let building in buildingTypes){
        for(let i=0;i<buildingTypes[building].length;i++){
            filter(buildingTypes[building]);
        }
      }
    }
    function groupByBuildingType(endUses) {
      //building types for overarching groups defined
      //inital order of the building groupings
      let filteredArr=[];
      let buildingTypes={
        lib:[],
        admin:[],
        sec_school:[],
        fire_station:[],
        police_station:[]
      };
      //add a building to each building type
      endUses.forEach(function(item){
        buildingTypes[item.building_type].push(item);
      });
      //sorting buildings in each group by net energy type
      sortBuildings(buildingTypes);
      let order=sortByHighestAverage(buildingTypes);
      //reformat data for end use with including sorting by highest average order
      order.forEach(function(item){
        for(let v=0;v<buildingTypes[item].length;v++){
          filteredArr.push(buildingTypes[item][v]);
        }
      });
      //filteredArray is the array to be returned
      return filteredArr;
    }


     $scope.propertyTerms = {
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

    $scope.submitErrors = function () {
        if($scope.forms.baselineForm.$error.required){
            for (let i = 0; i < $scope.forms.baselineForm.$error.required.length; i++){
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
                let csvJSON = [];

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
            for (let i =0; i < $scope.propTypes.length; i ++) {
                $scope.propTypes[i].propertyModel.floor_area_units = "ftSQ";
            }
        }

        $scope.endUses = null;

        if($scope.forms.baselineForm === undefined) {
            return;
        }

        $scope.forms.hasValidated = true; /// only check the field errors if this form has attempted to validate.


        let getPropTypes = function () {

            let props = [];
            for (let i =0; i < $scope.propTypes.length; i ++) {
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
        let returnValue;

        for (let i =0; i < propResponse.values.length; i ++) {
            if (propResponse.values[i][key] !== undefined) {
              returnValue = propResponse.values[i][key];
              break;
            }
        }
        return returnValue;
    };

    $scope.getPropSize = function(building_sub_types){

        let size = [];
        for (let i =0; i < building_sub_types.length; i ++) {
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
        {id:"EEM1",name:"Lighting Retrofit"},
        {id:"EEM2",name:"HVAC Retrofit"},
        {id:"EEM3",name:"Green Retrofit"},
        {id:"EEM4",name:"Deep Green Retrofit"}
    ];

    $scope.buildingProperties = {

        buildingType: {
            commercial: [
                {name:"K-12 School",id:"sec_school"},
                {name:"City Hall/Administration",id:"admin"},
                {name:"Public Library",id:"lib"},
                {name:"Fire Station",id:"fire_station"},
                {name:"Police Station",id:"police_station"}
            ]
        }
    };


    let prettyNames={
        clg: "Cooling",
        extEqp: "Ext. Equipment",
        extLgt: "Ext. Lighting",
        fans: "Fans",
        gentor: "Generator",
        heatRec: "Heat Recovery",
        heatRej: "Heat Rejection",
        htg: "Heating",
        humid: "Humidity",
        intEqp: "Int. Equipment",
        intLgt: "Int. Lighting",
        pumps: "Pumps",
        refrg: "Refrigeration",
        swh: "Hot Water",
        net: "net"

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
