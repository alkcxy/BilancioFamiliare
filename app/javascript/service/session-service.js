angular.module('sessionService',[])
.factory("Session", ['$http', function($http) {
  return {
    login: function(email, password) {
      return $http.post('/login.json', {email: email, password: password});
    },
    logout: function() {
      return $http.delete('/logout');
    }
  };
}])
;
