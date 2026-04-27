const $ = require('jquery');
const angular = require('angular');

window.$ = window.jQuery = $;
window.angular = angular;

require('angular-mocks/angular-mocks');

window.angularModule = window.angular.mock.module;
window.angularInject = window.angular.mock.inject;

// Mock bootstrap popover
$.fn.popover = jasmine.createSpy('popover').and.callFake(function() { return $.fn; });

// Mock ActionCable
const mockSubscription = {
  connected: jasmine.createSpy('connected'),
  disconnected: jasmine.createSpy('disconnected'),
  received: jasmine.createSpy('received'),
};

const mockSubscriptions = {
  create: jasmine.createSpy('create').and.returnValue(mockSubscription)
};

const mockConsumer = {
  subscriptions: mockSubscriptions
};

window.ActionCable = {
  createConsumer: jasmine.createSpy('createConsumer').and.returnValue(mockConsumer),
  _mockSubscription: mockSubscription,
  _mockSubscriptions: mockSubscriptions,
  _mockConsumer: mockConsumer
};

// Require all tests
const testsContext = require.context('../../app/javascript', true, /\.test\.js$/);
testsContext.keys().forEach(testsContext);
