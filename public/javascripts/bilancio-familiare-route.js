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
    .when('/operations/:year/:month', {
      templateUrl : 'pages/operations/month.html'
    })

});
