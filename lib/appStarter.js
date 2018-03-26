var fs = require("fs");

var expects = {};

var onlyOneCbk;
var STOPPED = 0;
var ONGOING = 1;
var READY = 2;
var status = STOPPED; //nothing, ongoing, ready

/**
 * call ready with the keys
 * once all keys of keys have been called with ready, a ready event will be emitted
 * 
 * @param  app
 * @param  conf: dbUrl to connect to
 * @return 
 */
module.exports = function(app, conf){
    var Logger = app.config.logger;
    var that = {
        allReady:function(){
            return Object.keys(expects).every(function(key){
                return expects[key];
            });
        },
        ready:function(key){
            if(Object.keys(expects).indexOf(key) == -1){
                return console.log('ignoring ',key);
            }
            expects[key] = true;
            if(that.allReady()){
                status = READY;
                console.log('serv start ', new Date());
                fs.readFile("./REVISION", 'utf8', function(err, revision){
                    if(err){return Logger.inf('APPVERSION_statup REVISION file NOT FOUND');}
                    Logger.inf('APPVERSION_statup', revision);
                });
                
                onlyOneCbk && onlyOneCbk();
            }
        },
        start:function(){
            if(status > 0) return false;
            status = ONGOING;

            if(conf.port){
                expects.http = false;
                app.listen(conf.port, function(){
                    console.info('http on '+conf.port);
                    that.ready('http');
                });
                app.on('error', function(e){
                    console.log(new Date, 'on listening error', e);
                })
            }
        },
        onReady:function(cbk){
            if(status == READY){
                return cbk();
            }
            onlyOneCbk = cbk;
        }
    }
    return that;
}
    
