/**
 * Common functionality.
 */
define(['angular', './services/helper', './services/playRoutes', './filters', './semantic', './popover_service',
    'angular-file-upload',
	'./directives/building_info',
	'./directives/bar',
	'./directives/required',
	'./directives/files'
	],
    function(angular) {
  'use strict';

  return angular.module('benchmark.common', ['common.helper', 'common.playRoutes', 'common.filters',
    'common.semantic', 'common.PopoverService', 'ngFileUpload']);
});


