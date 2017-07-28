var http = require('http');

var exports = module.exports;
var config = require('../config');

var ctxHeaders = require('nodelibs')['network/headers']
/**

 */
exports.sendPush = function(body, endpoint){
    if(config.hot.logUserIds && body.where && body.where.$or){
        body.where.$or.forEach(function(identifier){
            if(identifier.userId){
                console.log("Sending to userIds:",identifier.userId);
            }
        });
    }
    return new Promise(function(resolve, reject){
        var data = JSON.stringify(body);
        var headers = ctxHeaders.mergeIn({
            'Content-Type':'text/plain',
            'Content-Length': Buffer.byteLength(data)
        });
        var req = http.request({
            method:'POST',
            path:endpoint,
            hostname:config.parse_pri_host,
            port:config.port,
            headers:headers
        }, function(res){
            res.on('data', function(chunk){
                if(res.statusCode != 200){
                    config.logger.inf('failed', chunk && chunk.toString());
                    return reject('fail :'+res.statusCode);
                }
                return resolve();
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}
