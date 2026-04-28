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
      templateUrl : '/templates/operations/new.html'
    })
    .when('/operations/:id', {
      templateUrl : '/templates/operations/show.html'
    })
    .when('/operations/:id/edit', {
      templateUrl : '/templates/operations/edit.html'
    })
    .when('/operations', {
      templateUrl : '/templates/operations/index.html'
    })
    .when('/operations/year/:year', {
      templateUrl : '/templates/operations/year.html'
    })
    .when('/operations/:year/:month', {
      templateUrl : '/templates/operations/month.html'
    })
    .when('/types', {
      templateUrl : '/templates/types/index.html'
    })
    .when('/types/new', {
      templateUrl : '/templates/types/new.html'
    })
    .when('/types/:id', {
      templateUrl : '/templates/types/show.html'
    })
    .when('/types/:id/edit', {
      templateUrl : '/templates/types/edit.html'
    })
    .when('/users', {
      templateUrl : '/templates/users/index.html'
    })
    .when('/users/new', {
      templateUrl : '/templates/users/new.html'
    })
    .when('/users/:id', {
      templateUrl : '/templates/users/show.html'
    })
    .when('/users/:id/edit', {
      templateUrl : '/templates/users/edit.html'
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
      templateUrl : '/templates/withdrawals/new.html'
    })
    .when('/withdrawals/:id', {
      templateUrl : '/templates/withdrawals/show.html'
    })
    .when('/withdrawals/:id/edit', {
      templateUrl : '/templates/withdrawals/edit.html'
    })
    // .when('/withdrawals/year/:year', {
    //   templateUrl : '/templates/withdrawals/year.html'
    // })
    // .when('/withdrawals/:year/:month', {
    //   templateUrl : '/templates/withdrawals/month.html'
    // })
    .when('/login', {
      templateUrl : '/templates/sessions/new.html'
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
