angular.module('operationsDirectives',['operationService','angular.filter','chart.js', 'actionCableService', 'monthService'])
.component("operationShow", {
  controller: ['Operation', '$routeParams', '$location', function(operationService, routeParams, location) {
    const ctrl = this;
    ctrl.$onInit = function() {
      operationService.get(routeParams.id).then(function(resp) {
        resp.data.date = new Date(resp.data.year, resp.data.month-1, resp.data.day);
        ctrl.operation = resp.data;
      });
    };
    ctrl.destroy = function(id) {
      operationService.destroy(id).then(function(resp) {
        location.path('/');
      });
    };
  }],
  templateUrl: "pages/operations/_operation.html"
})
.component('operationsList', {
  controller: ['Operation', '$location', 'channel', '$scope', function(operationService, location, channel, $scope) {
    const ctrl = this;
    let previousOperations;
    ctrl.$onInit = function() {
      operationService.getList().then(function(promises) {
        $scope.$broadcast('years',true);
        promises.forEach(function(promise) {
          promise.then(function(resp) {
            if (ctrl.operations) {
              ctrl.operations.push.apply(ctrl.operations, resp.data);
            } else {
              ctrl.operations = resp.data;
            }
          });
        });
      });
    };
    ctrl.$postLink = function() {
      ctrl.operationsUpdate = function(e, operations){
        $scope.$apply(function() {
          let max = JSON.parse(sessionStorage.getItem("max"))
          ctrl.operations = [];
          max.forEach(function(maxYear) {
            ctrl.operations.push.apply(ctrl.operations, JSON.parse(sessionStorage.getItem(maxYear.year)))
          })
        });
      };
      $(document).on('operations.update', ctrl.operationsUpdate);
    };
    ctrl.$onDestroy = function() {
      $(document).off('operations.update', ctrl.operationsUpdate);
    };
    ctrl.destroy = function(id) {
      operationService.destroy(id).then(function(resp) {
        for (let i = 0; i < ctrl.operations.length; i++) {
          let operation = ctrl.operations[i];
          if (operation.id === parseInt(id)) {
            ctrl.operations.splice(i, 1);
            break;
          }
        }
      });
    };
  }],
  templateUrl: "pages/operations/_operations.html"
})
.component("tableMonth", {
  controller: ["Operation", "$routeParams", "$scope", "filterByFilter", "filterByOrFilter", "filterSortObjectPropsFilter", function(operationService, routeParams, $scope, filterBy, filterByOr, filterSortObjectProps) {
    const ctrl = this;
    ctrl.$onInit = function() {
      operationService.month(routeParams.year, routeParams.month).then(function(resp) {
        ctrl.operations = resp.data;
        ctrl.operationsBack = angular.copy(ctrl.operations);
        ctrl.operationsObject = {"-":{}, "+":{}};
        ctrl.operations.forEach(function(operation) {
          if (!ctrl.operationsObject[operation.sign][operation.type.name] || !ctrl.operationsObject[operation.sign][operation.type.name].length) {
            ctrl.operationsObject[operation.sign][operation.type.name] = [];
          }
          ctrl.operationsObject[operation.sign][operation.type.name].push(operation);
        });
        filterSortObjectProps(ctrl.operationsObject);
        console.log(ctrl.operationsObject);
      });
    };
    $scope.$on('changedTypes', function(e,data) {
      ctrl.types = data;
      ctrl.operations = angular.copy(ctrl.operationsBack);
      //ctrl.operations = filterBy(ctrl.operations, ['year'], routeParams.year, true);
      if (ctrl.types && ctrl.types.length > 0) {
        console.log(ctrl.types);
        ctrl.operations = filterByOr(ctrl.operations, 'type.id', ctrl.types);
      }
      let operationsObject = {"-":{}, "+":{}};
      ctrl.operations.forEach(function(operation) {
        if (!operationsObject[operation.sign][operation.type.name]) {
          operationsObject[operation.sign][operation.type.name] = [];
        }
        operationsObject[operation.sign][operation.type.name].push(operation);
      });
      console.log(operationsObject);
      ctrl.operationsObject["-"] = operationsObject["-"];
      ctrl.operationsObject["+"] = operationsObject["+"];
      filterSortObjectProps(ctrl.operationsObject);
    });
    ctrl.$postLink = function() {
      ctrl.operationsUpdate = function(e){
        $scope.$apply(function() {
          let month =routeParams.month;
          if (month[0] === "0") {
            month = month.substring(1);
          }
          let operations = JSON.parse(sessionStorage.getItem(routeParams.year))
          ctrl.operations = operations.filter(function() {
            return operations.year === routeParams.year && operations.month === month;
          });
          ctrl.operationsObject["-"]={};
          ctrl.operationsObject["+"]={};
          ctrl.operations.forEach(function(operation) {
            if (!ctrl.operationsObject[operation.sign][operation.type.name]) {
              ctrl.operationsObject[operation.sign][operation.type.name] = [];
            }
            ctrl.operationsObject[operation.sign][operation.type.name].push(operation);
          });
          console.log(ctrl.operationsObject);
          filterSortObjectProps(ctrl.operationsObject);
        });
      };
      $(document).on('operations.update', ctrl.operationsUpdate);
    };
    ctrl.$onDestroy = function() {
      $(document).off('operations.update', ctrl.operationsUpdate);
    };
  }],
  templateUrl: "pages/operations/_table_month.html"
})
.component("navigationMonth", {
  controller: ["$routeParams", "Month", function(routeParams, months) {
    const ctrl = this;
    ctrl.$onInit = function() {
      var currentMonth = parseInt(routeParams.month);
      var currentYear = parseInt(routeParams.year);
      var previousMonth = 0;
      var nextMonth = 0;
      if (currentMonth > 1) {
        previousMonth = currentMonth - 1;
        ctrl.previousYear = currentYear;
      } else {
        previousMonth = 12;
        ctrl.previousYear = currentYear - 1;
      }
      if (parseInt(currentMonth) < 12) {
        nextMonth = currentMonth + 1;
        ctrl.nextYear = currentYear;
      } else {
        nextMonth = 1;
        ctrl.nextYear = currentYear + 1;
      }
      ctrl.previousMonth = months.getList().find(function(element) {
        return element._id === previousMonth;
      });
      ctrl.nextMonth = months.getList().find(function(element) {
        return element._id === nextMonth;
      });
    };
  }],
  templateUrl: "pages/operations/_navigation_month.html"
})
.component("titleMonth", {
  controller: ["$routeParams", "Month", function(routeParams, months) {
    var ctrl = this;
    ctrl.$onInit = function() {
      var currentMonth = parseInt(routeParams.month);
      ctrl.currentYear = parseInt(routeParams.year);
      ctrl.currentMonth = months.getList().find(function(element) {
        return element._id === currentMonth;
      });
    };
  }],
  templateUrl: "pages/operations/_title_month.html"
})
.component("navigationYear", {
  controller: ["$routeParams", function(routeParams) {
    var ctrl = this;
    ctrl.$onInit = function() {
      var currentYear = parseInt(routeParams.year);
      ctrl.previousYear = currentYear - 1;
      ctrl.nextYear = currentYear + 1;
    };
  }],
  templateUrl: "pages/operations/_navigation_year.html"
})
.component("titleYear", {
  controller: ["$routeParams", function(routeParams) {
    var ctrl = this;
    ctrl.$onInit = function() {
      ctrl.currentYear = parseInt(routeParams.year);
      ctrl.actualYear = (new Date()).getFullYear();
    };
  }],
  templateUrl: "pages/operations/_title_year.html"
})
.component("tableYear", {
  bindings: {
    operations: '<'
  },
  controller: ["Operation", "$routeParams", "filterByFilter", "mapFilter", "sumFilter", "beforeWhereFilter", "orderByFilter", "$scope", "Month", "filterByOrFilter", function(operationService, routeParams, filterBy, map, sum, beforeWhere, orderBy, $scope, months, filterByOr) {
    var ctrl = this;
    operationService.years(parseInt(routeParams.year)).then(function(promises) {
        ctrl.operations = promises[0].data;
        ctrl.operationsPrev = promises[1].data;
        ctrl.operationsBack = angular.copy(ctrl.operations);
        ctrl.operationsPrevBack = angular.copy(ctrl.operationsPrev);
    });
    $scope.$on('changedTypes', function(e,data) {
      ctrl.types = data;
      var operations = ctrl.operationsBack;
      var operationsPrev = ctrl.operationsPrevBack;
      if (ctrl.types && ctrl.types.length > 0) {
        console.log(ctrl.types);
        operations = filterByOr(operations, 'type.id', ctrl.types);
        operationsPrev = filterByOr(operationsPrev, 'type.id', ctrl.types);
      }
      ctrl.operations = filterBy(operations, ['year'], routeParams.year, true);
      ctrl.operationsPrev = filterBy(operationsPrev, ['year'], routeParams.year-1, true);
    });
    ctrl.months = months.getList();
    ctrl.currentYear = parseInt(routeParams.year);
    ctrl.cumulative_balance = function(month, operations) {
      if (!operations) {
        operations = ctrl.operations;
      }
      if (angular.isDefined(operations)) {
        var operationsMonth = operations.filter(function(operation) {
          return operation.month <= month;
        });
        let positive = 0, negative = 0;
        operationsMonth.forEach(function(operation) {
          if (operation.sign === '-') {
            negative += operation.amount;
          } else {
            positive += operation.amount;
          }
        });
        return positive - negative;
      }
    };
    ctrl.quarterly_balance = function(i, operations) {
      return ctrl.balance(i, operations) + ctrl.balance(i+1, operations) + ctrl.balance(i+2, operations);
    };
    ctrl.quarterly_balance_diff = function(i, operations) {
      return ctrl.quarterly_balance(i) - ctrl.quarterly_balance(i, ctrl.operationsPrev);
    };
    ctrl.balance = function(month) {
      if (angular.isDefined(ctrl.operations)) {
        var operationsMonth = ctrl.operations.filter(function(operation) {
          return operation.month === month;
        });
        let positive = 0, negative = 0;
        operationsMonth.forEach(function(operation) {
          if (operation.sign === '-') {
            negative += operation.amount;
          } else {
            positive += operation.amount;
          }
        });
        return positive - negative;
      }
    };
    ctrl.year_balance = function(month) {
      var positive = filterBy(ctrl.operations, ['sign'], '+', true);
      var negative = filterBy(ctrl.operations, ['sign'], '-', true);
      positive = map(positive, 'amount');
      negative = map(negative, 'amount');
      return sum(positive) - sum(negative);
    };
    ctrl.previous_month_diff = function(operationsType, month) {
      var operationsCurrentMonth = filterBy(operationsType, ['month'], month._id, true);
      if (month._id > 1 && operationsCurrentMonth.length > 1) {
        var operationsPrevMonth = filterBy(operationsType, ['month'], month._id-1, true);
        return sum(map(operationsCurrentMonth, 'amount')) - sum(map(operationsPrevMonth, 'amount'));
      }
    };
    ctrl.operationsUpdate = function(e, operations){
      $scope.$apply(function() {
        ctrl.operations = JSON.parse(sessionStorage.getItem(routeParams.year))
        ctrl.operationsPrev = JSON.parse(sessionStorage.getItem(routeParams.year-1))
      });
    };
    ctrl.$postLink = function() {
      $(document).on('operations.update', ctrl.operationsUpdate);
    };
    ctrl.$onDestroy = function() {
      $(document).off('operations.update', ctrl.operationsUpdate);
    };
  }],
  templateUrl: "pages/operations/_table_year.html"
})
.component("pieChartPerUser", {
  bindings: {
    operations: "<"
  },
  controller: ["groupByFilter", "mapFilter", "sumFilter", "numberFilter", function(groupBy, map, sum, number) {
    var ctrl = this;
    ctrl.$onChanges = function(changes) {
      if (changes.operations) {
        ctrl.charts = [];
        var operationsUser = groupBy(ctrl.operations, "user.name");
        for (var user in operationsUser) {
          ctrl.buildChart(operationsUser[user], ctrl.charts, user);
        }
        ctrl.buildChart(ctrl.operations, ctrl.charts);
      }
    };
    ctrl.buildChart = function(operations, charts, user) {
      if (!user) {
        user = "Totale";
      }
      var operationsSign = groupBy(operations, "sign");
      for (var sign in operationsSign) {
        var operationsType = groupBy(operationsSign[sign], "type.name");
        var chart = {data:[],labels:[], sign: sign, user: user};
        for (var obj in operationsType) {
          var amount = sum(map(operationsType[obj], "amount"));
          amount = Math.round(amount*100)/100;
          chart.data.push(amount);
          chart.labels.push(obj);
        }
        charts.push(chart);
      }
    };
  }],
  templateUrl: "pages/operations/_pie_chart_per_user.html"
})
.component('operationForm', {
  controller: ["Operation", "User", "Type", "$routeParams", "$location", "maxFilter", function(operationService, userService, typeService, routeParams, location, max) {
      var ctrl = this;
      ctrl.id = routeParams.id;
      userService.getList().then(function(resp) {
        ctrl.users = resp.data;
      });
      typeService.getList().then(function(resp) {
        ctrl.types = resp.data;
        return resp;
      }).then(function(data){
        ctrl.checkTotalAmount = function() {
          ctrl.type = ctrl.types.filter(function(obj) {
            return obj.id === ctrl.operation.type_id;
          });
          if (ctrl.type.length && ctrl.operation.date) {
            ctrl.type = ctrl.type[0];
            var month = ctrl.operation.date.getMonth()+1;
            var year = ctrl.operation.date.getFullYear();

            operationService.month(year, month).then(function(resp) {
              var initAmount = 0;
              if (ctrl.operation.amount) {
                initAmount = ctrl.operation.amount;
              }
              ctrl.totalAmount = resp.data.filter(function(obj) {
                return obj.sign === '-' && obj.type_id === ctrl.operation.type_id && parseInt(obj.id) !== parseInt(routeParams.id);
              }).map(function(obj) {
                return obj.amount;
              }).reduce(function(a,b) {
                return a + b;
              }, initAmount);
            });

            operationService.year(year).then(function(resp) {
              var operations = resp.data;
              operations = operations.filter(function(obj) {
                return obj.sign === '-' && obj.type_id === ctrl.operation.type_id;
              });
              console.log(operations);
              var maxMonth = max(operations, "month");

              var month_numbers = 0
              if (maxMonth && maxMonth.length > 0) {
                month_numbers = maxMonth[0];
              }
              var month = ctrl.operation.date.getMonth()+1;
              console.log(month);
              if (month_numbers < month) {
                month_numbers = month;
              }
              console.log(month_numbers);
              var avgAmount = 0;
              if (ctrl.operation.amount) {
                avgAmount = ctrl.operation.amount;
              }
              console.log(avgAmount);
              ctrl.avgAmount = operations.map(function(obj) {
                return obj.amount;
              }).reduce(function(a,b) {
                return a + b;
              }, avgAmount);
              ctrl.avgAmount /= month_numbers
              console.log(ctrl.avgAmount);
            });
          }
          return ctrl.type && ctrl.operation.amount && ctrl.operation.date;
        };
        if (routeParams.id) {
          ctrl.submit = function() {
            operationService.put(routeParams.id, {operation: ctrl.operation}).then(function(resp) {
              resp.data.date = new Date(resp.data.year, resp.data.month-1, resp.data.day);
              ctrl.operation = resp.data;
              location.path('/operations/'+ctrl.operation.id);
            });
          };
          operationService.get(routeParams.id).then(function(resp) {
            resp.data.date = new Date(resp.data.year, resp.data.month-1, resp.data.day);
            ctrl.operation = resp.data;
            ctrl.checkTotalAmount();
          });
        } else {
          ctrl.operation = {date: new Date()};
          ctrl.submit = function() {
            operationService.post({operation: ctrl.operation}).then(function(resp) {
              resp.data.date = new Date(resp.data.year, resp.data.month-1, resp.data.day);
              ctrl.operation = resp.data;
              location.path('/operations/'+ctrl.operation.id);
            });
          };
          if (routeParams.type_id) {
            ctrl.operation.type_id = parseInt(routeParams.type_id);
          }
          if (routeParams.user_id) {
            ctrl.operation.user_id = parseInt(routeParams.user_id);
          }
          if (routeParams.sign) {
            ctrl.operation.sign = routeParams.sign;
          }
        }
      });
  }],
  templateUrl: "pages/operations/_form.html"
})
.component("formRepeater", {
  bindings: {
    operation: '=',
    form: '='
  },
  controller: [function() {
    var ctrl = this;
    ctrl.typesRepeat = [{id: 1, name: "Giorni"}, {id: 2, name: "Settimane"}, {id: 3, name: "Mesi"}];
    ctrl.weeksRepeat = [{id: 1, name: "Primo"}, {id: 2, name: "Secondo"}, {id: 3, name: "Terzo"}, {id: 4, name: "Quarto"}, {id: 5, name: "Ultimo"}];
    ctrl.wdaysRepeat = [{id: 1, name: "Lunedì"},{id: 2, name: "Martedì"},{id: 3, name: "Mercoledì"},{id: 4, name: "Giovedì"},{id: 5, name: "Venerdì"},{id: 6, name: "Sabato"},{id: 0, name: "Domenica"}];
  }],
  templateUrl: "pages/operations/_form_repeater.html"
})
;
