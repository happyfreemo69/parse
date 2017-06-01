var config = require('../config');
var trad = require('trad-cli');
var parse = require('../externalCalls/parse');
/**
 * [PushNotifier description]
 * @param {{endpoint:String}} config enpoint route for express
 */
function PushNotifier(config){
    ['endpoint', 'notif_withDisplay_android', 'notif_withDisplay_ios'].forEach(x=>{
        if(!config[x]){
            throw 'expect '+x;
        }
        this[x] = config[x];
    })
}

/**
 * removes the deviceType predicate at top level
 * @param  {[type]} payload             modified in place
 * @param  {[type]} matchingOldVersions [description]
 * @return {[type]}                     [description]
 */
PushNotifier.prototype._patchPayload = function(payload, matchingOldVersions){
    payload.where['$or'] = [
        {deviceType:'android', appVersion:{[matchingOldVersions?'$lt':'gte']:this.notif_withDisplay_android}},
        {deviceType:'ios', appVersion:{[matchingOldVersions?'$lt':'gte']:this.notif_withDisplay_ios}}
    ]
    delete payload.where.deviceType;
}
PushNotifier.prototype.oldVersions = function(payload){
    this._patchPayload(payload, true);
    return parse.sendPush(p, this.endpoint);
}

PushNotifier.prototype.withDisplayVersions = function(payload){
    var key = payload.data.data.displayKey;

    var dfds = trad.getLanguages(key).map(lang=>{
        var str = trad.translate(key, lang, payload.data.data);
        var body = JSON.parse(JSON.stringify(payload));
        body.data.alert['loc-args'] = [str];
        this._patchPayload(body, false);
        //alterate the body to only target user with a superior versions
        return parse.sendPush(body, this.endpoint);
    });
    return Promise.all(dfds);
}
/**
 * Will look in dic for every available trad {{displayKey}}_{{lang}} and format it thanks to displayVariables
 * If the formatting is successful, will send an http to myself onto ::endpoint to push notif to mobiles
 * @param  {{displayVariables:Mixed, displayKey:String}} payload see sample/push.json
 * @return {[type]}         [description]
 */
PushNotifier.prototype.sendNotifications = function(payload){
    if(!payload.data || !payload.data.data || !payload.data.data.displayKey){
        config.logger.inf('invalid payload for trad');
        return this.oldVersions(payload);
    }
    return Promise.all([
        this.oldVersions(payload),
        this.withDisplayVersions(payload)
    ])
}

module.exports = PushNotifier;
