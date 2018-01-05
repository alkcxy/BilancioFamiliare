angular.module('operationService',['angular-jwt', 'angular.filter'])
.factory("Operation", ['$http', '$q', 'filterByFilter', function($http, $q, filterBy) {
  var filterValidAttributes = function(operation) {
    var o = operation.operation;
    var o2 = {}
    o2.date = o.date.getFullYear()+"-"+(o.date.getMonth()+1)+"-"+o.date.getDate();
    o2.type_id = o.type_id;
    o2.user_id = o.user_id;
    o2.sign = o.sign;
    o2.amount = o.amount;
    o2.note = o.note;
    if (o.repeat) {
      o2.repeat = o.repeat;
      o2.interval_repeat = o.interval_repeat;
      o2.type_repeat = o.interval_repeat;
      o2.wday_repeat = o.wday_repeat;
      o2.week_repeat = o.week_repeat;
      o2.last_date_repeat = o.last_date_repeat.getFullYear()+"-"+(o.last_date_repeat.getMonth()+1)+"-"+o.last_date_repeat.getDate();
    }
    return {operation: o2};
  }
  return {
    max: function() {
      return $http.get('/operations/max.json').then(function(resp) {
        var max = sessionStorage.getItem('max');
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
      return $http.put('/operations/'+id+'.json', filterValidAttributes(operation));
    },
    post: function(operation) {
      return $http.post('/operations.json', filterValidAttributes(operation));
    },
    destroy: function(id) {
      return $http.delete('/operations/'+id+'.json');
    },
    month: function(year, month) {
      var deferred = $q.defer();
      var operations = sessionStorage.getItem('operations');
      if (operations) {
        operations = filterBy(JSON.parse(operations), ['year'], year, true);
        if (month[0] === "0" || month[0] === 0) {
          month = (month+"").substring(1);
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
      return this.max().then(function(isCached) {
        var deferred = $q.defer();
        var operations = sessionStorage.getItem('operations');
        if (isCached && operations) {
          deferred.resolve({data: JSON.parse(operations)});
          return deferred.promise;
        } else {
          return $http.get('/home.json');
        }
      });
    }
  }
}])
;
