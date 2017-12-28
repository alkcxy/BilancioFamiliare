angular.module('bilancioFamiliare', ['bilancioFamiliareRoute','bilancioFamiliareService','bilancioFamiliareDirectives', 'typesDirectives', 'usersDirectives','angular.filter'])
.config(function Config($httpProvider, jwtOptionsProvider) {
  // Please note we're annotating the function so that the $injector works when the file is minified
  jwtOptionsProvider.config({
    tokenGetter: [function() {
      return sessionStorage.getItem('token');
    }],
    unauthenticatedRedirectPath: '/login'
  });

  $httpProvider.interceptors.push('jwtInterceptor');
})
.run(function(authManager) {
  authManager.redirectWhenUnauthenticated();
})
;
