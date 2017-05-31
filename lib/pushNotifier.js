var trad = require('nodelibs').trad;
var parse = require('../externalCalls/parse');
/**
 * [PushNotifier description]
 * @param {{endpoint:String}} config enpoint route for express
 */
function PushNotifier(config){
    if(!config.endpoint){
        throw 'expect endpoint';
    }
    this.endpoint = config.endpoint;
}
/**
 * Will look in dic for every available trad {{displayKey}}_{{lang}} and format it thanks to displayVariables
 * If the formatting is successful, will send an http to myself onto ::endpoint to push notif to mobiles
 * @param  {{displayVariables:Mixed, displayKey:String}} payload see sample/push.json
 * @return {[type]}         [description]
 */
PushNotifier.prototype.sendNotifications = function(payload){
    return parse.sendPush(payload, this.endpoint);
/*
    var key = payload.displayKey;
    var vars = payload.displayVariables;
    delete payload.displayKey;
    delete payload.displayVariables;
    var dfds = []
    var dfds = trad.getLanguages(payload.displayKey).map(lang=>{
        var str = trad.translate(payload.displayKey, lang, payload.data.data);
        var body = {};
        for(var i in payload){body[i]=payload[i]}
        delete body.displayKey;
        delete body.displayVariables;
        //alterate the body to only target user with a superior versions
        return parse.sendPush(body, this.endpoint);
    });
    return Promise.all(dfds);*/
}

module.exports = PushNotifier;
