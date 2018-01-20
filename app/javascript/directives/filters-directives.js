angular.module('filtersDirectives',[])
.component("filterYears", {
  controller: ['$scope', function($scope) {
    var ctrl = this;
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
    }
  }],
  templateUrl: "pages/filters.html"
});
