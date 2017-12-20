// create the module and name it scotchApp
angular.module('bilancioFamiliareRoute', ['ngRoute'])

// configure our routes
.config(function($routeProvider) {
  $routeProvider

    // route for the home page
    .when('/', {
      templateUrl : 'pages/home.html'
    })
    .when('/operations/:id', {
      templateUrl : 'pages/operations/show.html'
    })
    .when('/operations/year/:year', {
      templateUrl : 'pages/operations/year.html'
    })
    .when('/operations/:year/:month', {
      templateUrl : 'pages/operations/month.html'
    })
    .when('/login', {
      templateUrl : 'pages/sessions/new.html'
    })
    .when('/login', {
      templateUrl : 'pages/sessions/new.html'
    })
    .when('/logout', {
      resolve:{
        "check":["Session", "$location", "$rootScope", function(sessionService, location, rootScope){
          sessionService.logout().then(function(resp) {
            delete rootScope.current_user.id
            sessionStorage.removeItem('token');
            location.path("/login");
          });
        }]
      }
    })

});
