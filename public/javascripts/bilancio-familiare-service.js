angular.module('bilancioFamiliareService',['angular-jwt', 'angular.filter'])
.factory("Operation", ['$http', '$q', 'filterByFilter', function($http, $q, filterBy) {
  return {
    max: function() {
      return $http.get('/operations/max.json').then(function(resp) {
        var max = sessionStorage.getItem('max');
        console.log(max);
        console.log(resp.data.max);
        if (!max || max < resp.data.max) {
          sessionStorage.removeItem('operations');
          sessionStorage.setItem('max', resp.data.max);
          return false;
        }
        return true;
      });
    },
    getList: function() {
      return this.max().then(function(isCached) {
        var deferred = $q.defer();
        console.log(isCached);
        var operations = sessionStorage.getItem('operations');
        if (isCached && operations) {
          deferred.resolve({data: JSON.parse(operations)});
          return deferred.promise;
        } else {
          return $http.get('/operations.json').then(function(resp) {
            if (!sessionStorage.getItem('operations')) {
              sessionStorage.setItem('operations', JSON.stringify(resp.data));
            }
            return resp;
          });
        }
      });
    },
    get: function(id) {
      var deferred = $q.defer();
      var operations = sessionStorage.getItem('operations');
      if (operations) {
        operations = filterBy(JSON.parse(operations), ['id'], id, true);
        deferred.resolve({data: operations[0]});
        return deferred.promise;
      } else {
        return $http.get('/operations/'+id+'.json');
      }
    },
    put: function(id, operation) {
      return $http.put('/operations/'+id+'.json',operation);
    },
    post: function(operation) {
      return $http.post('/operations.json',operation);
    },
    month: function(year, month) {
      var deferred = $q.defer();
      var operations = sessionStorage.getItem('operations');
      if (operations) {
        operations = filterBy(JSON.parse(operations), ['year'], year, true);
        if (month[0] === "0") {
          month = month.substring(1);
        }
        operations = filterBy(operations, ['month'], month, true);
        deferred.resolve({data: operations});
        return deferred.promise;
      } else {
        return $http.get('/operations/'+year+'/'+month+'.json');
      }
    },
    year: function(year) {
      var deferred = $q.defer();
      var operations = sessionStorage.getItem('operations');
      if (operations) {
        operations = filterBy(JSON.parse(operations), ['year'], year, true);
        deferred.resolve({data: operations});
        return deferred.promise;
      } else {
        return $http.get('/operations/year/'+year+'.json');
      }
    },
    home: function() {
      var deferred = $q.defer();
      var operations = sessionStorage.getItem('operations');
      if (operations) {
        deferred.resolve({data: JSON.parse(operations)});
        return deferred.promise;
      } else {
        return $http.get('/home.json');
      }

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
