import './config/bilancio-familiare-route.js';
import './filters/bilancio-filters.js'
import './service/action-cable-service.js';
import './service/month-service.js';
import './service/operation-service.js';
import './service/session-service.js';
import './service/type-service.js';
import './service/user-service.js';
import './util/form-repeater';
import './directives/filters-directives.js';
import './directives/auth-directives.js';
import './directives/home-directives.js';
import './directives/operations-directives.js';
import './directives/types-directives.js';
import './directives/users-directives.js';
angular.module('bilancioFamiliare', ['bilancioFamiliareRoute', 'actionCableService',  'operationsDirectives', 'authDirectives', 'typesDirectives', 'usersDirectives', 'homeDirectives', 'angular.filter', 'ngAnimate', 'filtersDirectives'])
.config(function Config($httpProvider, jwtOptionsProvider, channelProvider) {
  // Please note we're annotating the function so that the $injector works when the file is minified
  jwtOptionsProvider.config({
    tokenGetter: [function() {
      return sessionStorage.getItem('token');
    }],
    unauthenticatedRedirectPath: '/login'
  });

  $httpProvider.interceptors.push('jwtInterceptor');

  channelProvider.config();
})
.run(function(authManager) {
  authManager.redirectWhenUnauthenticated();
})
;
