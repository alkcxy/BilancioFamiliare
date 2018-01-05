angular.module('authDirectives',['sessionService', 'monthService'])
.component("currentYear", {
  controller: ["Month", function(months) {
    var ctrl = this;
    ctrl.date = new Date();
    ctrl.year = ctrl.date.getFullYear();
    ctrl.months = months.getList();
  }],
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
    rootScope.$on("login", function(e, token) {
      var tokenPayload = jwtHelper.decodeToken(token);
      rootScope.current_user = tokenPayload.user;
      ctrl.current_user = rootScope.current_user;
    });
  }],
  templateUrl: "pages/layout/_current_user.html"
})
.component("formLogin", {
  controller: ["Session", "$location", "$window", "$rootScope", function(sessionService, location, window, rootScope) {
    var ctrl = this;
    ctrl.login = function() {
      sessionService.login(ctrl.email, ctrl.password).then(function(resp) {
        if (resp.data.status) {
          sessionStorage.setItem('token', resp.data.token);
          rootScope.$broadcast("login", resp.data.token);
          location.path("/");
        }
      }, function(err) {
        ctrl.error = "Email o password non valida.";
      });
    }
  }],
  templateUrl: "pages/sessions/_form_login.html"
})
;
