var Message = {
    'Handshake'   : {
        'version'        : '1.0',
        'minimumVersion' : '0.9',
        'channel'        : '/meta/handshake'
    },
    'Connect'     : {
        'channel' : '/meta/connect'
    },
    'Subscribe'   : {
        'channel' : '/meta/subscribe'
    },
    'Unsubscribe' : {
        'channel' : '/meta/unsubscribe'
    },
    'Disconnect'  : {
        'channel' : '/meta/disconnect'
    },
}

var CometTransport = new Class({
  Implements: [Events, Options],

  options: {
  },

  bXD: false,
  connectionType: '',

  initialize: function(comet, options) {
      this.setOptions(options);
      this.comet = comet;
      this.bXD   = (
		    (this.comet.options.url.substring(0,4) == 'http')
		    && (this.comet.options.url.substr(7,location.href.length).replace(/\/.*/, '') != location.host)
		) ? true : false;
    this.connectionType = (this.bXD) ? 'callback-polling' : 'long-polling';
  },
	startup: function(response) {
		if (this.comet.connected) return;
		this.tunnelInit();
	},
	tunnelInit: function() {
		this.openTunnel({
			'channel'        : Message.Connect.channel,
			'clientId'       : this.comet.clientId,
			'id'             : this.comet.nextId++,
			'connectionType' : this.comet.transport.connectionType
		});
	},
	openTunnel: function(msg) {
		this.comet.polling = true;

		this.send(this.comet.options.url, [msg], function(response) {
			response = eval(response);
			this.comet.polling = false;
			this.comet.deliver(response);
			this.comet.transport.closeTunnel();
		}.bind(this));
	},
  closeTunnel: function() {
		if(!this.comet.initialized) return;
		this.reconnect();
	},
	reconnect: function() {
		if (this.comet.advice) {
			if (this.comet.advice.reconnect == 'none') return;

			if (this.comet.advice.interval > 0) {
				setTimeout(this.comet.transport.connect, this.comet.advice.interval);
			} else {
				this.comet.transport.connect();
			}
		} else {
			this.comet.transport.connect();
		}
	},
  connect: function() {

		if (!this.comet.initialized) return;

		if (this.comet.polling) return;

		if (this.comet.advice && this.comet.advice.reconnect == 'handshake') {
			this.comet.connected = false;
			this.comet.init(this.comet.options.url);
		} else if(this.comet.connected) {
			this.comet.transport.openTunnel({
				'clientId'       : this.comet.clientId,
				'id'             : this.comet.nextId++,
				'channel'        : Message.Connect.channel,
        'connectionType' : this.comet.transport.connectionType
			});
		}
	},
  send: function(url, msg, callback) {

    var fCallback = (callback) ? callback : function(response) {
      var response = this.comet._eval(response);
      this.comet.deliver(response);
      this.reconnect();
    }.bind(this);

    new Request.JSONP({
        'url'        : url,
        'data'       : { 'message': JSON.encode(msg) },
        'onComplete' : fCallback
    }).send();
  }
});

var Comet = new Class({
  Implements              : [Events, Options],

  options                 : {
      'url': "http://localhost/cometd",
  },

  batch                   : 0,
  messageQueue            : [],
  subscriptions           : [],
  subscriptionsCallbacks  : [],
  initialized             : [],
  connected               : false,
  nextId                  : 0,
  transport               : null,
  supportedConectionTypes : [ 'long-polling', 'callback-polling' ],
  clientId                : '',

  initialize: function(options) {
      this.setOptions(options);
      this.init();
  },
  init: function() {
      this.initialized = true;
      this.transport   = new CometTransport(this);

      this.startBatch()
      this.transport.send(
          this.options.url,
          [$merge(Message.Handshake, {'id': this.nextId++})],
          this.finishInit.bind(this)
      );
  },
	finishInit: function(response) {
		var response = this._eval(response)[0];
        var success  = (response.successful) ? response.successful : false;

		if(response.advice) this.advice = response.advice;
		
		if(success) {
			this.transport.comet   = this;
			this.transport.version = this.version;
			this.clientId          = response.clientId;
			this.transport.startup(response);
			this.endBatch();
		}
	},
  startBatch: function() {
      this.batch++;
  },
  endBatch: function() {
	  if(--this.batch == 0) {
	      if (this.messageQueue.length > 0) {
		      this.sendMessage(this.messageQueue);
		  }
		  this.messageQueue = [];
	  }
  },
	sendMessage: function(msg) {

		if(this.batch <= 0) {
			if(msg.length > 0) {
				for(var i in msg) {
					msg[i].id       = this.nextId++;
					msg[i].clientId = this.clientId;
				}
			} else {
			    msg = [msg]
				msg[0].clientId = this.clientId;
				msg[0].id       = this.nextId++;
			}

			this.transport.send(this.options.url, msg);
		} else {
			this.messageQueue.push(msg);
		}
	},
	subscribe: function(subscription, callback) {
		if(!this.subscriptions.contains(subscription)) {
			this.subscriptions.push(subscription)
            if (callback) {
                this.subscriptionsCallbacks[subscription] = callback;
            }

			this.sendMessage($merge(Message.Subscribe, { 'subscription': subscription }));
		}
	},
  unsubscribe: function(subscription) {
    this.sendMessage($merge(Message.Unsubscribe, { 'subscription': subscription }));
    delete this.subscriptions.erase(subscription);
  },
  publish: function(channel, data) {
    this.sendMessage({'channel': channel, 'data': data});
  },
	deliver: function(response) {
		response.each(function(element) {
			this._deliver(element);
		}.bind(this));
	},
  disconnect: function() {
		this.subscriptions.each(this.unsubscribe.bind(this));
		this.sendMessage(Message.Disconnect);
		this.initialized = false;
	},
  _deliver: function(msg, data) {
		if(msg.advice) {
			this.advice = msg.advice;
		}

		switch(msg.channel) {
			case Message.Connect.channel:
				if(msg.successful && !this.connected) {
					this.connected = this.initialized;
				}
			break;
		}

		if(msg.data) {
      var cb = this.subscriptionsCallbacks[msg.channel];
      if (cb) {
          cb(msg);
      }
		}
  },
  _eval: function(maybeObj) {
    if ($type(maybeObj) == "string") {
       return eval('(' + maybeObj + ')');
    } else {
       return maybeObj;
    }
  }
});

