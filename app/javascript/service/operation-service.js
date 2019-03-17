angular.module('operationService',['angular-jwt', 'angular.filter'])
.factory("Operation", ['$http', '$q', 'filterByFilter', 'groupByFilter', function($http, $q, filterBy, groupBy) {
  var filterValidAttributes = function(operation) {
    var o = operation.operation;
    var o2 = {};
    o2.date = o.date.getFullYear()+"-"+(o.date.getMonth()+1)+"-"+o.date.getDate();
    o2.type_id = o.type_id;
    o2.user_id = o.user_id;
    o2.sign = o.sign;
    o2.amount = o.amount;
    o2.note = o.note;
    if (o.repeat) {
      o2.repeat = o.repeat;
      o2.interval_repeat = o.interval_repeat;
      o2.type_repeat = o.type_repeat;
      o2.wday_repeat = o.wday_repeat;
      o2.week_repeat = o.week_repeat;
      o2.last_date_repeat = o.last_date_repeat.getFullYear()+"-"+(o.last_date_repeat.getMonth()+1)+"-"+o.last_date_repeat.getDate();
    }
    return {operation: o2};
  };
  var limit_amount = function(spending_limit, opDate) {
    let checkers = Object.keys(spending_limit).filter(function(key) {
      if (isNaN(key)) {
        return false;
      }
      let date = new Date(opDate)
      return (spending_limit[key].year < date.getFullYear()) || (spending_limit[key].year === date.getFullYear() && spending_limit[key].month <= date.getMonth()+1);
    }).map(function(key) {
      return spending_limit[key]
    }).sort(function(keyA, keyB){
      if (keyA.year === keyB.year) {
        return keyB.month - keyA.month
      } else {
        return keyB.year - keyA.year
      }
    });
    if (checkers.length > 0) {
      return checkers[0];
    }
  };
  var if_spending_limit = function(spending_limit, operation, operationAmountSum) {
    let checkers = limit_amount(spending_limit, operation.date)
    if (checkers && checkers.amount < operationAmountSum) {
      return true;
    }
    return false;
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
        max = max.sort(function(a,b) {
          return b.year - a.year;
        });
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
        return max;
      });
    },
    getList: function() {
      return this.max().then(function(max) {
        var defer = $q.defer();
        var promises = [];
        var operations = [];
        max.forEach(function(el) {
          var operationYear = sessionStorage.getItem(el.year);
          if (operationYear) {
            operationYear = JSON.parse(operationYear);
            var deferred = $q.defer();
            deferred.resolve({data: operationYear});
            promises.push(deferred.promise);
          } else {
            promises.push($http.get('/operations/year/'+el.year+'.json'));
          }
        });
        $q.all(promises).then(function(p) {
          p.forEach(function(operationYear) {
            if (operationYear.data && operationYear.data.length > 0) {
              sessionStorage.setItem(operationYear.data[0].year, JSON.stringify(operationYear.data));
            }
          });
        });
        return promises;
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
      return this.max(year).then(function(max) {
        var promise = null;
        if (month[0] === "0" || month[0] === 0) {
          month = (month+"").substring(1);
        }
        var operationYear = sessionStorage.getItem(year);
        if (operationYear) {
          operationYear = JSON.parse(operationYear);
          var deferred = $q.defer();
          deferred.resolve({data: operationYear});
          promise = deferred.promise;
        } else {
          promise = $http.get('/operations/year/'+year+'.json');
        }
        return promise.then(function(operationYear) {
          if (operationYear.data && operationYear.data.length > 0) {
            sessionStorage.setItem(year, JSON.stringify(operationYear.data));
            return {data: filterBy(operationYear.data, ['month'], month, true)};
          }
          return {data:[]};
        });
      });
    },
    year: function(year) {
      return this.max(year).then(function(max) {
        var promise = null;
        var operationYear = sessionStorage.getItem(year);
        if (operationYear) {
          operationYear = JSON.parse(operationYear);
          var deferred = $q.defer();
          deferred.resolve({data: operationYear});
          promise = deferred.promise;
        } else {
          promise = $http.get('/operations/year/'+year+'.json');
        }
        return promise.then(function(operationYear) {
          if (operationYear.data && operationYear.data.length > 0) {
            sessionStorage.setItem(year, JSON.stringify(operationYear.data));
            return operationYear;
          }
          return {data:[]};
        });
      });
    },
    years: function(year) {
      if (typeof year === "number") {
        return $q.all([this.year(year), this.year(year-1)]);
      } else if (year instanceof Array) {
        var operationService = this;
        return $q.all(year.map(function(year) {
          return operationService.year(year);
        }));
      }
    },
    spending_limit_cap: function(operation, type, operationAmountSum) {
      let ret = null;
      if (operation.sign === '-') {
        if (type.spending_limit) {
          let spending_limit = type.spending_limit;
          if (spending_limit && if_spending_limit(spending_limit, operation, operationAmountSum)) {
            ret = 1;
          } else {
          }
        } else if (type.spending_roof && type.spending_roof < operationAmountSum) {
          ret = 0;
        }
      }
      return ret
    },
    spending_limit_amount: function(spending_limit, opDate) {
      return limit_amount(spending_limit, opDate)
    }
  };
}])
;
