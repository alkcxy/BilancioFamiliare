angular.module('bilancioFilters', []).
  filter('filterByOr', function() {
    return function(elements,field,filters) {
      var out = [];
      elements.forEach(function(elem) {
        var y = filters.filter(function(filter) {
          var attrs = field.match(/([^\.]*)\.(.*)/);
          if (attrs) {
            attrP = attrs[1];
            attrC = attrs[2];
            return elem[attrP][attrC] === filter[attrC];
          }
          return elem[field] === filter;
        });
        if (y && y.length > 0) {
          out.push(elem);
        }
      });
      return out;
    };
  })
  .filter('filterNumReverseSort', function() {
    return function(elements) {
      if (elements) {
        return elements.sort(function(a,b) {
          return b - a;
        })
      }
    }
  });
