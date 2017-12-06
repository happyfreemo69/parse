'use strict';

var pathModule = require('path');
var Logger = require('nodelibs').Logger;
/**
 * override this config in privateConfig.js for ... private details
 */
exports = module.exports;
exports.https = true;
exports.http = true;
exports.port = 4004;
exports.httpsPort = 4009;
exports.debug = true;
exports.phase = 'usr';
exports.phases = ['usr'];
exports.mode = ['dev','prod'][1];
exports.hostname = require('os').hostname();
exports.push_endpoint = '/inner%/push';
exports.parse_pri_host = '127.0.0.1';
exports.enable_langInPayload = true;
exports.hot = {
    compression_enable:true,
    sendMails : exports.mode === 'prod',
    logLvl: 0,
    logToConsole: false,
    logMaxFileSize:5000000,
    logLineMaxSize: exports.mode == 'prod'?4096:4000000,
    winston_host: 'goto.papertrailapp.com',
    winston_port: 42,
    winston_hostname: "NOHOST",
    winston_slackUrl:'override me, private webhook url',
    winston_pptOnError:true,
    winston_enable: false,
};
exports.notif_withDisplay_android = '4.1.8';
exports.notif_withDisplay_ios = '402000002';
exports.parse = {
    application_id: "Xe2KZ2QFNCgSkFIhXea5nTYz5sjtuYuZ943EXSmT",
    javascript_key: "WuTl7JWodREaHN92YhvvVL7dAQ9jtEKdyqNFQkEk"
}

exports.parse_logUserIds = false;

var fs = require('fs');
var res = fs.existsSync(__dirname+'/privateConfig.js') && require('./privateConfig.js');
for(var i in res){
    exports[i] = res[i];//warn of embedded object
}

exports.hot.winston_slackPptDownMessage = exports.phase+' - '+exports.hot.winston_hostname+':papertrails is down (%date%)';
exports.logger = new Logger({path: __dirname+'/../log/'}, exports.hot);
