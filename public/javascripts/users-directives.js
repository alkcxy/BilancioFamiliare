angular.module('usersDirectives',['bilancioFamiliareService'])
.component("usersList", {
  controller: ['User', function(userService) {
    var ctrl = this;
    ctrl.$onInit = function() {
      userService.getList().then(function(resp) {
        ctrl.users = resp.data;
      });
    }
  }],
  templateUrl: "pages/users/_users_list.html"
})
.component("userShow", {
  controller: ['User', '$routeParams', function(userService, routeParams) {
    var ctrl = this;
    userService.get(routeParams.id).then(function(resp) {
      ctrl.user = resp.data;
    });
  }],
  templateUrl: "pages/users/_user.html"
})
.component('userForm', {
  controller: ["User", "$routeParams", "$location", function(userService, routeParams, location) {
    var ctrl = this;
    if (routeParams.id) {
      ctrl.submit = function() {
        userService.put(routeParams.id, {user: ctrl.user}).then(function(resp) {
          ctrl.user = resp.data;
          location.path('/users/'+ctrl.user.id);
        });
      }
      userService.get(routeParams.id).then(function(resp) {
        ctrl.user = resp.data;
      });
    } else {
      ctrl.submit = function() {
        console.log(ctrl.user);
        userService.post({user: ctrl.user}).then(function(resp) {
          ctrl.user = resp.data;
          location.path('/users/'+ctrl.user.id);
        });
      }
    }
  }],
  templateUrl: "pages/users/_form.html"
})
;
