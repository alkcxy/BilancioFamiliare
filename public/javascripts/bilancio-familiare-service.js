angular.module('bilancioFamiliareService',[])
.factory("Operation", ['$http', function($http) {
  return {
    getList: function() {
      return $http.get('/operations.json');
    },
    get: function(id) {
      return $http.get('/operations/'+id+'.json');
    },
    month: function(year, month) {
      return $http.get('/operations/'+year+'/'+month+'.json');
    },
    monthIn: function(year, month) {
      return $http.get('/operations/'+year+'/'+month+'/in.json');
    },
    monthOut: function(year, month) {
      return $http.get('/operations/'+year+'/'+month+'/out.json');
    }
  }
}]);
