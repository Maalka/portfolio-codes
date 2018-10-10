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
	mod.factory('apiServices',['sorting', function(sorting) {

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

		      //sorting buildings in each group by net energy type
					let filteredArr=[];
		      sorting.sortBuildings(buildingTypes);
		      let order=sorting.sortByHighestAverage(buildingTypes);
		      //reformat data for end use with including sorting by highest average order
		      order.forEach(function(item){
		        for(let v=0;v<buildingTypes[item].length;v++){
		          filteredArr.push(buildingTypes[item][v]);
		        }
		      });
		      //filteredArray is the array to be returned
		      return filteredArr;
		    }
		};
	}]);
	mod.factory('calculations',function(){
		return {
			totalScenario:function(endUse){
					let totalScenarioEnergy=0;
					let totalScenarioEui=0;
					endUse.forEach(function(item){
							totalScenarioEnergy+=Math.floor((item.energy.scenario)/1000);
							totalScenarioEui+=Math.floor(item.eui.scenario);
					});
					return {
						eui:totalScenarioEui,
						energy:totalScenarioEnergy
					};
			}
		};
	});
	mod.factory('sorting',function(){
		return {
			test:'sort',
			sort:function(endUses) {
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
	    },
		 sortBuildings:function(buildingTypes){
				//sorting buildings in each group by net energy type
				for(let building in buildingTypes){
					for(let i=0;i<buildingTypes[building].length;i++){
							this.sort(buildingTypes[building]);
					}
				}
			},
			 findTotalEnergy:function(buildingTypes){
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
			},
			 findAverageEnergy:function(buildingGroup){
						let averageArr=[];
						let totalEnergy=this.findTotalEnergy(buildingGroup);
						totalEnergy.forEach(function(item){
							let average=(item.total/item.size);
							averageArr.push({building:item.building,average:average});
						});
						return averageArr;
			},
		 sortByHighestAverage:function(buildingGroup){
						let buildingAverages=this.findAverageEnergy(buildingGroup);
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
		};
	});
	return mod;
});
