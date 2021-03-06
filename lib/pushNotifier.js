var config = require('../config');
var Trad = require('trad-cli');
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
    this.init();
}
PushNotifier.prototype.init = function(){
    this.trad = new Trad({NS:config.loco_notifNs, fname:this.trad_fname});
}

/**
 * removes the deviceType predicate at top level
 * @param  {[type]} payload             modified in place
 * @return {[type]}                     [description]
 */
PushNotifier.prototype._patchPayload = function(payload){
    var newOr = [
        {deviceType:'android', appVersion:{$gte:this.notif_withDisplay_android}},
        {deviceType:'ios', appVersion:{'$gte':this.notif_withDisplay_ios}}
    ];

    if(payload.where.$or){
        payload.where.$or.forEach(cond=>{
            cond.$or = newOr;
        })
    }else{
        payload.where.$or = newOr;
    }
    delete payload.where.deviceType;
}
PushNotifier.prototype._setLang = function(payload, lang){
    var getRegex = function(lang){
        if(lang=='en'){
            return {$regex:'^(?!fr|de|nl)'};//fr, de, nl actual supported lang per dic
        }
        return {$regex:'^'+lang}
    }
    if(payload.where.$or){
        payload.where.$or.forEach(cond=>{
            cond.localeIdentifier = getRegex(lang);
        });
    }else{
        payload.where.localeIdentifier = getRegex(lang);
    }
    return true;
}

PushNotifier.prototype.withDisplayVersions = function(payload){
    var key = payload.data.data.displayKey;
    var langs = this.trad.getLanguages(key);
    if(langs.length == 0){
        langs = ['en']; //send the key as is
        config.logger.inf('missing translation for ', key);
    }
    var dfds = langs.map(lang=>{
        var str = this.trad.translate(key, lang, payload.data.data.displayData);
        var body = JSON.parse(JSON.stringify(payload));
        body.data.alert = str;
        if(config.enable_langInPayload){
            body.data.data.lang = lang;
        }
        this._patchPayload(body, false);
        this._setLang(body, lang);
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
        throw 'invalid payload';
    }
    var errs = [];
    return this.withDisplayVersions(payload).then(responsePayload=>{
        return [responsePayload];
    }).catch(e=>{
        throw [e];
    });
}

module.exports = PushNotifier;
