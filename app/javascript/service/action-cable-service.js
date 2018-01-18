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
          if (!(data.message instanceof Array)) {
            data.message = [data.message];
          }
          var operations = null;
          if (sessionStorage.getItem(data.year)) {
            operations = JSON.parse(sessionStorage.getItem(data.year));
            data.message.forEach(function(message) {
              if (data.method === 'create') {
                operations.push.apply(operations, data.message);
                data.message.forEach(function(elem) {
                  elem.amount = parseFloat(elem.amount);
                });
              }
              for (var i = 0; i < operations.length; i++) {
                var operation = operations[i];
                if (operation && operation.id === message.id) {
                  if (data.method === 'update') {
                    operations[i] = message;
                    message.amount = parseFloat(message.amount);
                  } else if (data.method === 'destroy') {
                    operations.splice(i, 1);
                  }
                }
              }
            });
          }

          sessionStorage.setItem(data.year,JSON.stringify(operations));
          var max = sessionStorage.getItem('max');
          if (!max) {
            for (var i = 0; i < max.length; i++) {
              if (max[i].year === data.year) {
                if (parseInt(data.max) > parseInt(max[i].max)) {
                  max[i].max = parseInt(data.max);
                  sessionStorage.setItem('max', max);
                  break;
                }
              }
            }
          }
          $(document).trigger('operations.update', [operations, data.year]);
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
