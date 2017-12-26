angular.module('bilancioFamiliareService',['angular-jwt'])
.factory("Operation", ['$http', function($http) {
  return {
    getList: function() {
      return $http.get('/operations.json');
    },
    get: function(id) {
      return $http.get('/operations/'+id+'.json');
    },
    put: function(id, operation) {
      return $http.put('/operations/'+id+'.json',operation);
    },
    month: function(year, month) {
      return $http.get('/operations/'+year+'/'+month+'.json');
    },
    year: function(year) {
      return $http.get('/operations/year/'+year+'.json');
    }
  }
}])
.factory("User", ['$http', function($http) {
  return {
    getList: function() {
      return $http.get('/users.json');
    }
  }
}])
.factory("Type", ['$http', function($http) {
  return {
    getList: function() {
      return $http.get('/types.json');
    }
  }
}])
.factory("Session", ['$http', function($http) {
  return {
    login: function(email, password) {
      return $http.post('/login.json', {email: email, password: password});
    },
    logout: function() {
      return $http.delete('/logout');
    }
  }
}])
;
