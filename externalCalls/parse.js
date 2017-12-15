var http = require('http');

var exports = module.exports;
var config = require('../config');
var context = require('nodelibs').context;

function mergeHeaders(data){
    var obj = {};
    keep = ['x-parse-master-key', 'x-parse-application-id'];
    keep.forEach(x=>{
        var y = context.get(x);
        if(y){
            obj[x] = y;
        }
    })
    var ctxHeaders = require('nodelibs')['network/headers'];
    return ctxHeaders.mergeIn(Object.assign(obj, data))
}
/**

 */
exports.sendPush = function(body, endpoint){
    if(config.parse_logUserIds && body.where && body.where.$or){
        body.where.$or.forEach(function(identifier){
            if(identifier.userId){
                console.log("Sending to userIds:",identifier.userId);
            }
        });
    }
    return new Promise(function(resolve, reject){
        var data = JSON.stringify(body);
        var headers = mergeHeaders({
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
            var buf = '';
            res.on('data', function(chunk){
                if(res.statusCode != 200){
                    config.logger.inf('failed', chunk && chunk.toString());
                    return reject('fail :'+res.statusCode);
                }
                buf += chunk.toString();
            });
            res.on('end', function(){
                try{
                    return resolve(JSON.parse(buf));
                }catch(e){
                    return reject(e);
                }
                return resolve(buf);
            })
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

/**
response:
 { results: 
   [ { objectId: 'mmkk55DuAR',
       timeZone: 'Europe/Paris',
       badge: 0,
       appName: 'Happy Synty DEV',
       installationId: '6579bfb6-9794-4b14-9013-a8273dca4887',
       appVersion: '402000000',
       deviceType: 'ios',
       appIdentifier: 'blue.freemo.synty-app.DEV',
       parseVersion: '1.14.4',
       localeIdentifier: 'en-US',
       createdAt: '2017-06-15T07:40:32.671Z',
       updatedAt: '2017-06-21T13:36:34.469Z',
       user: '456@789.com',
       userId: '594a73ceb541827b45c8d551' } ] }

   results may be empty if nothing found
 */
exports.getInstallations = function(body, endpoint){

    return new Promise(function(resolve, reject){
        var data = JSON.stringify(body);
        var headers = mergeHeaders({
            'Content-Type':'text/plain',
            'Content-Length': Buffer.byteLength(data)
        });
        var opts = {
            method:'GET',
            path:endpoint,
            hostname:config.parse_pri_host,
            port:config.port,
            headers:headers
        };
        var req = http.request(opts, function(res){
            var buf = '';
            res.on('data', function(chunk){
                if(res.statusCode != 200){
                    config.logger.inf('failed', chunk && chunk.toString());
                    return reject('fail :'+res.statusCode);
                }
                buf += chunk.toString();
            });
            res.on('end', function(){
                try{
                    return resolve(JSON.parse(buf));
                }catch(e){
                    return reject(e);
                }
                return resolve(buf);
            })
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

/**
 * @param  {installation} body     expects _id (installationId) to be present
 * @param  {[type]} endpoint [description]
 * @return {[type]}          [description]
 */
exports.removeInstallation = function(body, endpoint){
    return new Promise(function(resolve, reject){
        var data = JSON.stringify(body);
        var headers = mergeHeaders({
            'Content-Type':'text/plain',
            'Content-Length': Buffer.byteLength(data)
        });
        var opts = {
            method:'DELETE',
            path:endpoint+'/'+body._id,
            hostname:config.parse_pri_host,
            port:config.port,
            headers:headers
        };
        console.log('removing ', body)
        var req = http.request(opts, function(res){
            var buf = '';
            res.on('data', function(chunk){
                if(res.statusCode != 200){
                    config.logger.inf('failed', chunk && chunk.toString());
                    return reject('fail :'+res.statusCode);
                }
                buf += chunk.toString();
            });
            res.on('end', function(){
                try{
                    return resolve(JSON.parse(buf));
                }catch(e){
                    return reject(e);
                }
                return resolve(buf);
            })
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

/*setTimeout(function(){
  exports.getInstallations(require('../samples/get_installations.json'), config.install_endpoint).catch(e=>{
    console.log('failed ', e, e.stack);
  }).then(x=>{
    console.log('RESULT ', x)
  })
    
  exports.removeInstallation(require('../samples/remove_installation.json'), config.install_endpoint).catch(e=>{
    console.log('failed ', e, e.stack);
  }).then(x=>{
    console.log('RESULT ', x)
  })
}, 1000)*/