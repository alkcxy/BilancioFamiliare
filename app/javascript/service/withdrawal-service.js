angular.module('withdrawalService',[])
.factory("Withdrawal", ['$http', function($http) {
  var filterValidAttributes = function(withdrawal) {
    var o = withdrawal.withdrawal;
    var o2 = {};
    o2.date = o.date.getFullYear()+"-"+(o.date.getMonth()+1)+"-"+o.date.getDate();
    o2.user_id = o.user_id;
    o2.amount = o.amount;
    o2.note = o.note;
    o2.complete = o.complete;
    o2.archive = o.archive;
    return {withdrawal: o2};
  };
  return {
    getList: function() {
      return $http.get('/withdrawals.json');
    },
    getAll: function() {
      return $http.get('/withdrawals/all.json');
    },
    getArchive: function() {
      return $http.get('/withdrawals/archive.json');
    },
    get: function(id) {
      return $http.get('/withdrawals/'+id+'.json');
    },
    post: function(withdrawal) {
      return $http.post('/withdrawals.json', filterValidAttributes(withdrawal));
    },
    put: function(id, withdrawal) {
      return $http.put('/withdrawals/'+id+'.json', filterValidAttributes(withdrawal));
    },
    destroy: function(id) {
      return $http.delete('/withdrawals/'+id+'.json');
    }
  };
}])
;
