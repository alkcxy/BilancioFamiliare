angular.module('homeDirectives',['operationService','chart.js','bilancioFilters'])
.component("home", {
  controller: ['Operation', '$routeParams', 'groupByFilter', 'mapFilter', 'sumFilter', 'orderByFilter', '$scope', 'filterByOrFilter', function(operationService, routeParams, groupBy, map, sum, orderBy, $scope, filterByOr) {
    const ctrl = this;
    ctrl.operations = [];
    ctrl.$onChanges = function(changes) {
      if (changes.operations) {
        ctrl.updateCharts();
      }
    };
    ctrl.$postLink = function() {
      ctrl.operationsUpdate = function(e, operations, year){
        $scope.$apply(function() {
          for (let i = 0; i < ctrl.operations.length; i++) {
            let operation = ctrl.operations[i];
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
    $scope.$on('changedYears', function(e,data) {
      ctrl.years = data;
      operationService.years(ctrl.years).then(function(resp) {
        ctrl.operations = []
        resp.forEach(function(response) {
          ctrl.operations.push.apply(ctrl.operations, response.data);
        })
        let operations = ctrl.operations;
        if (ctrl.types && ctrl.types.length > 0) {
          operations = filterByOr(operations, 'type.id', ctrl.types);
        }
        ctrl.updateCharts(operations);
      });
    });
    $scope.$on('changedTypes', function(e,data) {
      ctrl.types = data;
      operationService.years(ctrl.years).then(function(resp) {
        ctrl.operations = []
        resp.forEach(function(response) {
          ctrl.operations.push.apply(ctrl.operations, response.data);
        })
        let operations = ctrl.operations;
        if (ctrl.types && ctrl.types.length > 0) {
          operations = filterByOr(operations, 'type.id', ctrl.types);
        }
        ctrl.updateCharts(operations);
      });
    });
    ctrl.updateCharts = function(operations) {
      let operationsType,type,operationsYear,operationsMonth,year,operation,operationsSign;
      ctrl.chartPerYear = {data:[[],[]], labels:[], series:[]};
      ctrl.chartPerDay = {data:[[],[]], labels:[[],[]], cat: []};
      ctrl.chartPerMonth = {data:[{},{}], labels:["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"], series:[{},{}], cat: []};
      if (!operations) {
        operations = ctrl.operations;
      }

      operationsSign = groupBy(operations, "sign");
      let i = 0;
      for (let sign in operationsSign) {
        let serie;
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
      for (let sign in operationsSign) {
        let cat;
        if (sign === '-') {
          cat = "Uscite";
        } else {
          cat = "Entrate";
        }
        operationsType = groupBy(operationsSign[sign], 'type.name');
        for (type in operationsType) {
          let min = 0;
          let max = 0;
          for (let j = 0; j < operationsType[type].length; j++) {
            operation = operationsType[type][j];
            let month = operation.month+"";
            if (month.length === 1) {
              month = "0"+month;
            }
            let day = operation.day+"";
            if (day.length === 1) {
              day = "0"+day;
            }
            let date = parseInt(operation.year+""+month+""+day);
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
          let totDays = (86400000+(max-min))/86400000;
          let totAmount = sum(map(operationsType[type], 'amount'));
          ctrl.chartPerDay.data[i].push(Math.round((totAmount/totDays)*100)/100);
          if (ctrl.chartPerDay.labels[i].indexOf(type) === -1) {
            ctrl.chartPerDay.labels[i].push(type);
          }
        }
        ctrl.chartPerDay.cat[i] = cat;
        i++;
      }
      i = 0;
      for (let sign in operationsSign) {
        let cat;
        if (sign === '-') {
          cat = "Uscite";
        } else {
          cat = "Entrate";
        }
        operationsType = groupBy(operationsSign[sign], 'type.name');
        //Object.keys().sort();
        for (type in operationsType) {
          operationsYear = groupBy(operationsType[type], 'year');
          for (year in operationsYear) {
            if (!ctrl.chartPerMonth.data[i][year]) {
              ctrl.chartPerMonth.data[i][year] = [];
            }
            if (!ctrl.chartPerMonth.series[i][year]) {
              ctrl.chartPerMonth.series[i][year] = [];
            }
            let data = [0,0,0,0,0,0,0,0,0,0,0,0];
            operationsMonth = operationsYear[year];
            for (let ij = 0; ij < operationsMonth.length; ij++) {
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
      let today = new Date();
      operations.forEach(function(operation) {
        if (operation.year < today.getFullYear() || (operation.year === today.getFullYear() && operation.month < today.getMonth()+1) || (operation.year === today.getFullYear() && operation.month === today.getMonth()+1) && operation.day < today.getDate()) {
          if (operation.sign === '+') {
            ctrl.saldoToday += operation.amount;
          } else {
            ctrl.saldoToday -= operation.amount;
          }
        }
      });
    };
  }],
  templateUrl: "pages/home.html"
})
;
