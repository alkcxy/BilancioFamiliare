import '../action-cable-service.js';

describe('actionCableService', () => {
  let channelProvider, channel, $rootScope;

  beforeEach(angularModule('actionCableService', (_channelProvider_) => {
    channelProvider = _channelProvider_;
  }));

  beforeEach(angularInject((_channel_, _$rootScope_) => {
    channel = _channel_;
    $rootScope = _$rootScope_;
    // Ensure token is set before connecting
    sessionStorage.setItem('token', 'fake-token');
    // Aggressively reset provider state
    delete channelProvider.channel;
    delete channelProvider.cable;
    delete channelProvider.channelName;
    ActionCable.createConsumer.calls.reset();
    ActionCable._mockSubscriptions.create.calls.reset();
  }));

  afterEach(() => {
    sessionStorage.clear();
    $(document).off('operations.update');
  });

  describe('received callback', () => {
    let receivedCallback;

    beforeEach(() => {
      // Mock ActionCable setup
      channelProvider.config();
      channel.connect();
      
      // Extract the received callback from the mocked subscription
      const mostRecentCall = ActionCable._mockSubscriptions.create.calls.mostRecent();
      if (!mostRecentCall) {
          // Log state for debugging
          console.log('Token in storage:', sessionStorage.getItem('token'));
          console.log('Channel on provider:', channelProvider.channel);
          throw new Error('ActionCable.subscriptions.create was not called! Check channel.connect() logic.');
      }
      receivedCallback = mostRecentCall.args[1].received;
    });

    it('should update sessionStorage and trigger event on create', (done) => {
      const year = 2026;
      const initialOperations = [];
      sessionStorage.setItem(year.toString(), JSON.stringify(initialOperations));

      const newMessage = { id: 123, year: year, amount: '10.5', note: 'test' };
      const data = { method: 'create', message: newMessage, max: 1000 };

      $(document).on('operations.update', (e, operations) => {
        expect(operations.length).toBe(1);
        expect(operations[0].id).toBe(123);
        expect(operations[0].amount).toBe(10.5); // Ensure it's parsed as float
        
        const stored = JSON.parse(sessionStorage.getItem(year.toString()));
        expect(stored.length).toBe(1);
        done();
      });

      receivedCallback(data);
    });

    it('should remove operation from sessionStorage on destroy', (done) => {
      const year = 2026;
      const initialOperations = [
        { id: 123, year: year, amount: 10.5 },
        { id: 456, year: year, amount: 20.0 }
      ];
      sessionStorage.setItem(year.toString(), JSON.stringify(initialOperations));

      const data = { 
        method: 'destroy', 
        message: { id: 123 }, 
        year: year, 
        max: 2000 
      };

      $(document).on('operations.update', (e, operations) => {
        expect(operations.length).toBe(1);
        expect(operations[0].id).toBe(456);
        
        const stored = JSON.parse(sessionStorage.getItem(year.toString()));
        expect(stored.length).toBe(1);
        expect(stored[0].id).toBe(456);
        done();
      });

      receivedCallback(data);
    });
    
    it('should correctly handle year from data.year if data.message.year is missing (bug fix verification)', (done) => {
      const year = 2026;
      const initialOperations = [{ id: 123, year: year, amount: 10.5 }];
      sessionStorage.setItem(year.toString(), JSON.stringify(initialOperations));

      // This mimics the destroy case where message might only have id
      const data = { 
        method: 'destroy', 
        message: { id: 123 }, 
        year: year, 
        max: 2000 
      };

      $(document).on('operations.update', (e, operations) => {
        expect(operations.length).toBe(0);
        done();
      });

      receivedCallback(data);
    });
  });
});
