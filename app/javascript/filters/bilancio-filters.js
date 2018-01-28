angular.module('bilancioFilters', []).
  filter('filterByOr', function() {
    return function(elements,field,filters) {
      var out = [];
      elements.forEach(function(elem) {
        var y = filters.filter(function(filter) {
          return elem[field] === filter;
        });
        if (y && y.length > 0) {
          out.push(elem);
        }
      });
      return out;
    };
  });
