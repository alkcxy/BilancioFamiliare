angular.module('typeService',[])
.factory("Type", ['$http', function($http) {
  return {
    getList: function() {
      return $http.get('/types.json');
    },
    get: function(id) {
      return $http.get('/types/'+id+'.json');
    },
    post: function(type) {
      return $http.post('/types.json', type);
    },
    put: function(id, type) {
      return $http.put('/types/'+id+'.json', type);
    },
    destroy: function(id) {
      return $http.delete('/types/'+id+'.json');
    }
  }
}])
;
