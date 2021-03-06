define(['angular', 'common'], function(angular) {
	'use strict';
	var mod = angular.module('benchmark.services', ['benchmark.common','benchmark.utilities']);


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

	mod.factory('model',['utilities',function(utilities){
		return {
			getKeyValues:function(key){
			var values=[];
				utilities.breakdownModel.forEach(function(model){
					values.push(model[key]);
				});
				return values;
			},
			getPrettyName:function(keyValue){
				var name;
				utilities.breakdownModel.forEach(function(model){
						if(model.key===keyValue){
								name=model.name;
						}
				});
				return name;
			},
			getColor:function(keyValue){
				var color;
				utilities.breakdownModel.forEach(function(model){
						if(model.key===keyValue){
								color=model.color;
						}
				});
				return color;
			}
		};

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
			},
			totalBase:function(endUse){
			let totalBaseEnergy=0;
			let totalBaseEui=0;
			endUse.forEach(function(item){
					totalBaseEnergy+=Math.floor((item.energy.base)/1000);
					totalBaseEui+=Math.floor(item.eui.base);
			});
			return {
				energy:totalBaseEnergy,
				eui:totalBaseEui
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
	mod.factory('series', ['model',function(model) {
		return {
		 create:function(endUse){
				let categories = [];
				let differences={
					eui:[],
					energy:[]
				};
				//Cooling, Ext. Equipment, Ext. Lighting,
				//Fans, Generator, Heat Recovery, Heat Rejection, Heating, Humidity, Int. Equipment, Int. Lighting, Pumps, Refrigeration, Hot Water
				let properties = {
					eui: {},
					energy: {}
				};
				model.getKeyValues('key').forEach(function(key){
	          properties.eui[key] = [];
	          properties.energy[key] = [];
	      });
				function convertToMBtus(value){
					return value/1000;
				}
				endUse.forEach(function(item){
						differences.eui.push(item.eui.difference);
						differences.energy.push(item.energy.difference);
						categories.push(item.building_name);
						for(let term in item.energy_breakdown){

								properties.energy[term].push({
									y:convertToMBtus(item.energy_breakdown[term]),
									difference:item.energy.difference,
									scenario:convertToMBtus(item.energy.scenario),
									base:convertToMBtus(item.energy.base),
									name:model.getPrettyName(term),
                  color:model.getColor(term)
								});
						}
						for(let term in item.eui_breakdown){
								properties.eui[term].push({
									y:item.eui_breakdown[term],
									difference:item.eui.difference,
									scenario:item.eui.scenario,
									base:item.eui.base,
									name:model.getPrettyName(term),
									color:model.getColor(term)
								});
						}

				});
				return {
					properties:properties,
					differences:differences,
					categories:categories
			};
		}
	};
}]);
	mod.factory('hcOptions',['model',function(model){
		return {
			showLabels:function(endUses){
					//if the difference in energy is equal to Zero
					//then we do not want to show the labels
					//because there has been no change from base
					if(endUses[0].energy.difference===0){
						return false;
					}else{
						return true;
					}
			},
			filterLegend:function(hcData){
				var inLegend=[];
				var hcDataTerms=model.getKeyValues('key');
				hcDataTerms.forEach(function(hcDataTerm){
					var total=0;
					for(var i=0;i<hcData.energy[hcDataTerm].length;i++){
							total+=hcData.energy[hcDataTerm][i].y;
					}
					if(total===0){
						inLegend.push(false);
					}else{
						inLegend.push(true);
					}
				});
				return inLegend;
		}
		};
	}]);

	return mod;
});
