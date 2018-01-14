import ActionCable from 'actioncable/lib/assets/compiled/action_cable';

angular.module('actionCableService',[])
.provider("channel", [function() {
//ActionCable.startDebugging()
  var self = this;
  self.config = function(channelName, obj) {
    if (!channelName) {
      channelName = 'OperationChannel';
    }
    if (!obj) {
      obj = {
        // ActionCable callbacks
        connected: function() {
          //console.log("connected: "+this.identifier);
        },
        disconnected: function() {
          //console.log("disconnected: "+this.identifier)
        },
        rejected: function() {
          //console.log("rejected");
        },
        received: function(data) {
          var operations = null;
          if (sessionStorage.getItem('operations')) {
            operations = JSON.parse(sessionStorage.getItem('operations'));
            if (data.method === 'create') {
              operations.push(data.message);
              data.message.amount = parseFloat(data.message.amount);
            } else {
              if (!(data.message instanceof Array)) {
                data.message = [data.message];
              }
              data.message.forEach(function(message) {
                for (var i = 0; i < operations.length; i++) {
                  var operation = operations[i];
                  if (operation.id === message.id) {
                    if (data.method === 'update') {
                      operations[i] = message;
                      message.amount = parseFloat(message.amount);
                    } else if (data.method === 'destroy') {
                      operations.splice(i, 1);
                    }
                  }
                }
              })
            }

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

    var cable = ActionCable.createConsumer();
    self.channel = cable.subscriptions.create(channelName, obj);
  }
  self.$get = [function() {
    return self.channel;
  }];
}]);
