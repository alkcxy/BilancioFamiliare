angular.module('monthService',[])
.factory("Month", [function() {
  var months = [
    {_id: 1, id:'01', name: "Gennaio", abbr: "Gen"},
    {_id: 2, id:'02', name: "Febbraio", abbr: "Feb"},
    {_id: 3, id:'03', name: "Marzo", abbr: "Mar"},
    {_id: 4, id:'04', name: "Aprile", abbr: "Apr"},
    {_id: 5, id:'05', name: "Maggio", abbr: "Mag"},
    {_id: 6, id:'06', name: "Giugno", abbr: "Giu"},
    {_id: 7, id:'07', name: "Luglio", abbr: "Lug"},
    {_id: 8, id:'08', name: "Agosto", abbr: "Ago"},
    {_id: 9, id:'09', name: "Settembre", abbr: "Set"},
    {_id: 10, id:'10', name: "Ottobre", abbr: "Ott"},
    {_id: 11, id:'11', name: "Novembre", abbr: "Nov"},
    {_id: 12, id:'12', name: "Dicembre", abbr: "Dic"}
  ];
  return {
    getList: function() {
      return months;
    },
    get: function(id) {
      return months.indexOf(id);
    }
  };
}])
;
