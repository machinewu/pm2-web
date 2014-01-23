var WebSocketResponder = require(__dirname + "/../../../../server/components/WebSocketResponder"),
	sinon = require("sinon"),
	should = require("should");

module.exports = {
	setUp: function(done) {
		this._responder = new WebSocketResponder();
		this._responder._config = {
			get: sinon.stub()
		};
		this._responder._webSocketServer = {
			on: sinon.stub(),
			broadcast: sinon.stub()
		}
		this._responder._logger = {
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			debug: sinon.stub()
		};
		this._responder._pm2Listener = {
			on: sinon.stub(),
			startProcess: sinon.stub(),
			stopProcess: sinon.stub(),
			restartProcess: sinon.stub()
		};
		this._responder._hostList = {
			getHosts: sinon.stub(),
			addLog: sinon.stub()
		};

		done();
	},

	"Should receive method invocation from client": function(test) {
		this._responder.afterPropertiesSet();

		var client = {
			on: sinon.stub(),
			send: sinon.stub()
		};

		this._responder._webSocketServer.on.getCall(0).args[0].should.equal("connection");
		var onConnection = this._responder._webSocketServer.on.getCall(0).args[1];

		onConnection(client);

		client.on.callCount.should.equal(1);
		client.on.getCall(0).args[0].should.equal("message");
		var onMessage = client.on.getCall(0).args[1];

		var invocation = {
			method: "foo",
			args: [1]
		};

		this._responder[invocation.method] = function(client, num) {
			num.should.equal(invocation.args[0]);

			test.done();
		};

		onMessage(JSON.stringify(invocation));
	},

	"Should start a process": function(test) {
		var client = "localhost";
		var host = "foo";
		var pid = 10;

		this._responder.startProcess(client, host, pid);

		this._responder._pm2Listener.startProcess.callCount.should.equal(1);
		this._responder._pm2Listener.startProcess.getCall(0).args[0].should.equal(host);
		this._responder._pm2Listener.startProcess.getCall(0).args[1].should.equal(pid);

		test.done();
	},

	"Should stop a process": function(test) {
		var client = "localhost";
		var host = "foo";
		var pid = 10;

		this._responder.stopProcess(client, host, pid);

		this._responder._pm2Listener.stopProcess.callCount.should.equal(1);
		this._responder._pm2Listener.stopProcess.getCall(0).args[0].should.equal(host);
		this._responder._pm2Listener.stopProcess.getCall(0).args[1].should.equal(pid);

		test.done();
	},

	"Should restart a process": function(test) {
		var client = "localhost";
		var host = "foo";
		var pid = 10;

		this._responder.restartProcess(client, host, pid);

		this._responder._pm2Listener.restartProcess.callCount.should.equal(1);
		this._responder._pm2Listener.restartProcess.getCall(0).args[0].should.equal(host);
		this._responder._pm2Listener.restartProcess.getCall(0).args[1].should.equal(pid);

		test.done();
	},

	"Should broadcast system data": function(test) {
		this._responder.afterPropertiesSet();

		this._responder._webSocketServer.broadcast = sinon.stub();

		// find the callback
		this._responder._pm2Listener.on.getCall(2).args[0].should.equal("systemData");
		var callback = this._responder._pm2Listener.on.getCall(2).args[1];

		// the system data we are sending
		var data = {};

		// invoke the callback
		callback(data);

		this._responder._webSocketServer.broadcast.getCall(0).args[0].method.should.equal("onSystemData");
		this._responder._webSocketServer.broadcast.getCall(0).args[0].args[0].should.equal(data);

		test.done();
	},

	"Should broadcast error logs": function(test) {
		this._responder.afterPropertiesSet();

		this._responder._webSocketServer.broadcast = sinon.stub();

		// find the callback
		this._responder._pm2Listener.on.getCall(0).args[0].should.equal("log:err");
		var callback = this._responder._pm2Listener.on.getCall(0).args[1];

		// the log data we are sending
		var data = {
			name: "foo",
			process: {
				pm2_env: {
					pm_id: 1
				}
			},
			data: "bar"
		};

		// invoke the callback
		callback(data);

		this._responder._webSocketServer.broadcast.getCall(0).args[0].method.should.equal("onErrorLog");
		this._responder._webSocketServer.broadcast.getCall(0).args[0].args[0].should.equal("foo");
		this._responder._webSocketServer.broadcast.getCall(0).args[0].args[1].should.equal(1);
		this._responder._webSocketServer.broadcast.getCall(0).args[0].args[2].should.equal("bar");

		test.done();
	},

	"Should broadcast info logs": function(test) {
		this._responder.afterPropertiesSet();

		this._responder._webSocketServer.broadcast = sinon.stub();

		// find the callback
		this._responder._pm2Listener.on.getCall(1).args[0].should.equal("log:out");
		var callback = this._responder._pm2Listener.on.getCall(1).args[1];

		// the log data we are sending
		var data = {
			name: "foo",
			process: {
				pm2_env: {
					pm_id: 1
				}
			},
			data: "bar"
		};

		// invoke the callback
		callback(data);

		this._responder._webSocketServer.broadcast.getCall(0).args[0].method.should.equal("onInfoLog");
		this._responder._webSocketServer.broadcast.getCall(0).args[0].args[0].should.equal("foo");
		this._responder._webSocketServer.broadcast.getCall(0).args[0].args[1].should.equal(1);
		this._responder._webSocketServer.broadcast.getCall(0).args[0].args[2].should.equal("bar");

		test.done();
	}
};
