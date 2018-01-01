angular.module('actionCableService',[])
.provider("channel", [function() {
//ActionCable.startDebugging()
  var self = this;
  self.config = function(url, channelName, obj) {
    if (!url) {
      url = '/cable';
    }
    if (!channelName) {
      channelName = 'OperationChannel';
    }
    if (!obj) {
      obj = {
        // ActionCable callbacks
        connected: function() {
          console.log("connected: "+this.identifier);
        },
        disconnected: function() {
          console.log("disconnected: "+this.identifier)
        },
        rejected: function() {
          console.log("rejected");
        },
        received: function(data) {
          operations = sessionStorage.getItem('operations');
          if (operations) {
            operations = JSON.parse(operations);
            if (data.method === 'create') {
              operations.push(data.message);
            } else {
              for (var i = 0; i < operations.length; i++) {
                var operation = operations[i];
                if (operation.id === data.message.id) {
                  if (data.method === 'update') {
                    operations[i] = data.message;
                  } else if (data.method === 'destroy') {
                    operations.splice(i, 1);
                  }
                }
              }
            }
            data.message.amount = parseFloat(data.message.amount);
            sessionStorage.setItem('operations',JSON.stringify(operations));
            var max = sessionStorage.getItem('max');
            if (!max || parseInt(data.max) > parseInt(max)) {
              sessionStorage.setItem('max', data.max);
            }
            $(document).trigger('operations.update', [operations]);
          }
        }
      }
    }

    var cable = ActionCable.createConsumer(url);
    self.channel = cable.subscriptions.create(channelName, obj);
  }
  self.$get = [function() {
    return self.channel;
  }];
}]);
