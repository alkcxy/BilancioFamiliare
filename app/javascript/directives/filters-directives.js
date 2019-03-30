angular.module('filtersDirectives',[])
.component("filterYears", {
  controller: ['$scope', 'Operation', function($scope, operationService) {
    const ctrl = this;
    ctrl.$onInit = function() {
      ctrl.currentYear = (new Date().getFullYear());
      operationService.max().then(function(resp) {
        console.log(resp)
        ctrl.activeYears = resp.data.map(function(elem){return elem.year;});
      })
    }
    ctrl.changeCheckBoxes = function() {
      let years = Object.values(ctrl.years).filter(function(e){
        return e;
      });
      $scope.$emit('changedYears', years);
    };
  }],
  templateUrl: "pages/filters/years.html"
})
.component("filterTypes", {
  controller: ['$scope', 'Type', function($scope, typeService) {
    const ctrl = this;
    ctrl.$onInit = function() {
      typeService.getList().then(function(resp) {
        ctrl.activeTypes = resp.data;
      });
    }
    ctrl.changeCheckBoxes = function() {
      let types = Object.values(ctrl.types).filter(function(e){
        return e && e.id;
      });
      $scope.$emit('changedTypes', types);
    };
  }],
  templateUrl: "pages/filters/types.html"
});
