// create the module and name it scotchApp
angular.module('bilancioFamiliareRoute', ['ngRoute','actionCableService'])

// configure our routes
.config(["$routeProvider", function($routeProvider) {
  $routeProvider

    // route for the home page
    .when('/', {
      template : '<home></home>'
    })
    .when('/operations/new', {
      templateUrl : 'pages/operations/new.html'
    })
    .when('/operations/:id', {
      templateUrl : 'pages/operations/show.html'
    })
    .when('/operations/:id/edit', {
      templateUrl : 'pages/operations/edit.html'
    })
    .when('/operations', {
      templateUrl : 'pages/operations/index.html'
    })
    .when('/operations/year/:year', {
      templateUrl : 'pages/operations/year.html'
    })
    .when('/operations/:year/:month', {
      templateUrl : 'pages/operations/month.html'
    })
    .when('/types', {
      templateUrl : 'pages/types/index.html'
    })
    .when('/types/new', {
      templateUrl : 'pages/types/new.html'
    })
    .when('/types/:id', {
      templateUrl : 'pages/types/show.html'
    })
    .when('/types/:id/edit', {
      templateUrl : 'pages/types/edit.html'
    })
    .when('/users', {
      templateUrl : 'pages/users/index.html'
    })
    .when('/users/new', {
      templateUrl : 'pages/users/new.html'
    })
    .when('/users/:id', {
      templateUrl : 'pages/users/show.html'
    })
    .when('/users/:id/edit', {
      templateUrl : 'pages/users/edit.html'
    })
    .when('/withdrawals', {
      template : '<withdrawals></withdrawals>'
    })
    .when('/withdrawals/all', {
      template : '<withdrawals-all></withdrawals-all>'
    })
    .when('/withdrawals/archive', {
      template : '<withdrawals-archive></withdrawals-archive>'
    })
    .when('/withdrawals/new', {
      templateUrl : 'pages/withdrawals/new.html'
    })
    .when('/withdrawals/:id', {
      templateUrl : 'pages/withdrawals/show.html'
    })
    .when('/withdrawals/:id/edit', {
      templateUrl : 'pages/withdrawals/edit.html'
    })
    // .when('/withdrawals/year/:year', {
    //   templateUrl : 'pages/withdrawals/year.html'
    // })
    // .when('/withdrawals/:year/:month', {
    //   templateUrl : 'pages/withdrawals/month.html'
    // })
    .when('/login', {
      templateUrl : 'pages/sessions/new.html'
    })
    .when('/logout', {
      resolve:{
        "check":["Session", "$location", "$rootScope", 'channel', function(sessionService, location, rootScope, channel){
          delete rootScope.current_user.id;
          sessionStorage.removeItem('token');
          channel.connect();
          location.path("/login");
        }]
      }
    });

}]);
