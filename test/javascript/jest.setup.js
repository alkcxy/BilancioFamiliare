const $ = require('jquery');
global.$ = global.jQuery = $;

const angular = require('angular');
global.angular = window.angular = angular;

require('angular-mocks');

global.angularMock = window.angular.mock;
global.inject = window.inject;
global.module = window.module;

// Mock bootstrap popover
$.fn.popover = jest.fn().mockReturnValue($.fn);

// Mock ActionCable
global.ActionCable = {
  createConsumer: jest.fn(() => ({
    subscriptions: {
      create: jest.fn(() => ({
        connected: jest.fn(),
        disconnected: jest.fn(),
        received: jest.fn(),
      }))
    }
  }))
};
