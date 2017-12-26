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
    post: function(operation) {
      return $http.post('/operations.json',operation);
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
    },
    get: function(id) {
      return $http.get('/users/'+id+'.json');
    },
    post: function(user) {
      return $http.post('/users.json', user);
    },
    put: function(id, user) {
      return $http.put('/users/'+id+'.json', user);
    }
  }
}])
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
