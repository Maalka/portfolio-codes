define(['angular', 'common'], function(angular) {
	'use strict';
	var mod = angular.module('benchmark.services', ['benchmark.common']);
	mod.service('benchmarkServices', ['playRoutes', function(playRoutes) {
		var services = {
			'getEnergyMetrics': function(model) {
				return playRoutes.controllers.BaselineController.getEnergyMetrics().post(model).then(function (response)  {
					/// handle errors (500 etc)
					return response.data;
				});
			}
		};
		return services;
	}]);
	mod.factory('apiServices', function() {

		return{
			getEndUse:function(endPoints,key){
						let endUse;
		 				endPoints.values.some(function(item){
						if(key === Object.keys(item)[0]){
								endUse=item[key];
								return true;
						}
				});
				return endUse;
			},
			attachDifferences:function(endUses,energyDiff,euiDiff){
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
				return endUses;
			},
			groupByBuildingType:function(endUses) {
		      //building types for overarching groups defined
		      //inital order of the building groupings
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

					/*
		      //sorting buildings in each group by net energy type
					let filteredArr=[];
		      sortBuildings(buildingTypes);
		      let order=sortByHighestAverage(buildingTypes);
		      //reformat data for end use with including sorting by highest average order
		      order.forEach(function(item){
		        for(let v=0;v<buildingTypes[item].length;v++){
		          filteredArr.push(buildingTypes[item][v]);
		        }
		      });
		      //filteredArray is the array to be returned
					*/
		      return buildingTypes;
		    }
		};
	});
	mod.factory('sorting',function(){
		return {
			sort:'test'
		};
	});
	return mod;
});
