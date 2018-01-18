angular.module('operationService',['angular-jwt', 'angular.filter'])
.factory("Operation", ['$http', '$q', 'filterByFilter', 'groupByFilter', function($http, $q, filterBy, groupBy) {
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
    max: function(year) {
      return $http.get('/operations/max.json').then(function(resp) {
        var max = sessionStorage.getItem('max');
        if (!max) {
          max = [];
        } else {
          try {
            max = JSON.parse(max);
          } catch(e) {
            max = [];
          }
        }
        resp.data.forEach(function(el) {
          var actualMax = max.filter(function(elem) {
            return elem.year === el.year;
          });
          if (actualMax && actualMax[0] && actualMax[0].max) {
            if (el.max > actualMax[0].max) {
              actualMax[0].max = el.max;
              sessionStorage.removeItem(el.year);
            }
          } else {
            max.push(el);
            sessionStorage.removeItem(el.year);
          }
        });
        sessionStorage.setItem('max', JSON.stringify(max));
        if (year) {
          var operations = sessionStorage.getItem(year);
          if (operations) {
            operations = JSON.parse(operations);
          }
          return operations;
        } else {
          var defer = $q.defer();
          var promises = [];
          var operations = [];
          max.forEach(function(el) {
            var operationYear = sessionStorage.getItem(el.year);
            if (operationYear) {
              operationYear = JSON.parse(operationYear)
              var deferred = $q.defer();
              deferred.resolve({data: operationYear});
              promises.push(deferred.promise);
            } else {
              promises.push($http.get('/operations/year/'+el.year+'.json'))
            }
          });
          return $q.all(promises).then(function(p) {
            p.forEach(function(operationYear) {
              if (operationYear.data && operationYear.data.length > 0) {
                sessionStorage.setItem(operationYear.data[0].year, JSON.stringify(operationYear.data));
                operations.push.apply(operations, operationYear.data);
              }
            });
            return operations;
          });
        }
      });
    },
    getList: function() {
      return this.max().then(function(operations) {
        var deferred = $q.defer();
        if (operations.length > 0) {
          var max = sessionStorage.getItem('max');
          max = JSON.parse(max);
          deferred.resolve({data: operations});
          return deferred.promise;
        } else {
          return $http.get('/operations.json').then(function(resp) {
            var operations = resp.data
            var max = sessionStorage.getItem('max');
            max = JSON.parse(max);
            max.forEach(function(elem) {
              var operationYear = operations.filter(function(el) {
                return elem.year === el.year;
              })
              if (operationYear) {
                sessionStorage.setItem(elem.year, JSON.stringify(operationYear));
              }
            });
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
      return this.max(year).then(function(operations) {
        var deferred = $q.defer();
        if (month[0] === "0" || month[0] === 0) {
          month = (month+"").substring(1);
        }
        if (operations && operations.length > 0) {
          operations = filterBy(operations, ['month'], month, true);
          deferred.resolve({data: operations});
          return deferred.promise;
        } else {
          return $http.get('/operations/year/'+year+'.json').then(function(resp) {
            var operations = resp.data;
            sessionStorage.setItem(year, JSON.stringify(operations));
            return {data: filterBy(operations, ['month'], month, true)};
          });
        }
      });
    },
    year: function(year) {
      return this.max(year).then(function(operations) {
        var deferred = $q.defer();
        if (operations && operations.length > 0) {
          deferred.resolve({data: operations});
          return deferred.promise;
        } else {
          return $http.get('/operations/year/'+year+'.json').then(function(resp) {
            sessionStorage.setItem(year, JSON.stringify(resp.data));
            return resp;
          });
        }
      });
    }
  }
}])
;
