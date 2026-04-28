// Create dependency modules
angular.module('operationService', []);
angular.module('angular.filter', []);
angular.module('chart.js', []);
angular.module('actionCableService', []);
angular.module('monthService', []);

import '../operations-directives.js';

describe('operationsDirectives', () => {
  let $componentController, $rootScope, operationService, $window;

  beforeEach(angularModule('operationsDirectives'));

  beforeEach(angularModule(($provide) => {
    // Mock dependencies
    $provide.factory('Operation', () => ({
      get: jasmine.createSpy('get'),
      getList: jasmine.createSpy('getList'),
      destroy: jasmine.createSpy('destroy').and.returnValue({ then: (cb) => cb() }),
      month: jasmine.createSpy('month').and.returnValue({ then: (cb) => cb({data: []}) }),
      spending_limit_cap: jasmine.createSpy('spending_limit_cap'),
      spending_limit_amount: jasmine.createSpy('spending_limit_amount')
    }));
    $provide.factory('channel', () => ({}));
    $provide.factory('Month', () => ({}));
    $provide.value('chart.js', {});
    $provide.factory('filterByFilter', () => jasmine.createSpy('filterBy'));
    $provide.factory('filterByOrFilter', () => jasmine.createSpy('filterByOr'));
    $provide.factory('filterSortObjectPropsFilter', () => jasmine.createSpy('filterSortObjectProps'));
    $provide.factory('filterOperationsMonthFilter', () => jasmine.createSpy('filterOperationsMonth'));
    $provide.factory('sumFilter', () => jasmine.createSpy('sum'));
    $provide.factory('filterMapPropsFilter', () => jasmine.createSpy('filterMapProps'));
    $provide.factory('filterOperationsYearFilter', () => jasmine.createSpy('filterOperationsYear'));
    $provide.factory('mapFilter', () => jasmine.createSpy('map'));
    $provide.factory('beforeWhereFilter', () => jasmine.createSpy('beforeWhere'));
    $provide.factory('orderByFilter', () => jasmine.createSpy('orderBy'));
    $provide.factory('groupByFilter', () => jasmine.createSpy('groupBy'));
    $provide.factory('maxFilter', () => jasmine.createSpy('max'));
    $provide.value('$routeParams', { year: '2026', month: '04' });
  }));

  beforeEach(angularInject((_$componentController_, _$rootScope_, _Operation_, _$window_) => {
    $componentController = _$componentController_;
    $rootScope = _$rootScope_;
    operationService = _Operation_;
    $window = _$window_;
    
    // Mock window.confirm
    $window.confirm = jasmine.createSpy('confirm').and.returnValue(true);
  }));

  describe('tableMonth component', () => {
    let ctrl, $scope;

    beforeEach(() => {
      $scope = $rootScope.$new();
      ctrl = $componentController('tableMonth', { $scope: $scope });
    });

    it('should initialize and load operations', () => {
      expect(ctrl.$onInit).toBeDefined();
    });

    it('should trigger popover on currentTarget (popover fix verification)', () => {
      const mockElement = document.createElement('div');
      const event = {
        currentTarget: mockElement
      };
      
      ctrl.popover(event);
      
      expect($(mockElement).popover).toHaveBeenCalledWith({trigger: 'focus'});
      expect($(mockElement).popover).toHaveBeenCalledWith('show');
    });

    it('should call operationService.destroy with confirmation (destroy fix verification)', () => {
      const id = 123;
      ctrl.destroy(id);
      
      expect($window.confirm).toHaveBeenCalledWith('Sei sicuro?');
      expect(operationService.destroy).toHaveBeenCalledWith(id);
    });

    it('should NOT call operationService.destroy if confirmation is cancelled', () => {
      $window.confirm.and.returnValue(false);
      const id = 123;
      ctrl.destroy(id);
      
      expect($window.confirm).toHaveBeenCalled();
      expect(operationService.destroy).not.toHaveBeenCalled();
    });
  });
});
