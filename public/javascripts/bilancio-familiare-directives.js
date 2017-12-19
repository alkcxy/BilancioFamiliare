var months = [
  {_id: 1, id:'01', name: "Gennaio"},
  {_id: 2, id:'02', name: "Febbraio"},
  {_id: 3, id:'03', name: "Marzo"},
  {_id: 4, id:'04', name: "Aprile"},
  {_id: 5, id:'05', name: "Maggio"},
  {_id: 6, id:'06', name: "Giugno"},
  {_id: 7, id:'07', name: "Luglio"},
  {_id: 8, id:'08', name: "Agosto"},
  {_id: 9, id:'09', name: "Settembre"},
  {_id: 10, id:'10', name: "Ottobre"},
  {_id: 11, id:'11', name: "Novembre"},
  {_id: 12, id:'12', name: "Dicembre"}
];
angular.module('bilancioFamiliareDirectives',['bilancioFamiliareService'])
.component("operationShow", {
  controller: ['Operation', "$routeParams", function(operationService, routeParams) {
    var ctrl = this;
    ctrl.$onInit = function() {
      operationService.get(routeParams.id).then(function(resp) {
        ctrl.operation = resp.data;
      });
    }
  }],
  templateUrl: "pages/operations/_operation.html"
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
  templateUrl: "pages/layout/_current_user.html"
})
.component("tableMonth", {
  controller: ["Operation", "$routeParams", function(operationService, routeParams) {
    var ctrl = this;
    ctrl.$onInit = function() {
      operationService.month(routeParams.year, routeParams.month).then(function(resp) {
        ctrl.operations = resp.data;
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
;
