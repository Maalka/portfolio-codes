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
  let DashboardCtrl = function($rootScope, $scope, $window, $sce, $timeout, $q, $log, benchmarkServices,apiServices,calculations,series,hcOptions) {


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




    $scope.computeBenchmarkResult = function(submission){
        $log.info(submission);

        $scope.futures = benchmarkServices.getEnergyMetrics(submission);

     $q.resolve($scope.futures).then(function (results) {
        let energyDifference=apiServices.getEndUse(results,'energy_diff');
        let euiDifference=apiServices.getEndUse(results,'eui_diff');
        let endUses=apiServices.getEndUse(results,'end_uses');
        //attaches differences to endUses
        $scope.endUses=apiServices.attachDifferences(endUses,energyDifference,euiDifference);
            //calculates portfolio totals
        $scope.portfolioEui=calculations.totalScenario($scope.endUses).eui;
        $scope.portfolioEnergy=calculations.totalScenario($scope.endUses).energy;
          //groups buildings by type
          //reutrns group building types
        $scope.endUses=apiServices.groupByBuildingType($scope.endUses);
          let hcData=series.create($scope.endUses);
          //always hide the labels for eui
            $scope.barOptions.eui.showLabels=false;
            //show labels for eui depending of if the sum of each term is > 0
            $scope.barOptions.energy.showLabels=hcOptions.showLabels($scope.endUses);
            //always want to hide the energy legend
            $scope.barOptions.energy.showInLegend = false;
            //show in legend, if the total values for a particular term is > 0
            $scope.barOptions.eui.showInLegend=hcOptions.filterLegend(hcData.properties);
            //differences series
            $scope.differences=hcData.differences;
            //building properties series energy
            $scope.energySeries=hcData.properties.energy;
            //building properties series eui
            $scope.euiSeries=hcData.properties.eui;
            //building categories
            $scope.categories=hcData.categories;
        });
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
  DashboardCtrl.$inject = ['$rootScope', '$scope', '$window','$sce','$timeout', '$q', '$log', 'benchmarkServices','apiServices','calculations','series','hcOptions'];
  return {
    DashboardCtrl: DashboardCtrl,
    RootCtrl: RootCtrl

  };
});
