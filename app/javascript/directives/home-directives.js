angular.module('homeDirectives',['operationService','chart.js','bilancioFilters'])
.component("home", {
  controller: ['Operation', '$routeParams', 'groupByFilter', 'mapFilter', 'sumFilter', 'orderByFilter', '$scope', 'filterByOrFilter', function(operationService, routeParams, groupBy, map, sum, orderBy, $scope, filterByOr) {
    var ctrl = this;
    ctrl.operations = [];
    ctrl.$onChanges = function(changes) {
      if (changes.operations) {
        ctrl.updateCharts();
      }
    };
    ctrl.$postLink = function() {
      ctrl.operationsUpdate = function(e, operations, year){
        $scope.$apply(function() {
          for (var i = 0; i < ctrl.operations.length; i++) {
            var operation = ctrl.operations[i];
            if (parseInt(operation.year) != parseInt(year)) {
              operations.push(operation);
            }
          }
          ctrl.operations = operations;
          ctrl.updateCharts();
        });
      };
      $(document).on('operations.update', ctrl.operationsUpdate);
    };
    ctrl.$onDestroy = function() {
      $(document).off('operations.update', ctrl.operationsUpdate);
    };
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
            var currentYear = (new Date()).getFullYear();
            if (resp.data[0].year === currentYear) {
              var currentOperations = resp.data;
              ctrl.updateCharts(currentOperations);
            }
          });
        });
      });
    };
    $scope.$on('changedYears', function(e,data) {
      ctrl.years = data;
      var operations = ctrl.operations;
      if (ctrl.years && ctrl.years.length > 0) {
        console.log(ctrl.years);
        operations = filterByOr(operations, 'year', ctrl.years);
      }
      if (ctrl.types && ctrl.types.length > 0) {
        console.log(ctrl.types);
        operations = filterByOr(operations, 'type.id', ctrl.types);
      }
      ctrl.updateCharts(operations);
    });
    $scope.$on('changedTypes', function(e,data) {
      ctrl.types = data;
      var operations = ctrl.operations;
      if (ctrl.years && ctrl.years.length > 0) {
        console.log(ctrl.years);
        operations = filterByOr(operations, 'year', ctrl.years);
      }
      if (ctrl.types && ctrl.types.length > 0) {
        console.log(ctrl.types);
        operations = filterByOr(operations, 'type.id', ctrl.types);
      }
      ctrl.updateCharts(operations);
    });
    ctrl.updateCharts = function(operations) {
      console.log(operations);
      var cat,operationsType,type,operationsYear,operationsMonth,year,operation,operationsSign;
      ctrl.chartPerYear = {data:[[],[]], labels:[], series:[]};
      ctrl.chartPerDay = {data:[[],[]], labels:[[],[]], cat: []};
      ctrl.chartPerMonth = {data:[{},{}], labels:["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"], series:[{},{}], cat: []};
      if (!operations) {
        operations = ctrl.operations;
      }

      operationsSign = groupBy(operations, "sign");
      var i = 0;
      var sign;
      for (sign in operationsSign) {
        var serie = "";
        if (sign === '-') {
          serie = "Uscite";
        } else {
          serie = "Entrate";
        }
        ctrl.chartPerYear.series.push(serie);
        operationsYear = groupBy(operationsSign[sign], 'year');
        for (year in operationsYear) {
          ctrl.chartPerYear.data[i].push(Math.round(sum(map(operationsYear[year], 'amount'))*100)/100);
          if (ctrl.chartPerYear.labels.indexOf(year) === -1) {
            ctrl.chartPerYear.labels.push(year);
          }
        }
        i++;
      }
      i = 0;
      for (sign in operationsSign) {
        cat = "";
        if (sign === '-') {
          cat = "Uscite";
        } else {
          cat = "Entrate";
        }
        operationsType = groupBy(orderBy(operationsSign[sign], 'type.name'), 'type.name');
        for (type in operationsType) {
          var min = 0;
          var max = 0;
          for (var j = 0; j < operationsType[type].length; j++) {
            operation = operationsType[type][j];
            var month = operation.month+"";
            if (month.length === 1) {
              month = "0"+month;
            }
            var day = operation.day+"";
            if (day.length === 1) {
              day = "0"+day;
            }
            var date = parseInt(operation.year+""+month+""+day);
            if (min === 0 || min > date) {
              min = date;
            }
            if (max === 0 || max < date) {
              max = date;
            }
          }
          min = min+"";
          max = max+"";
          max = new Date(parseInt(max.substring(0,4)), parseInt(max.substring(4,6)-1), parseInt(max.substring(6)));
          min = new Date(parseInt(min.substring(0,4)), 0, 1);
          var totDays = (86400000+(max-min))/86400000;
          var totAmount = sum(map(operationsType[type], 'amount'));
          ctrl.chartPerDay.data[i].push(Math.round((totAmount/totDays)*100)/100);
          if (ctrl.chartPerDay.labels[i].indexOf(type) === -1) {
            ctrl.chartPerDay.labels[i].push(type);
          }
        }
        ctrl.chartPerDay.cat[i] = cat;
        i++;
      }
      i = 0;
      for (sign in operationsSign) {
        cat = "";
        if (sign === '-') {
          cat = "Uscite";
        } else {
          cat = "Entrate";
        }
        operationsType = groupBy(orderBy(operationsSign[sign], 'type.name' ), 'type.name');
        for (type in operationsType) {
          operationsYear = groupBy(operationsType[type], 'year');
          for (year in operationsYear) {
            if (!ctrl.chartPerMonth.data[i][year]) {
              ctrl.chartPerMonth.data[i][year] = [];
            }
            if (!ctrl.chartPerMonth.series[i][year]) {
              ctrl.chartPerMonth.series[i][year] = [];
            }
            var data = [0,0,0,0,0,0,0,0,0,0,0,0];
            operationsMonth = orderBy(operationsYear[year], 'month');
            for (var ij = 0; ij < operationsMonth.length; ij++) {
              operation = operationsMonth[ij];
              data[operation.month-1]+=operation.amount;
            }
            ctrl.chartPerMonth.data[i][year].push(data);
            ctrl.chartPerMonth.series[i][year].push(type);
          }
        }
        ctrl.chartPerMonth.cat[i] = cat;
        i++;
      }
      ctrl.saldoToday = 0;
      var today = new Date();
      for (i = 0; i < operations.length; i++) {
        operation = operations[i];
        if (operation.year < today.getFullYear() || (operation.year === today.getFullYear() && operation.month < today.getMonth()+1) || (operation.year === today.getFullYear() && operation.month === today.getMonth()+1) && operation.day < today.getDate()) {
          if (operation.sign === '+') {
            ctrl.saldoToday += operation.amount;
          } else {
            ctrl.saldoToday -= operation.amount;
          }
        }
      }
    };
  }],
  templateUrl: "pages/home.html"
})
;
