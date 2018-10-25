
define(['angular', 'common'], function(angular) {
	'use strict';
	var mod = angular.module('benchmark.utilities',['benchmark.common']);
  mod.factory('utilities',function(){
    //'#1F2C5C', '#3F58CE', '#5D70D4', '#08B4BB', '#6BD2D6', '#06A1F9', '#0579BB', '#F5B569', '#EB885C', '#D4483D', '#64467D', '#9A6ECE','#06AED5','#564787','#000000','#000000'
    var breakdownModel=[
      {name: "Cooling",key:"clg", y: 233400, color: "#0579BB"},
      {name: "Ext. Equipment",key:"extEqp", y: 233400, color: "#06A1F9"},
      {name: "Ext. Lighting",key:"extLgt", y: 233400, color: "#FF8656"},
      {name: "Fans",key:"fans", y: 233400, color: "#1F2C5C"},
      {name: "Generator",key:"gentor", y: 233400, color: "#3F58CE"},
      {name: "Heat Recovery",key:"heatRec", y: 233400, color: "#901314"},
      {name: "Heat Rejection",key:"heatRej", y: 233400, color: "#1A1A1A"},
      {name: "Heating",key:"htg" ,y: 233400, color: "#D4483D"},
      {name: "Humidity",key:"humid", y: 233400, color: "#70DDFB"},
      {name: "Int. Equipment",key:"intEqp", y: 233400, color: "#64467D"},
      {name: "Int. Lighting",key:"intLgt", y: 233400, color: "#FEBB67"},
      {name: "Pumps",key:"pumps", y: 233400, color: "#08B4BB"},
      {name: "Refrigeration",key:"refrg", y: 233400, color: "#918EC1"},
      {name: "Hot Water",key:"swh", y: 233400, color: "#54545E"}, 
      {name: "net",key:"net" ,y: 233400, color: "#06AED5"},
    ];
    return {
      breakdownModel:breakdownModel
    };
  });
	return mod;
});
