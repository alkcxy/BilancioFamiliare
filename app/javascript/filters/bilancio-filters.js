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
  })
  .filter('filterSortObjectProps', function() {
    var recursiveSort = function(element) {
      if (element) {
        let sortedElement = {length: 0};
        Object.keys(element).sort(function(a,b) {
          if (a.toLowerCase() < b.toLowerCase()) {
            return -1;
          }
          if (a.toLowerCase() > b.toLowerCase()) {
            return 1;
          }
          return 0;
        }).forEach(function(key) {
          if (typeof element[key] !== 'string' && typeof element[key] !== 'number') {
            element[key] = recursiveSort(element[key]);
          }
          sortedElement[key] = element[key];
          sortedElement.length++;
        });
        return sortedElement;
      }
    }
    return function(element) {
      return recursiveSort(element);
    }
  })
  .filter('filterMapProps', function() {
    return function(element, prop) {
      let props = [];
      if (element) {
        Object.keys(element).forEach(function(key) {
          if (element[key][prop]) {
            props.push(element[key][prop]);
          }
        });
      }
      return props;
    }
  })
  .filter('filterOperationsYear', function() {
    return function(operations) {
      let operationsObject = {"-":{ "months": {"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[],"10":[],"11":[],"12":[]},
                              "types": {} },
                              "+":{ "months": {"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[],"10":[],"11":[],"12":[]},
                              "types": {} }};
      operations.forEach(function(operation) {
        if (!operationsObject[operation.sign]["types"][operation.type.name]) {
          operationsObject[operation.sign]["types"][operation.type.name] = [];
        }
        operationsObject[operation.sign]["types"][operation.type.name].push(operation);
        operationsObject[operation.sign]["months"][operation.month].push(operation);
      });
      return operationsObject;
    }
  })
  .filter('filterOperationsMonth', function() {
    return function(operations) {
      operationsObject = {"-":{}, "+":{}};
      operations.forEach(function(operation) {
        if (!operationsObject[operation.sign][operation.type.name]) {
          operationsObject[operation.sign][operation.type.name] = [];
        }
        operationsObject[operation.sign][operation.type.name].push(operation);
      });
      return operationsObject;
    }
  });
