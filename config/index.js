'use strict';

var pathModule = require('path');
var Logger = require('nodelibs').Logger;
/**
 * override this config in privateConfig.js for ... private details
 */
exports = module.exports;
exports.http = true;
exports.port = 4004;
exports.debug = true;
exports.phase = 'usr';
exports.phases = ['usr'];
exports.mode = ['dev','prod'][1];
exports.hostname = require('os').hostname();
exports.push_endpoint = '/inner%/push';
exports.install_endpoint = '/inner%/install';
exports.parse_pri_host = '127.0.0.1';
exports.enable_langInPayload = true;
exports.loco_notifNs = 'TRADCLINS_';
exports.notif_withDisplay_android = '4.1.8';
exports.notif_withDisplay_ios = '402000002';
exports.parse = {
    application_id: "Xe2KZ2QFNCgSkFIhXea5nTYz5sjtuYuZ943EXSmT",
    javascript_key: "WuTl7JWodREaHN92YhvvVL7dAQ9jtEKdyqNFQkEk"
}
exports.lgs_appName = 'override me in private';
exports.lgs_pri_host = 'override me in urlDns';

exports.hot = {};
exports.parse_logUserIds = false;

var fs = require('fs');
var res = fs.existsSync(__dirname+'/privateConfig.js') && require('./privateConfig.js');
Object.assign(exports, res);//no deep stuff
Object.assign(exports, require('./urlDns'));

var lgsOptions = {};
lgsOptions.logLvl = 0;
lgsOptions.logToConsole = false;
lgsOptions.logMaxFileSize =5000000;
lgsOptions.logLineMaxSize = 1e4;
lgsOptions.lgs_socketRecycleTime = 100;
lgsOptions.lgs_maxRetries = 5;
lgsOptions.lgs_timeoutBeforeRetry = 2000;
lgsOptions.lgs_processTimeout = 1000;
lgsOptions.lgs_maxBlockSize = 5e5;//remote is 1e6
lgsOptions.lgs_minFullLength = 1e7;
lgsOptions.lgs_unlockAfter = 5000;//retry 5seconds after if needed
lgsOptions.lgs_tickEvery = 1000;
exports.logger = exports.http_logger == 0?
    new Logger({path: __dirname+'/../log/'}, lgsOptions): exports.http_logger == 1?
    new (Logger.http)({appName:exports.lgs_appName, host: exports.lgs_pri_host, port:exports.lgs_pri_port}, lgsOptions):
    new (Logger.http2)({appName:exports.lgs_appName, host: exports.lgs_pri_host, port:exports.lgs_pri_port}, lgsOptions)
