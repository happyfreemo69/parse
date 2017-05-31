var config = require('../../config');
var exports = module.exports;
var AppStarter = require('../../lib/appStarter');
var Mocker = require('nodelibs').Mocker;

exports.waitUntilAppReady = function(app, fn){
    var appStarter = AppStarter(app, {
        port: config.port
    });
    appStarter.onReady(fn);
    appStarter.start();
};

exports.fail = function(done){
    return function(err){
        console.log('err : ',err, err.stack);
        done(err);
    };
};
