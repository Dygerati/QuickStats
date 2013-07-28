
var system = require('system'),
	_ = require('underscore'),
	QS;

function QuickStats(){
	QS = this;

	//Ensure URL provided
	if (system.args.length === 1) {
    	console.log('Usage: quickstats.js <some URL>');
	    phantom.exit();
	}

	//Initialize vars
	QS.page = require('webpage').create();
	QS.url = system.args[1];
	QS.times = {};
	QS.resourceLog = {};

	//Execute
	QS.run();
}


QuickStats.prototype = {
	run: function(){
		QS.attachEvents();
		QS.page.open(QS.url, QS.loadComplete);
	},

	loadComplete: function(status){
		var maxRequest = QS.returnMaxRequest(),
			cachedRequests = QS.returnRequestByStatus(304),
			notFoundRequests = QS.returnRequestByStatus(404);


		console.log('DomReady: ' + (QS.times.DOMloaded - QS.times.loadStarted) + 'ms');

		console.log('onLoad: ' + (QS.times.loadFinished - QS.times.loadStarted) + 'ms');

		console.log('Longest request:');
		console.log(maxRequest.url + ' (' + maxRequest.duration + 'ms)');

		console.log('Cached requests:');
		for(var i = 0; i < cachedRequests.length; i++) {
			console.log(cachedRequests[i].url, " (", cachedRequests[i].status + ")");
		}	

		console.log('404 requests:');
		for(var i = 0; i < notFoundRequests.length; i++) {
			console.log(notFoundRequests[i].url, " (",notFoundRequests[i].status + ")");
		}	

		phantom.exit();
	},

	events: {
		onConsoleMessage: function(log){
			if(log === 'DOMContentLoaded') {
				QS.times.DOMloaded = new Date().getTime();
			} 
		},

		onInitialized: function(){

			QS.page.evaluate(function(){
				document.addEventListener('DOMContentLoaded', function(){
					console.log('DOMContentLoaded');
				}, false);
			});

		},

		onLoadStarted: function(){
			QS.times.loadStarted = new Date().getTime();
		},

		onLoadFinished: function(){
			QS.times.loadFinished = new Date().getTime();
		},

		onResourceRequested: function(request, network) {
			var logObj = QS.resourceLog[request.id] || {};

			logObj.start = request.time;
			logObj.url = request.url;

			QS.resourceLog[request.id] = logObj;
		},

		onResourceReceived: function(response) {
			if(response.stage === "end") {

				var logObj = QS.resourceLog[response.id] || {};

				logObj.finish = response.time;
				logObj.status = response.status;
				logObj.duration = logObj.finish - logObj.start;

			}

		}
	},

	attachEvents: function(){
		for(event in QS.events) {
			QS.page[event] = QS.events[event];
		}
	},

	returnMaxRequest: function(){
		return _.max(QS.resourceLog, function(logObj){
			return logObj.duration;
		});
	},

	returnRequestByStatus: function(status) {
		return _.filter(QS.resourceLog, function(obj){
			return obj.status == status;
		});
	}

};

QS = new QuickStats();