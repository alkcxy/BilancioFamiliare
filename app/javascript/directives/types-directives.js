angular.module('typesDirectives',['typeService'])
.component("typesList", {
  controller: ['Type', function(typeService) {
    var ctrl = this;
    ctrl.$onInit = function() {
      typeService.getList().then(function(resp) {
        ctrl.types = resp.data;
      });
    };
    ctrl.destroy = function(id) {
      typeService.destroy(id).then(function(resp) {
        for (var i = 0; i < ctrl.types.length; i++) {
          var user = ctrl.types[i];
          if (user.id === parseInt(id)) {
            ctrl.types.splice(i, 1);
            break;
          }
        }
      });
    };
  }],
  templateUrl: "pages/types/_types_list.html"
})
.component("typeShow", {
  controller: ['Type', '$routeParams', function(typeService, routeParams) {
    var ctrl = this;
    typeService.get(routeParams.id).then(function(resp) {
      ctrl.type = resp.data;
    });
  }],
  templateUrl: "pages/types/_type.html"
})
.component('typeForm', {
  controller: ["Type", "$routeParams", "$location", function(typeService, routeParams, location) {
      var ctrl = this;
      if (routeParams.id) {
        ctrl.submit = function() {
          typeService.put(routeParams.id, {type: ctrl.type}).then(function(resp) {
            ctrl.type = resp.data;
            location.path('/types/'+ctrl.type.id);
          });
        };
        typeService.get(routeParams.id).then(function(resp) {
          ctrl.type = resp.data;
        });
      } else {
        ctrl.submit = function() {
          typeService.post({type: ctrl.type}).then(function(resp) {
            ctrl.type = resp.data;
            location.path('/types/'+ctrl.type.id);
          });
        };
      }
      typeService.getList().then(function(resp) {
        ctrl.types = resp.data;
      });
  }],
  templateUrl: "pages/types/_form.html"
})
;
