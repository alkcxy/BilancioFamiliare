angular.module('bilancioFamiliare', ['bilancioFamiliareRoute', 'bilancioFamiliareService', 'actionCableService',  'bilancioFamiliareDirectives', 'typesDirectives', 'usersDirectives', 'homeDirectives', 'angular.filter'])
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
