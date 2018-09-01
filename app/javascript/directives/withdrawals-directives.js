angular.module('withdrawalsDirectives',['withdrawalService'])
.component("withdrawals", {
  controller: ['Withdrawal', function(withdrawalservice) {
    var ctrl = this;
    ctrl.$onInit = function() {
      withdrawalservice.getList().then(function(resp) {
        ctrl.withdrawals = resp.data;
      });
    };
    ctrl.destroy = function(id) {
      withdrawalservice.destroy(id).then(function(resp) {
        for (var i = 0; i < ctrl.withdrawals.length; i++) {
          var user = ctrl.withdrawals[i];
          if (user.id === parseInt(id)) {
            ctrl.withdrawals.splice(i, 1);
            break;
          }
        }
      });
    };
  }],
  templateUrl: "pages/withdrawals/withdrawals.html"
})
.component("withdrawalsAll", {
  controller: ['Withdrawal', function(withdrawalservice) {
    var ctrl = this;
    ctrl.$onInit = function() {
      withdrawalservice.getAll().then(function(resp) {
        ctrl.withdrawals = resp.data;
      });
    };
    ctrl.destroy = function(id) {
      withdrawalservice.destroy(id).then(function(resp) {
        for (var i = 0; i < ctrl.withdrawals.length; i++) {
          var user = ctrl.withdrawals[i];
          if (user.id === parseInt(id)) {
            ctrl.withdrawals.splice(i, 1);
            break;
          }
        }
      });
    };
  }],
  templateUrl: "pages/withdrawals/withdrawals_all.html"
})
.component("withdrawalShow", {
  controller: ['Withdrawal', '$routeParams', function(withdrawalservice, routeParams) {
    var ctrl = this;
    withdrawalservice.get(routeParams.id).then(function(resp) {
      ctrl.withdrawal = resp.data;
    });
  }],
  templateUrl: "pages/withdrawals/_withdrawal.html"
})
.component('withdrawalForm', {
  controller: ["Withdrawal", "User", "$routeParams", "$location", function(withdrawalservice, userService, routeParams, location) {
      var ctrl = this;
      userService.getList().then(function(resp) {
        ctrl.users = resp.data;
      });
      if (routeParams.id) {
        ctrl.submit = function() {
          withdrawalservice.put(routeParams.id, {withdrawal: ctrl.withdrawal}).then(function(resp) {
            resp.data.date = new Date(resp.data.year, resp.data.month-1, resp.data.day);
            ctrl.withdrawal = resp.data;
            location.path('/withdrawals/'+ctrl.withdrawal.id);
          });
        };
        withdrawalservice.get(routeParams.id).then(function(resp) {
          resp.data.date = new Date(resp.data.year, resp.data.month-1, resp.data.day);
          ctrl.withdrawal = resp.data;
        });
      } else {
        ctrl.withdrawal = {date: new Date()};
        ctrl.submit = function() {
          withdrawalservice.post({withdrawal: ctrl.withdrawal}).then(function(resp) {
            resp.data.date = new Date(resp.data.year, resp.data.month-1, resp.data.day);
            ctrl.withdrawal = resp.data;
            location.path('/withdrawals/'+ctrl.withdrawal.id);
          });
        };
      }
  }],
  templateUrl: "pages/withdrawals/_form.html"
})
;
