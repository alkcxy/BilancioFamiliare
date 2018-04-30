import ActionCable from 'actioncable/lib/assets/compiled/action_cable';

angular.module('actionCableService',[])
.provider("channel", [function() {
//ActionCable.startDebugging()
  var self = this;
  self.config = function(channelName, obj) {
    if (!channelName) {
      self.channelName = 'OperationChannel';
    } else {
      self.channelName = channelName;
    }
    if (!obj) {
      self.obj = {
        // ActionCable callbacks
        connected: function() {
          console.log("connected: "+this.identifier);
        },
        disconnected: function() {
          console.log("disconnected: "+this.identifier);
          self.channel = undefined;
        },
        rejected: function() {
          console.log("rejected");
          self.channel = undefined;
        },
        subscribed: function() {
          console.log("subscribed");
          console.log(this);
        },
        unsubscribed: function() {
          console.log("unsubscribed");
          self.channel = undefined;
        },
        received: function(data) {
          var operations = null;
          if (sessionStorage.getItem(data.message.year)) {
            operations = JSON.parse(sessionStorage.getItem(data.message.year));
            if (data.method === 'create') {
              operations.push(data.message);
              data.message.amount = parseFloat(data.message.amount);

              sessionStorage.setItem(data.message.year,JSON.stringify(operations));
              var max = JSON.parse(sessionStorage.getItem('max'))
              if (max) {
                console.log("old max")
                console.log(max)
                max.forEach(function(maxYear) {
                  if (parseInt(maxYear.year) === parseInt(data.message.year) && maxYear.max < data.max) {
                    console.log(data.max)
                    maxYear.id = data.message.id;
                    maxYear.max = data.max;
                  }
                })
                console.log("new max")
                console.log(max)
                sessionStorage.setItem('max', JSON.stringify(max));
              }
              $(document).trigger('operations.update', [operations]);
            } else {
              if (!(data.message instanceof Array)) {
                data.message = [data.message];
              }
              data.message.forEach(function(message) {
                if (sessionStorage.getItem(data.message.year)) {
                  operations = JSON.parse(sessionStorage.getItem(data.message.year));
                  for (var i = 0; i < operations.length; i++) {
                    var operation = operations[i];
                    if (operation.id === message.id) {
                      if (data.method === 'update') {
                        operations[i] = message;
                        message.amount = parseFloat(message.amount);
                        var max = JSON.parse(sessionStorage.getItem('max'))
                        sessionStorage.setItem(data.message.year,JSON.stringify(operations));
                        if (max) {
                          max.forEach(function(maxYear) {
                            if (parseInt(maxYear.year) === parseInt(data.message.year) && maxYear.max < data.max) {
                              maxYear.id = message.id;
                              maxYear.max = data.max;
                            }
                          })
                          sessionStorage.setItem('max', JSON.stringify(max));
                        }
                      } else if (data.method === 'destroy') {
                        operations.splice(i, 1);
                      }
                    }
                  }
                  $(document).trigger('operations.update', [operations]);
                }
              });
            }
          }
        }
      };
    } else {
      self.obj = obj;
    }
  };
  self.connect = function() {
    console.log("in connect...");
    if (!self.channel) {
      console.log("try connecting...");
      if (sessionStorage.getItem('token')) {
        console.log("connecting...");
        self.cable = ActionCable.createConsumer();
        self.channel = self.cable.subscriptions.create({ channel: self.channelName, token: sessionStorage.getItem('token') }, self.obj);
      }
    } else {
      console.log("try disconnecting...");
      if (!sessionStorage.getItem('token')) {
        console.log("disconnecting...");
        self.cable.disconnect();
      }
    }
    console.log("out connect...");
  };
  self.$get = [function() {
    return {channel: self.channel, connect: self.connect};
  }];
}]);
