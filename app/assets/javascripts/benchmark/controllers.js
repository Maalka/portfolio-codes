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


    $scope.auxModel = {};

    $scope.auxModel.country = 'United States';
    $scope.auxModel.state = "CA";
    $scope.auxModel.climate_zone = null;
    $scope.auxModel.reporting_units = "imperial";
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
        $scope.benchmarkResult = null;

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


    $scope.submitCSV = function () {

            if ($scope.csvData) {
                console.log($scope.csvData);
            } else {
                console.log("No CSV Processed.");
            }

    };

    $scope.computeBenchmarkResult = function(){

        $log.info($scope.submitArray);

        $scope.futures = benchmarkServices.getEnergyMetrics($scope.submitArray);

        $q.resolve($scope.futures).then(function (results) {

            console.log(results);

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


    $scope.computeEndUses = function(results){

        console.log(results);
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
//
//        for (var j =0; j < othersEndUses.length; j ++) {
//
//            endUsesTable.endUsesOther.push([
//                othersEndUses[j],
//                nullZero(endUseResponse.prescriptive_electricity_metric_data[othersNames[j]]),
//                nullZero(endUseResponse.prescriptive_natural_gas_metric_data[othersNames[j]]),
//                nullZero(endUseResponse.prescriptive_end_use_metric_data[othersNames[j]]),
//                endUseResponse.prescriptive_end_use_metric_percents[othersNames[j]]*100
//            ]);
//        }
//
//        endUsesTable.endUsesTotal.push([
//            "Total",
//            endUseResponse.prescriptive_electricity_metric_data.net,
//            endUseResponse.prescriptive_natural_gas_metric_data.net,
//            endUseResponse.prescriptive_end_use_metric_data.net,
//            100,
//        ]);
//
//        return endUsesTable;

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

    $scope.submit = function () {

        if($scope.auxModel.approach === "manual"){
            $scope.submitForm();
        } else {
            $scope.submitCSV();
        }
    };

    $scope.submitForm = function () {

        $scope.endUses = null;
        $scope.buildingRequirements = null;


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

            $scope.computeBenchmarkResult();

        }else {
            $scope.displayErrors();
        }

    };

        $scope.displayErrors = function () {
            $scope.submitErrors();
            $scope.benchmarkResult = null;
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
