angular.module('userService',[])
.factory("User", ['$http', function($http) {
  return {
    getList: function() {
      return $http.get('/users.json');
    },
    get: function(id) {
      return $http.get('/users/'+id+'.json');
    },
    post: function(user) {
      return $http.post('/users.json', user);
    },
    put: function(id, user) {
      return $http.put('/users/'+id+'.json', user);
    },
    destroy: function(id) {
      return $http.delete('/users/'+id+'.json');
    }
  }
}])
;
