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
    this.trad = new Trad({fname:this.trad_fname});
}

/**
 * removes the deviceType predicate at top level
 * @param  {[type]} payload             modified in place
 * @param  {[type]} matchingOldVersions [description]
 * @return {[type]}                     [description]
 */
PushNotifier.prototype._patchPayload = function(payload, matchingOldVersions){

    //for oldVersions, if payload has a displayKey (otherwise no dev is made for SERVICE or NEW VOTE)
    //if this displayKey contains a SERVICE or a NEW VOTE
    //do not send it to ios because only newVersions support it
    var iosIncluded = true;
    if(payload.data && payload.data.data && payload.data.data.displayKey){
        var k = payload.data.data.displayKey;
        if(k=='MGR_ANSWER_PRIVATE_LYYTI'||k=='NEW_VOTE_CITY'){
            if(matchingOldVersions){
                iosIncluded = false;
            }
        }
    }



    var newOr = [
        {deviceType:'android', appVersion:(matchingOldVersions? 'nothingtobematched': {$gte:this.notif_withDisplay_android})}
    ];
    iosIncluded && newOr.push({deviceType:'ios', appVersion:{[matchingOldVersions?'$lt':'$gte']:this.notif_withDisplay_ios}});

    if(payload.where.$or){
        payload.where.$or.forEach(cond=>{
            cond.$or = newOr;
        })
    }else{
        payload.where.$or = newOr;
    }
    delete payload.where.deviceType;
}

PushNotifier.prototype.oldVersions = function(payload){
    var body = JSON.parse(JSON.stringify(payload));
    this._patchPayload(body, true);
    return parse.sendPush(body, this.endpoint);
}

PushNotifier.prototype._setLang = function(payload, lang){
    var getRegex = function(lang){
        if(lang=='en'){
            return {$regex:'^(?!fr|de)'};//fr de actual supported lang per dic
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
        return this.oldVersions(payload);
    }
    var errs = [];
    return Promise.all([
        this.oldVersions(payload).catch(e=>{errs.push(e)}),
        this.withDisplayVersions(payload).catch(e=>{errs.push(e)})
    ]).then(responsePayload=>{ //[{"result":true},{"result":true}]
        if(errs.length){
            throw errs;
        }
        return responsePayload;
    })
}

module.exports = PushNotifier;
