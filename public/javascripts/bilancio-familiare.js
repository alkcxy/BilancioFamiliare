angular.module('bilancioFamiliare', ['bilancioFamiliareRoute','bilancioFamiliareService','bilancioFamiliareDirectives', 'typesDirectives', 'usersDirectives', 'homeDirectives','angular.filter'])
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
// .config(['$provide', function($provide) {
//      var DEFAULT_TIMEZONE = 'GMT';
//
//      $provide.decorator('dateFilter', ['$delegate', '$injector', function($delegate, $injector) {
//        var oldDelegate = $delegate;
//
//        var standardDateFilterInterceptor = function(date, format, timezone) {
//          if(angular.isUndefined(timezone)) {
//            timezone = DEFAULT_TIMEZONE;
//          }00000
//          return oldDelegate.apply(this, [date, format, timezone]);
//        };
//
//        return standardDateFilterInterceptor;
//      }]);
// }]);
;
