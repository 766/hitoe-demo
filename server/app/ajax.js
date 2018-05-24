var http = require("http"),
	Url = require("url"),
	querystring = require('querystring'),
	$ = {};

// 默认值
function defaults(url){
	return {
		// 如果返回false可以取消本次请求
		beforeSend: function(req){},
		complete: function(req){},
		data: '', // Object, String
		dataType: 'html',
		error: function(){},
		headers: {}, // {k:v, ...}
		statusCode: {},
		success: function(data){},
		timeout: 10,
		type: 'GET', // GET, POST
		url: url
	}
}

/**
 * 
 */
$.ajax = function ( settings ){
	// ajax(settings)
	if( typeof settings === "object" ){
		// 处理默认值继承
		// todo ...
		
	}
	
	var params = Url.parse(settings.url, true);
	// params 解析出来的参数如下
	// {
	// "protocol":"http:",
	// "slashes":true,
	// "host":"localhost:3000",
	// "port":"3000",
	// "hostname":"localhost",
	// "href":"http://localhost:3000/?d=1",
	// "search":"?d=1",
	// "query":{"d":"1"},
	// "pathname":"/",
	// "path":"/?d=1"
	// }
	
	var options = {
		host: params.hostname,
		port: params.port || 80,
		path: params.path,
		method: settings.type
	};
	
	var req = http.request(options, function(res) {
		var data = '';
		res.on('data', function(chunk){
			data += chunk;
		}).on('end', function(){
			if(	settings.dataType === "json" ){
				try{
					data = JSON.parse(data);
				}catch(e){
					data = null;
				}
			}
			settings.success(data);
			if(settings.complete)
				settings.complete(req);
		});
	}).on('error', function(e) {
		settings.error(e);
	});
	
	if( typeof settings.beforeSend === "function" ){
		if ( !settings.beforeSend(req) ){
			settings.complete(req);
			req.end();
			return false;
		}
	}
	
	if( settings.type === "POST" ){
		req.write(querystring.stringify(settings.data));
	}
	
	req.setTimeout(settings.timeout || 5000);
	req.end();
}

export default $;