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
    $rootScope.pageTitle = "ZNC Tool";


    $scope.auxModel = {};

    $scope.auxModel.country = 'United States';
    $scope.auxModel.state = "CA";
    $scope.auxModel.climate_zone = null;
    $scope.auxModel.prescriptive_resource = 1;
    $scope.auxModel.reporting_units = "imperial";
    $scope.temp = {};

    $scope.tempModel = {};
    $scope.energies = [{}, {}];
    $scope.pvList = [{id:0,name:"PV SYSTEM",showDivider:false}];
    $scope.pvCounter = 1;

    $scope.benchmarkResult = null;

    $scope.propOutputList = [];
    $scope.tableEUIUnits = null;
    $scope.tableEnergyUnits = null;
    $scope.forms = {'hasValidated': false};
    $scope.propTypes = [];
    $scope.mainColumnWidth = "";
    $scope.propText = "Primary Building Use";

    $scope.csvData = {};

    $scope.showEnergy = true;
    $scope.showBar = false;
    $scope.showSolar = false;


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

            $scope.propText="Add Another Use";
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
        $scope.buildingRequirements = null;
        $scope.benchmarkResult = null;
        $scope.prescriptiveRequirements = null;

        $scope.solarResults = null;
        $scope.showSolar = false;

    });


    $scope.getFile = function(item){
            $scope.auxModel.climate_zone = item.id;
            $scope.auxModel.file_id = item.file_id;
        };



    //populate user-input energy information table to calculate site/source EUI and Energy Star metrics
    //display errors when present
    $scope.addEnergiesRow = function(){
        $scope.energies.push({});
    };

    $scope.print = function () {
        window.print();
    };

    $scope.removeRow = function(index){
        $scope.energies.splice(index, 1);
        if ($scope.energies.length ===    1) {
            $scope.addEnergiesRow();
        }
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

    $scope.addPV = function(){
        var divider = true;
        if ($scope.pvList.length ===  0) {
            divider = false;
        }
        $scope.pvList.push({id:$scope.pvCounter,name:"PV SYSTEM",showDivider:divider});
        $scope.pvCounter = $scope.pvCounter + 1;
    };

    $scope.removePV = function(pv){
        var index;
        for(var i = 0; i < $scope.pvList.length; i++ ) {
            if($scope.pvList[i].id === pv.model.id) {
                index = i;
                break;
            }
        }

        $scope.pvList.splice(index, 1);

        if ($scope.pvList.length ===  0) {
            $scope.addPV();
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

    $scope.showPrescriptive = function(){
        if($scope.showBar===false){
                $scope.showBar = true;
            } else {
                $scope.showBar = false;
            }
    };
    $scope.showEnergyRequirement = function(){
        if($scope.showEnergy===false){
            $scope.showEnergy = true;
        } else {
            $scope.showEnergy = false;
        }
    };
    $scope.showSolarPlot = function(){
        if($scope.showSolar===false){
            $scope.showSolar = true;
        } else {
            $scope.showSolar = false;
        }
    };

    $scope.getEndUsePercents = function(total){
        for(var i = 0; i < $scope.endUses.endUses.length; i++ ) {
            $scope.endUses.endUses[i].push(100*$scope.endUses.endUses[i][1]/total);
        }
        for(var j = 0; j < $scope.endUses.endUsesOther.length; j++ ) {
            $scope.endUses.endUsesOther[j].push(100*$scope.endUses.endUsesOther[j][1]/total);
        }
    };

    $scope.getTotalMetric = function(arr){
        var total;
        for(var i = 0; i < arr.endUses.length; i++ ) {
            if(arr.endUses[i][0] === 'Total'){
                total = arr.endUses[i][1];
            }
        }

        return (total === 'undefined') ? null : total;

    };

     $scope.getSolarMetric = function(arr,key){
            var onsite;
            for(var i = 0; i < arr.renewables.length; i++ ) {
                if(arr.renewables[i][0] === key){
                    onsite = arr.renewables[i][1];
                }
            }

            return (onsite === 'undefined') ? null : Math.abs(onsite);

    };


    $scope.submitCSV = function () {

        $scope.showBar = false;

        if ($scope.csvData.sourceMetrics) {


            $scope.solarMonthly = null;
            $scope.pv_capacity = null;


            $scope.solarResults = null;
            $scope.endUses = null;
            $scope.buildingRequirements = null;
            $scope.benchmarkResult = null;
            $scope.prescriptiveRequirements = null;

            if($scope.auxModel.prescriptive_resource === 0){
                 $scope.endUses = $scope.computeCSVEndUses($scope.csvData.siteMetrics);
                 $scope.barPlotUnits=$scope.csvData.siteMetrics.units;
            } else if($scope.auxModel.prescriptive_resource === 1){
                 $scope.endUses = $scope.computeCSVEndUses($scope.csvData.sourceMetrics);
                 $scope.barPlotUnits=$scope.csvData.sourceMetrics.units;
            } else if($scope.auxModel.prescriptive_resource === 2){
                 $scope.endUses = $scope.computeCSVEndUses($scope.csvData.tdvMetrics);
                 $scope.barPlotUnits=$scope.csvData.tdvMetrics.units;
            } else if($scope.auxModel.prescriptive_resource === 3){
                 $scope.endUses = $scope.computeCSVEndUses($scope.csvData.carbonMetrics);
                 $scope.barPlotUnits=$scope.csvData.carbonMetrics.units;
            }

            $scope.sourceTotals = $scope.computeCSVEndUses($scope.csvData.sourceMetrics);

            console.log($scope.csvData.projectMetrics.TotalConditionedFloorAreainScope);
            console.log($scope.csvData.projectMetrics.TotalUnconditionedFloorArea);
            console.log($scope.csvData.projectMetrics);

            $scope.totalFloorAreaCSV = parseFloat($scope.csvData.projectMetrics.TotalConditionedFloorAreainScope.replace (/,/g, "")) + parseFloat($scope.csvData.projectMetrics.TotalUnconditionedFloorArea.replace (/,/g, ""));



            //calculate source table metrics
            var building_source = $scope.getTotalMetric($scope.sourceTotals);
            var pv_potential = $scope.getSolarMetric($scope.sourceTotals,'On-site PV');
            var battery_potential = $scope.getSolarMetric($scope.sourceTotals,'Batteries Discharge');
            var source_procured = Math.max(building_source - pv_potential - battery_potential,0);

            var sourceTable = {
                  "building_source": building_source * $scope.totalFloorAreaCSV / 1000,
                  "required": building_source * $scope.totalFloorAreaCSV / 1000,
                  "pv_potential": pv_potential* $scope.totalFloorAreaCSV / 1000,
                  "battery_potential": battery_potential* $scope.totalFloorAreaCSV / 1000,
                  "procured": source_procured* $scope.totalFloorAreaCSV / 1000,

                  "building_source_norm": building_source,
                  "required_norm": building_source,
                  "pv_potential_norm": pv_potential,
                  "battery_potential_norm": battery_potential,
                  "procured_norm": source_procured
            };

            $scope.buildingRequirements = sourceTable;

            $scope.setPrescriptiveTable();

            var pv_potential_prescriptive = $scope.getSolarMetric($scope.endUses,'On-site PV');
            var battery_potential_prescriptive = $scope.getSolarMetric($scope.endUses,'Batteries Discharge');
            var total_prescriptive = $scope.getTotalMetric($scope.endUses);
            $scope.endUses.eui = total_prescriptive;
            $scope.endUses.energy = total_prescriptive * $scope.totalFloorAreaCSV / 1000;

            $scope.getEndUsePercents(total_prescriptive);

            $scope.prescriptiveRequirements = {
                "building_energy_norm": total_prescriptive,
                "pv_potential_norm": pv_potential_prescriptive + battery_potential_prescriptive,
                "procured_norm": total_prescriptive - pv_potential_prescriptive - battery_potential_prescriptive,
                "prescriptive_resource": $scope.auxModel.prescriptive_resource

            };

            $scope.tableEnergyUnits="(kBtu)";
            $scope.graphEnergyUnits="kBtu";
            $scope.tableBigEnergyUnits="MBtu/yr";
            $scope.tableEUIUnits="kBtu/ft²-yr";
            $scope.tableAreaUnits="(ft²)";



            $scope.showBar = true;

        } else {
            console.log("No CSV Processed.");
        }
    };



    $scope.computeCSVEndUses = function(results){

            function nullZero(a) {
                if(a===0 || a===undefined){
                    return null;
                } else {
                return a;
                }
            }


            //still have net here
            var mainEndUses = ["htg", "clg", "intLgt", "intEqp", "swh", "fans", "net"];
            var endUseNames = ["Heating", "Cooling", "Interior Lighting", "Plug Loads", "Service Hot Water", "Fans", "Total"];
            var othersEndUses = ["extLgt","heatRej","process","pumps","receptacle"];
            var othersEndUseNames = ["Exterior Equipment","Heat Rejection","Process","Pumps","Receptacle"];

            var renewables = ["charge","discharge","netenergy","solar"];
            var renewablesNames = ["Batteries Charge","Batteries Discharge","Net Energy","On-site PV"];


            var endUsesTable = {} ;
            endUsesTable.endUses = [] ;
            endUsesTable.endUsesOther = [] ;
            endUsesTable.renewables = [] ;

            for (var i =0; i < mainEndUses.length; i ++) {

                endUsesTable.endUses.push([
                    endUseNames[i],
                    nullZero(results[mainEndUses[i]]),
                ]);
            }

            for (var j =0; j < othersEndUses.length; j ++) {

                endUsesTable.endUsesOther.push([
                    othersEndUseNames[j],
                    nullZero(results[othersEndUses[j]]),
                ]);
            }

            for (var k =0; k < renewables.length; k ++) {

                endUsesTable.renewables.push([
                    renewablesNames[k],
                    nullZero(results[renewables[k]]),
                ]);
            }

            return endUsesTable;

    };

        $scope.setPrescriptiveTable = function(){


                 if ($scope.auxModel.prescriptive_resource === 0) {
                    $scope.prescriptiveTableIntensityText="Estimated Site EUI:";
                    $scope.prescriptiveTableResourceText="Estimated Site Energy Consumption:";
                    $scope.prescriptiveTableUnits="MBtu/yr";
                    $scope.prescriptiveTableIntensityUnits="kBtu/ft²-yr";
                } else if ($scope.auxModel.prescriptive_resource === 1) {
                    $scope.prescriptiveTableIntensityText="Estimated Source EUI:";
                    $scope.prescriptiveTableResourceText="Estimated Source Energy Consumption:";
                    $scope.prescriptiveTableUnits="MBtu/yr";
                    $scope.prescriptiveTableIntensityUnits="kBtu/ft²-yr";
                } else if ($scope.auxModel.prescriptive_resource === 2) {
                    $scope.prescriptiveTableIntensityText="Estimated TDV Intensity:";
                    $scope.prescriptiveTableResourceText="Estimated TDV Total:";
                    $scope.prescriptiveTableUnits="MBtu/yr";
                    $scope.prescriptiveTableIntensityUnits="kBtu/ft²-yr";
                } else if ($scope.auxModel.prescriptive_resource === 3) {
                    $scope.prescriptiveTableIntensityText="Estimated Carbon Intensity:";
                    $scope.prescriptiveTableResourceText="Estimated Total Carbon Emissions:";
                    $scope.prescriptiveTableUnits="Tons CO₂/yr";
                    $scope.prescriptiveTableIntensityUnits="lb CO₂/ft²-yr";
                }

        };



    $scope.computeBenchmarkResult = function(){

        $log.info($scope.submitArray);

        $scope.futures = benchmarkServices.getZNCMetrics($scope.submitArray);

        $q.resolve($scope.futures).then(function (results) {

            console.log(results);

            $scope.solarResults = $scope.getPropResponseField(results,"pvwatts_system_details");
            $scope.solarMonthly = (typeof $scope.solarResults === 'undefined') ? undefined : $scope.solarResults.outputs;

            $scope.buildingRequirements = $scope.setBuildingRequirements(results,"source");
            $scope.prescriptiveRequirements = $scope.setBuildingRequirements(results,"other");

            $scope.pv_capacity = (typeof $scope.buildingRequirements !== 'undefined') ? $scope.buildingRequirements.pv_capacity : undefined;

            $scope.endUses = $scope.computeEndUses(results);


        });
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

    $scope.setPrescriptiveRequirements = function(results, metric){
        if(metric === "source"){
            return $scope.getPropResponseField(results,"source_requirements");
        } else {
            return $scope.getPropResponseField(results,"prescriptive_requirements");
        }
    };

    $scope.setBuildingRequirements = function(results, metric){

        var prescriptive_requirements = $scope.setPrescriptiveRequirements(results,metric);

        if(prescriptive_requirements) {

            var building_sub_types = $scope.getPropResponseField(results,"building_sub_types");
            var building_size = $scope.getPropSize(building_sub_types);


            var sourceTable = {
                  "pv_area": ($scope.getPropResponseField(results,"pv_area")),
                  "pv_capacity": ($scope.getPropResponseField(results,"pv_capacity_kW")),
                  "building_energy": (prescriptive_requirements.prescriptive_building_energy),
                  "required": (prescriptive_requirements.prescriptive_re_total_needed),
                  "pv_potential": (prescriptive_requirements.re_rec_onsite_pv),
                  "procured": (prescriptive_requirements.prescriptive_re_procured),

                  "building_energy_norm": (prescriptive_requirements.prescriptive_building_energy / building_size * 1000),
                  "required_norm": (prescriptive_requirements.prescriptive_re_total_needed / building_size * 1000),
                  "pv_potential_norm": (prescriptive_requirements.re_rec_onsite_pv / building_size * 1000),
                  "procured_norm": (prescriptive_requirements.prescriptive_re_procured / building_size * 1000),

                  "prescriptive_resource": $scope.auxModel.prescriptive_resource
            };

            return sourceTable;

        } else {
            return undefined;
        }
    };

    $scope.computeEndUses = function(results){

        function nullZero(a) {
            if(a===0){
                return null;
            } else {
            return a;
            }
        }

        var endUses = ["Heating", "Cooling", "Interior Lighting", "Plug Loads", "Service Hot Water", "Fans"];
        var shortNames = ["htg", "clg", "intLgt", "intEqp", "swh", "fans"];
        var othersEndUses = ["Exterior Equipment","Exterior Light","Generators","Heat Recovery","Heat Rejection","Humidity Control","Pumps","Refrigeration"];
        var othersNames = ["extEqp","extLgt","gentor","heatRec","heatRej","humid","pumps","refrg"];


        var endUsesTable = {} ;
        endUsesTable.endUses = [] ;
        endUsesTable.endUsesOther = [] ;
        endUsesTable.endUsesTotal = [] ;


        var endUseResponse = $scope.getPropResponseField(results,"prescriptive_metrics");

        endUsesTable.eui = endUseResponse.site_eui;
        endUsesTable.energy = endUseResponse.site_energy / 1000; // this will be either MBtu or MWh



        for (var i =0; i < endUses.length; i ++) {

            endUsesTable.endUses.push([
                endUses[i],
                nullZero(endUseResponse.prescriptive_electricity_metric_data[shortNames[i]]),
                nullZero(endUseResponse.prescriptive_natural_gas_metric_data[shortNames[i]]),
                nullZero(endUseResponse.prescriptive_end_use_metric_data[shortNames[i]]),
                endUseResponse.prescriptive_end_use_metric_percents[shortNames[i]]*100
            ]);
        }

        for (var j =0; j < othersEndUses.length; j ++) {

            endUsesTable.endUsesOther.push([
                othersEndUses[j],
                nullZero(endUseResponse.prescriptive_electricity_metric_data[othersNames[j]]),
                nullZero(endUseResponse.prescriptive_natural_gas_metric_data[othersNames[j]]),
                nullZero(endUseResponse.prescriptive_end_use_metric_data[othersNames[j]]),
                endUseResponse.prescriptive_end_use_metric_percents[othersNames[j]]*100
            ]);
        }

        endUsesTable.endUsesTotal.push([
            "Total",
            endUseResponse.prescriptive_electricity_metric_data.net,
            endUseResponse.prescriptive_natural_gas_metric_data.net,
            endUseResponse.prescriptive_end_use_metric_data.net,
            100,
        ]);

        return endUsesTable;

    };

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

    $scope.$watch("csvData.siteMetrics", function (value) {

            if (value === undefined) {
                return;
            } else {
                $scope.submit();
            }
    });

    $scope.$watch("auxModel.reporting_units", function (value) {
        if (value === undefined) {
            return;
        }
        // only submit if the user has already CLICK on the submit button
        if ($scope.forms){
            if($scope.forms.hasValidated) {
                $scope.submit();
            }
        }
    });

    $scope.$watch("auxModel.prescriptive_resource", function (value) {

        if (value === undefined) {
            return;
        } else {

            $scope.submit();
        }
    });

    $scope.submit = function () {

        $scope.showSolar = false;
        $scope.showBar = false;

        if($scope.auxModel.approach === "prescriptive"){
            $scope.submitForm();
        } else {
            $scope.submitCSV();
        }
    };

    $scope.submitForm = function () {

        $scope.solarResults = null;
        $scope.endUses = null;
        $scope.buildingRequirements = null;

        if($scope.forms.baselineForm === undefined) {
            return;
        }
        $scope.forms.hasValidated = true; /// only check the field errors if this form has attempted to validate.

        if($scope.auxModel.reporting_units==="imperial"){
            $scope.tableEnergyUnits="(kBtu)";
            $scope.graphEnergyUnits="kBtu";
            $scope.tableBigEnergyUnits="MBtu/yr";
            $scope.tableEUIUnits="kBtu/ft²-yr";
            $scope.tableAreaUnits="(ft²)";

            if ($scope.auxModel.prescriptive_resource === 3) {
                $scope.barPlotUnits="lb CO₂/ft²-yr";
                $scope.prescriptiveTableUnits="Tons CO₂/yr";
                $scope.prescriptiveTableIntensityUnits="lb CO₂/ft²-yr";

            } else {
                $scope.barPlotUnits="kBtu/ft²-yr";
                $scope.prescriptiveTableUnits="MBtu/yr";
                $scope.prescriptiveTableIntensityUnits="kBtu/ft²-yr";
            }
        }else {
            $scope.tableEnergyUnits="(kWh)";
            $scope.graphEnergyUnits="kWh";
            $scope.tableBigEnergyUnits="MWh/yr";
            $scope.tableEUIUnits="kWh/m²-yr";
            $scope.tableAreaUnits="(m²)";

            if ($scope.auxModel.prescriptive_resource === 3) {
                $scope.barPlotUnits="kg CO₂/m²-yr";
                $scope.prescriptiveTableUnits="Metric Tons CO₂/yr";
                $scope.prescriptiveTableIntensityUnits="kg CO₂/m²-yr";
            } else {
                $scope.barPlotUnits="kWh/m²-yr";
                $scope.prescriptiveTableUnits="MWh/yr";
                $scope.prescriptiveTableIntensityUnits="kWh/m²-yr";
            }
        }

         if ($scope.auxModel.prescriptive_resource === 0) {
            $scope.prescriptiveTableIntensityText="Estimated Site EUI:";
            $scope.prescriptiveTableResourceText="Estimated Site Energy Consumption:";
        } else if ($scope.auxModel.prescriptive_resource === 1) {
            $scope.prescriptiveTableIntensityText="Estimated Source EUI:";
            $scope.prescriptiveTableResourceText="Estimated Source Energy Consumption:";
        } else if ($scope.auxModel.prescriptive_resource === 2) {
            $scope.prescriptiveTableIntensityText="Estimated TDV Intensity:";
            $scope.prescriptiveTableResourceText="Estimated TDV Total:";
        } else if ($scope.auxModel.prescriptive_resource === 3) {
            $scope.prescriptiveTableIntensityText="Estimated Carbon Intensity:";
            $scope.prescriptiveTableResourceText="Estimated Total Carbon Emissions:";

        }



        var getPropTypes = function () {

            var props = [];
            for (var i =0; i < $scope.propTypes.length; i ++) {
                props.push($scope.propTypes[i].propertyModel);
                }
            return props;
        };

        var getPVData = function () {

            var pv_data = [];
            for (var i =0; i < $scope.pvList.length; i ++) {
                pv_data.push($scope.pvList[i].pvModel);
                }
            return pv_data;
        };


        if($scope.forms.baselineForm.$valid){

            $scope.submitArray = [];

            if($scope.auxModel.approach === 'prescriptive'){
                $scope.auxModel.prop_types = getPropTypes();
                $scope.auxModel.pv_data = getPVData();

                $scope.submitArray.push($scope.auxModel);
                $scope.computeBenchmarkResult();
            } else {
                $scope.displayErrors();
            }


        }else {
            $scope.displayErrors();
        }

    };

        $scope.displayErrors = function () {
            $scope.submitErrors();
            $scope.benchmarkResult = null;
            $scope.buildingRequirements = null;
        };



        $scope.buildingProperties = {

            buildingType: {
                commercial: [
                    {id:"Office",name:"Office"},
                    {id:"Retail",name:"Retail"},
                    {id:"School",name:"School"},
                    {id:"Restaurant",name:"Restaurant"},
                    {id:"Hotel",name:"Hotel"},
                    {id:"Warehouse",name:"Warehouse"},
                    {id:"Apartment",name:"Apartment"}
                ]
            }
        };

        $scope.energyProperties = {

            energyType:[
                {id:"electricity",name:"Electricity"},
                {id:"natural_gas",name:"Natural Gas"},
                {id:"fuel_oil",name:"Fuel Oil"},
                {id:"propane",name:"Propane"},
                {id:"steam",name:"District Steam"},
                {id:"hot_water",name:"District Hot Water"},
                {id:"chilled_water",name:"District Chilled Water"},
                {id:"coal",name:"Coal"},
                {id:"other",name:"Diesel"},
                {id:"other",name:"Wood"},
                {id:"other",name:"Coke"},
                {id:"other",name:"Other"}
            ],

            energyUnits: [
                //<!--Electricity - Grid -->
                {id:"kBtu",name:"kBtu",filter_id:"electricity"},
                {id:"MBtu",name:"MBtu",filter_id:"electricity"},
                {id:"kWh",name:"kWh",filter_id:"electricity"},
                {id:"MWh",name:"MWh",filter_id:"electricity"},
                {id:"GJ",name:"GJ",filter_id:"electricity"},

                //<!--Natural Gas -->
                {id:"NG Mcf",name:"Mcf",filter_id:"natural_gas"},
                {id:"NG kcf",name:"kcf",filter_id:"natural_gas"},
                {id:"NG ccf",name:"ccf",filter_id:"natural_gas"},
                {id:"NG cf",name:"cf",filter_id:"natural_gas"},
                {id:"NGm3",name:"m³",filter_id:"natural_gas"},
                {id:"GJ",name:"GJ",filter_id:"natural_gas"},
                {id:"kBtu",name:"kBtu",filter_id:"natural_gas"},
                {id:"MBtu",name:"MBtu",filter_id:"natural_gas"},
                {id:"therms",name:"Therms",filter_id:"natural_gas"},

                //<!--Fuel Oil No. 1 -->
                {id:"kBtu",name:"kBtu",filter_id:"fuel_oil"},
                {id:"MBtu",name:"MBtu ",filter_id:"fuel_oil"},
                {id:"GJ",name:"GJ",filter_id:"fuel_oil"},

                //<!--Propane-->
                {id:"GJ",name:"GJ",filter_id:"propane"},
                {id:"kBtu",name:"kBtu",filter_id:"propane"},
                {id:"MBtu",name:"MBtu",filter_id:"propane"},
                {id:"Propane cf",name:"kcf",filter_id:"propane"},
                {id:"Propane ccf",name:"ccf",filter_id:"propane"},
                {id:"Propane kcf",name:"cf",filter_id:"propane"},
                {id:"Propane L",name:"L",filter_id:"propane"},
                {id:"Propane igal",name:"Gallons (Imperial)",filter_id:"propane"},
                {id:"Propane gal",name:"Gallons",filter_id:"propane"},

                //<!--District Steam-->
                {id:"GJ",name:"GJ",filter_id:"steam"},
                {id:"kBtu",name:"kBtu",filter_id:"steam"},
                {id:"MBtu",name:"MBtu",filter_id:"steam"},
                {id:"therms",name:"Therms",filter_id:"steam"},
                {id:"Steam lb",name:"Pounds",filter_id:"steam"},
                {id:"Steam klb",name:"k lbs",filter_id:"steam"},
                {id:"Steam Mlb",name:"M lbs",filter_id:"steam"},

                //<!--District Hot Water-->
                {id:"kBtu",name:"kBtu",filter_id:"hot_water"},
                {id:"MBtu",name:"MBtu",filter_id:"hot_water"},
                {id:"GJ",name:"GJ",filter_id:"hot_water"},
                {id:"therms",name:"Therms",filter_id:"hot_water"},

                //<!--District Chilled Water-->
                {id:"kBtu",name:"kBtu",filter_id:"chilled_water"},
                {id:"MBtu",name:"MBtu",filter_id:"chilled_water"},
                {id:"GJ",name:"GJ",filter_id:"chilled_water"},
                {id:"CHW TonH",name:"Ton Hours",filter_id:"chilled_water"},

                //<!--Coal-->
                {id:"kBtu",name:"kBtu",filter_id:"coal"},
                {id:"MBtu",name:"MBtu",filter_id:"coal"},
                {id:"GJ",name:"GJ",filter_id:"coal"},

                //<!--Other-->
                {id:"kBtu",name:"kBtu",filter_id:"other"},
                {id:"MBtu",name:"MBtu",filter_id:"other"},
                {id:"kWh",name:"kWh",filter_id:"other"},
                {id:"MWh",name:"MWh",filter_id:"other"},
                {id:"GJ",name:"GJ",filter_id:"other"}
                ]
        };

        $scope.prescriptiveResource = [
            {id:0,name:"Site"},
            {id:1,name:"Source"},
            {id:2,name:"TDV"},
            {id:3,name:"Carbon"}
        ];

        $scope.geographicProperties = {
            country : [],
            city : [],
            climate_info : [
                {id:"1",file_id:"0-24283"},
                {id:"2",file_id:"1-724957"},
                {id:"3",file_id:"1-724930"},
                {id:"4",file_id:"1-724945"},
                {id:"5",file_id:"1-723940"},
                {id:"6",file_id:"1-722956"},
                {id:"7",file_id:"1-722900"},
                {id:"8",file_id:"1-722976"},
                {id:"9",file_id:"1-722880"},
                {id:"10",file_id:"1-722869"},
                {id:"11",file_id:"1-725910"},
                {id:"12",file_id:"1-724839"},
                {id:"13",file_id:"0-93193"},
                {id:"14",file_id:"1-723820"},
                {id:"15",file_id:"1-722868"},
                {id:"16",file_id:"1-725845"}
            ],
            state: [
                {id:"AL",name:"Alabama",filter_id:"United States"},
                {id:"AK",name:"Alaska",filter_id:"United States"},
                {id:"AZ",name:"Arizona",filter_id:"United States"},
                {id:"AR",name:"Arkansas",filter_id:"United States"},
                //{id:"CA",name:"California",filter_id:"United States"},
                {id:"CO",name:"Colorado",filter_id:"United States"},
                {id:"CT",name:"Connecticut",filter_id:"United States"},
                {id:"DE",name:"Delaware",filter_id:"United States"},
                //{id:"DC",name:"District Of Columbia",filter_id:"United States"},
                {id:"FL",name:"Florida",filter_id:"United States"},
                {id:"GA",name:"Georgia",filter_id:"United States"},
                {id:"HI",name:"Hawaii",filter_id:"United States"},
                {id:"ID",name:"Idaho",filter_id:"United States"},
                {id:"IL",name:"Illinois",filter_id:"United States"},
                {id:"IN",name:"Indiana",filter_id:"United States"},
                {id:"IA",name:"Iowa",filter_id:"United States"},
                {id:"KS",name:"Kansas",filter_id:"United States"},
                {id:"KY",name:"Kentucky",filter_id:"United States"},
                {id:"LA",name:"Louisiana",filter_id:"United States"},
                {id:"ME",name:"Maine",filter_id:"United States"},
                {id:"MD",name:"Maryland",filter_id:"United States"},
                {id:"MA",name:"Massachusetts",filter_id:"United States"},
                {id:"MI",name:"Michigan",filter_id:"United States"},
                {id:"MN",name:"Minnesota",filter_id:"United States"},
                {id:"MS",name:"Mississippi",filter_id:"United States"},
                {id:"MO",name:"Missouri",filter_id:"United States"},
                {id:"MT",name:"Montana",filter_id:"United States"},
                {id:"NE",name:"Nebraska",filter_id:"United States"},
                {id:"NV",name:"Nevada",filter_id:"United States"},
                {id:"NH",name:"New Hampshire",filter_id:"United States"},
                {id:"NJ",name:"New Jersey",filter_id:"United States"},
                {id:"NM",name:"New Mexico",filter_id:"United States"},
                {id:"NY",name:"New York",filter_id:"United States"},
                {id:"NC",name:"North Carolina",filter_id:"United States"},
                {id:"ND",name:"North Dakota",filter_id:"United States"},
                {id:"OH",name:"Ohio",filter_id:"United States"},
                {id:"OK",name:"Oklahoma",filter_id:"United States"},
                {id:"OR",name:"Oregon",filter_id:"United States"},
                {id:"PA",name:"Pennsylvania",filter_id:"United States"},
                {id:"RI",name:"Rhode Island",filter_id:"United States"},
                {id:"SC",name:"South Carolina",filter_id:"United States"},
                {id:"SD",name:"South Dakota",filter_id:"United States"},
                {id:"TN",name:"Tennessee",filter_id:"United States"},
                {id:"TX",name:"Texas",filter_id:"United States"},
                {id:"UT",name:"Utah",filter_id:"United States"},
                {id:"VT",name:"Vermont",filter_id:"United States"},
                {id:"VA",name:"Virginia",filter_id:"United States"},
                {id:"WA",name:"Washington",filter_id:"United States"},
                {id:"WV",name:"West Virginia",filter_id:"United States"},
                {id:"WI",name:"Wisconsin",filter_id:"United States"},
                {id:"WY",name:"Wyoming",filter_id:"United States"},
                {id:"AB",name:"Alberta",filter_id:"Canada"},
                {id:"BC",name:"British Columbia",filter_id:"Canada"},
                {id:"MB",name:"Manitoba",filter_id:"Canada"},
                {id:"NB",name:"New Brunswick",filter_id:"Canada"},
                {id:"NL",name:"Newfoundland",filter_id:"Canada"},
                {id:"NS",name:"Nova Scotia",filter_id:"Canada"},
                {id:"NT",name:"Northwest Territories",filter_id:"Canada"},
                {id:"NU",name:"Nunavut",filter_id:"Canada"},
                {id:"ON",name:"Ontario",filter_id:"Canada"},
                {id:"PE",name:"Prince Edward Island",filter_id:"Canada"},
                {id:"QC",name:"Quebec",filter_id:"Canada"},
                {id:"SK",name:"Saskatchewan",filter_id:"Canada"},
                {id:"YT",name:"Yukon",filter_id:"Canada"}
            ]
        };







  };
  DashboardCtrl.$inject = ['$rootScope', '$scope', '$window','$sce','$timeout', '$q', '$log', 'benchmarkServices'];
  return {
    DashboardCtrl: DashboardCtrl,
    RootCtrl: RootCtrl    

  };
});
