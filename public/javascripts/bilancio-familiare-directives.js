angular.module('bilancioFamiliareDirectives',['bilancioFamiliareService'])
.component("operationShow", {
  controller: ['Operation', "$routeParams", function(operationService, routeParams) {
    var ctrl = this;
    ctrl.$onInit = function() {
      operationService.get(routeParams.id).then(function(resp) {
        ctrl.operation = resp.data;
        console.log(ctrl);
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
    ctrl.months = [
      {id:'01', name: "Gennaio"},
      {id:'02',name: "Febbraio"},
      {id:'03',name: "Marzo"},
      {id:'04', name: "Aprile"},
      {id:'05', name: "Maggio"},
      {id:'06', name: "Giugno"},
      {id:'07', name: "Luglio"},
      {id:'08', name: "Agosto"},
      {id: '09', name: "Settembre"},
      {id:'10', name: "Ottobre"},
      {id: '11', name: "Novembre"},
      {id:'12', name: "Dicembre"}
    ];
  },
  templateUrl: "pages/layout/_current_year.html"
})
.component("tableMonth", {
  controller: ["Operation", "$routeParams", function(operationService, routeParams) {
    var ctrl = this;
    ctrl.$onInit = function() {
      operationService.monthIn(routeParams.year, routeParams.month).then(function(resp) {
        ctrl.operationsIn = resp.data;
      });
      operationService.monthOut(routeParams.year, routeParams.month).then(function(resp) {
        ctrl.operationsOut = resp.data;
      });
    }
  }],
  templateUrl: "pages/operations/_table_month.html"
})
;
