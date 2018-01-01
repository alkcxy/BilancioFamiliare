var months = [
  {_id: 1, id:'01', name: "Gennaio", abbr: "Gen"},
  {_id: 2, id:'02', name: "Febbraio", abbr: "Feb"},
  {_id: 3, id:'03', name: "Marzo", abbr: "Mar"},
  {_id: 4, id:'04', name: "Aprile", abbr: "Apr"},
  {_id: 5, id:'05', name: "Maggio", abbr: "Mag"},
  {_id: 6, id:'06', name: "Giugno", abbr: "Giu"},
  {_id: 7, id:'07', name: "Luglio", abbr: "Lug"},
  {_id: 8, id:'08', name: "Agosto", abbr: "Ago"},
  {_id: 9, id:'09', name: "Settembre", abbr: "Set"},
  {_id: 10, id:'10', name: "Ottobre", abbr: "Ott"},
  {_id: 11, id:'11', name: "Novembre", abbr: "Nov"},
  {_id: 12, id:'12', name: "Dicembre", abbr: "Dic"}
];
angular.module('bilancioFamiliareDirectives',['bilancioFamiliareService','angular.filter','chart.js', 'actionCableService'])
.component("operationShow", {
  controller: ['Operation', '$routeParams', '$location', function(operationService, routeParams, location) {
    var ctrl = this;
    ctrl.$onInit = function() {
      operationService.get(routeParams.id).then(function(resp) {
        resp.data.date = new Date(resp.data.year, resp.data.month-1, resp.data.day);
        ctrl.operation = resp.data;
      });
    }
    ctrl.destroy = function(id) {
      operationService.destroy(id).then(function(resp) {
        location.path('/');
      });
    }
  }],
  templateUrl: "pages/operations/_operation.html"
})
.component('operationsList', {
  controller: ['Operation', '$location', 'channel', '$scope', function(operationService, location, channel, $scope) {
    var ctrl = this;
    var previousOperations = undefined;
    ctrl.$onInit = function() {
      operationService.getList().then(function(resp) {
        ctrl.operations = resp.data;
      });
    }
    ctrl.$postLink = function() {
      $(document).on('operations.update', function(e, operations){
        ctrl.operations = operations;
        $scope.$apply();
      });
    }
    ctrl.destroy = function(id) {
      operationService.destroy(id).then(function(resp) {
        for (var i = 0; i < ctrl.operations.length; i++) {
          var operation = ctrl.operations[i];
          if (operation.id === parseInt(id)) {
            ctrl.operations.splice(i, 1);
            break;
          }
        }
      });
    }
  }],
  templateUrl: "pages/operations/_operations.html"
})
.component("currentYear", {
  controller: function() {
    var ctrl = this;
    ctrl.date = new Date();
    ctrl.year = ctrl.date.getFullYear();
    ctrl.months = months;
  },
  templateUrl: "pages/layout/_current_year.html"
})
.component("currentUser", {
  bindings: {
    current_user: '<'
  },
  controller: ["jwtHelper", "Session", "$location", "$rootScope", function(jwtHelper, sessionService, location, rootScope) {
    var ctrl = this;
    ctrl.$onInit = function() {
      if (sessionStorage.getItem('token')) {
        var tokenPayload = jwtHelper.decodeToken(sessionStorage.getItem('token'));
        rootScope.current_user = tokenPayload.user;
        ctrl.current_user = rootScope.current_user;
      } else {
        if (location.path() !== '/login') {
          location.path('/login');
        }
      }
    }
  }],
  templateUrl: "pages/layout/_current_user.html"
})
.component("formLogin", {
  controller: ["Session", "$location", "$window", function(sessionService, location, window) {
    var ctrl = this;
    ctrl.login = function() {
      sessionService.login(ctrl.email, ctrl.password).then(function(resp) {
        if (resp.data.status) {
          sessionStorage.setItem('token', resp.data.token);
          location.path("/");
        }
      }, function(err) {
        ctrl.error = "Email o password non valida.";
      });
    }
  }],
  templateUrl: "pages/sessions/_form_login.html"
})
.component("tableMonth", {
  controller: ["Operation", "$routeParams", "$scope", "filterByFilter", function(operationService, routeParams, $scope, filterBy) {
    var ctrl = this;
    ctrl.$onInit = function() {
      operationService.month(routeParams.year, routeParams.month).then(function(resp) {
        ctrl.operations = resp.data;
      });
    }
    ctrl.$postLink = function() {
      $(document).on('operations.update', function(e, operations){
        var month =routeParams.month;
        if (month[0] === "0") {
          month = month.substring(1);
        }
        ctrl.operations = filterBy(filterBy(operations, ['year'], routeParams.year, true), ['month'], month, true);
        $scope.$apply();
      });
    }
  }],
  templateUrl: "pages/operations/_table_month.html"
})
.component("navigationMonth", {
  controller: ["$routeParams", function(routeParams) {
    var ctrl = this;
    ctrl.$onInit = function() {
      var currentMonth = parseInt(routeParams.month);
      var currentYear = parseInt(routeParams.year);
      var previousMonth = 0;
      var nextMonth = 0
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
      ctrl.previousMonth = months.find(function(element) {
        return element._id === previousMonth;
      });
      ctrl.nextMonth = months.find(function(element) {
        return element._id === nextMonth;
      });
    }
  }],
  templateUrl: "pages/operations/_navigation_month.html"
})
.component("titleMonth", {
  controller: ["$routeParams", function(routeParams) {
    var ctrl = this;
    ctrl.$onInit = function() {
      var currentMonth = parseInt(routeParams.month);
      ctrl.currentYear = parseInt(routeParams.year);
      ctrl.currentMonth = months.find(function(element) {
        return element._id === currentMonth;
      });
    }
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
    }
  }],
  templateUrl: "pages/operations/_navigation_year.html"
})
.component("titleYear", {
  controller: ["$routeParams", function(routeParams) {
    var ctrl = this;
    ctrl.$onInit = function() {
      ctrl.currentYear = parseInt(routeParams.year);
      ctrl.actualYear = (new Date()).getFullYear();
    }
  }],
  templateUrl: "pages/operations/_title_year.html"
})
.component("tableYear", {
  bindings: {
    operations: '<'
  },
  controller: ["Operation", "$routeParams", "filterByFilter", "mapFilter", "sumFilter", "beforeWhereFilter", "orderByFilter", "$scope", function(operationService, routeParams, filterBy, map, sum, beforeWhere, orderBy, $scope) {
    var ctrl = this;
    operationService.year(routeParams.year).then(function(resp) {
      ctrl.operations = filterBy(resp.data, ['year'], routeParams.year, true);
      ctrl.operationsPrev = filterBy(resp.data, ['year'], routeParams.year-1, true);
    });
    ctrl.months = months;
    ctrl.currentYear = parseInt(routeParams.year);
    ctrl.$onInit = function() {
      ctrl.cumulative_balance = function(month, operations) {
        if (!operations) {
          operations = ctrl.operations;
        }
        if (angular.isDefined(operations)) {
          var operationsMonth = [];
          for (var i = 0; i < operations.length; i++) {
            var operation = operations[i];
            if (operation.month <= month) {
              operationsMonth.push(operation);
            }
          }
          var positive = filterBy(operationsMonth, ['sign'], '+', true);
          var negative = filterBy(operationsMonth, ['sign'], '-', true);
          positive = map(positive, 'amount');
          negative = map(negative, 'amount');
          return sum(positive) - sum(negative);
        }
      }
      ctrl.quarterly_balance = function(i, operations) {
        return ctrl.cumulative_balance(i, operations) + ctrl.cumulative_balance(i+1, operations) + ctrl.cumulative_balance(i+2, operations);
      }
      ctrl.quarterly_balance_diff = function(i, operations) {
          return ctrl.quarterly_balance(i) - ctrl.quarterly_balance(i, ctrl.operationsPrev);
      }
      ctrl.balance = function(month) {
        if (angular.isDefined(ctrl.operations)) {
          var operationsMonth = [];
          for (var i = 0; i < ctrl.operations.length; i++) {
            var operation = ctrl.operations[i];
            if (operation.month === month) {
              operationsMonth.push(operation);
            }
          }
          var positive = filterBy(operationsMonth, ['sign'], '+', true);
          var negative = filterBy(operationsMonth, ['sign'], '-', true);
          positive = map(positive, 'amount');
          negative = map(negative, 'amount');
          return sum(positive) - sum(negative);
        }
      }
      ctrl.year_balance = function(month) {
        var positive = filterBy(ctrl.operations, ['sign'], '+', true);
        var negative = filterBy(ctrl.operations, ['sign'], '-', true);
        positive = map(positive, 'amount');
        negative = map(negative, 'amount');
        return sum(positive) - sum(negative);
      }
      ctrl.previous_month_diff = function(operationsType, month) {
        var operationsCurrentMonth = filterBy(operationsType, ['month'], month._id, true);
        if (month._id > 1 && operationsCurrentMonth.length > 1) {
          var operationsPrevMonth = filterBy(operationsType, ['month'], month._id-1, true);
          return sum(map(operationsCurrentMonth, 'amount')) - sum(map(operationsPrevMonth, 'amount'));
        }
      }
    }
    ctrl.$postLink = function() {
      $(document).on('operations.update', function(e, operations){
        ctrl.operations = filterBy(operations, ['year'], routeParams.year, true);
        $scope.$apply();
      });
    }
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
        for (user in operationsUser) {
          ctrl.buildChart(operationsUser[user], ctrl.charts, user);
        }
        ctrl.buildChart(ctrl.operations, ctrl.charts);
      }
    }
    ctrl.buildChart = function(operations, charts, user) {
      if (!user) {
        user = "Totale";
      }
      var operationsSign = groupBy(operations, "sign");
      for (sign in operationsSign) {
        var operationsType = groupBy(operationsSign[sign], "type.name");
        var chart = {data:[],labels:[], sign: sign, user: user}
        for (obj in operationsType) {
          var amount = sum(map(operationsType[obj], "amount"));
          amount = Math.round(amount*100)/100;
          chart.data.push(amount);
          chart.labels.push(obj);
        }
        charts.push(chart);
      }
    }
  }],
  templateUrl: "pages/operations/_pie_chart_per_user.html"
})
.component('operationForm', {
  controller: ["Operation", "User", "Type", "$routeParams", "$location", function(operationService, userService, typeService, routeParams, location) {
      var ctrl = this;
      ctrl.id = routeParams.id;
      ctrl.checkTotalAmount = function() {
        console.log("checkTotalAmount");
        ctrl.type = ctrl.types.filter(function(obj) {
          return obj.id === ctrl.operation.type_id;
        });
        console.log(ctrl.type);
        if (ctrl.type.length && ctrl.operation.date) {
          ctrl.type = ctrl.type[0];
          var month = ctrl.operation.date.getMonth()+1;
          var year = ctrl.operation.date.getFullYear();
          operationService.month(month, year).then(function(resp) {
            ctrl.totalAmount = resp.data.filter(function(obj) {
              return obj.type_id === ctrl.operation.type_id;
            }).map(function(obj) {
              return obj.amount;
            }).reduce(function(a,b) {
              a + b;
            },ctrl.operation.amount);
            console.log(ctrl.totalAmount);
          });
        }
        return ctrl.type && ctrl.operation.amount && ctrl.operation.date;
      }
      if (routeParams.id) {
        ctrl.submit = function() {
          operationService.put(routeParams.id, {operation: ctrl.operation}).then(function(resp) {
            resp.data.date = new Date(resp.data.year, resp.data.month-1, resp.data.day);
            ctrl.operation = resp.data;
            location.path('/operations/'+ctrl.operation.id);
          });
        }
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
        }
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
      userService.getList().then(function(resp) {
        ctrl.users = resp.data;
      });
      typeService.getList().then(function(resp) {
        ctrl.types = resp.data;
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
