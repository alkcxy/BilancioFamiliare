angular.module('filtersDirectives',[])
.component("filterYears", {
  controller: ['$scope', function($scope) {
    var ctrl = this;
    ctrl.currentYear = (new Date().getFullYear());
    $scope.$on('years', function(e,data) {
      if (data) {
        ctrl.activeYears = JSON.parse(sessionStorage.getItem('max')).map(function(elem){return elem.year;});
      }
    });
    ctrl.changeCheckBoxes = function() {
      var years = Object.values(ctrl.years).filter(function(e){
        if (e) {
          return e;
        }
      });
      $scope.$emit('changedYears', years);
    };
  }],
  templateUrl: "pages/filters/years.html"
})
.component("filterTypes", {
  controller: ['$scope', 'Type', function($scope, typeService) {
    var ctrl = this;
    ctrl.$onInit = function() {
      typeService.getList().then(function(resp) {
        ctrl.activeTypes = resp.data;
      });
    }
    ctrl.changeCheckBoxes = function() {
      var types = Object.values(ctrl.types).filter(function(e){
        if (e) {
          return e.id;
        }
      });
      $scope.$emit('changedTypes', types);
    };
  }],
  templateUrl: "pages/filters/types.html"
});
