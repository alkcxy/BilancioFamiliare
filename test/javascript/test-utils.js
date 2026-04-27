import angular from 'angular';
window.angular = angular;
require('angular-mocks');

export const module = angular.mock.module;
export const inject = angular.mock.inject;
