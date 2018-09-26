/**
 * Benchmark routes.
 */
define(['angular', './controllers', 'common'], function(angular, controllers) {
  'use strict';

  var mod = angular.module('benchmark.routes', ['benchmark.common']);
  mod.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/',  {templateUrl: 'javascripts/benchmark/benchmark.html',  controller:controllers.DashboardCtrl})
        .when('/usecase',  {templateUrl: 'javascripts/benchmark/usecase.html'});
  }]);
  return mod;
});
