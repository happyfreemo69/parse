var config = require('../../config'); 
var app = require('../../app');
var requester = require('supertest')(app);
var utils = require('../utils');
var assert = require('assert');
var Mocker = require('nodelibs').Mocker;
var jsonPush = require('../../samples/push.json');
var trad = require('trad-cli');
var parse = require('../../externalCalls/parse');
var PushNotifier = require('../../lib/pushNotifier');
var jsonPush = require('../../samples/push.json');
describe('e2e push', function(){
    before(utils.waitUntilAppReady.bind(null, app));

    it('replaces alert obj with str', Mocker.mockIt(function(mokr){
        mokr.mock(config, 'endpoint', 'dum');

        mokr.mock(config, 'trad_fname', config.trad_fname.replace('{{phase}}','dev'));
        var pn = new PushNotifier(config);

        mokr.mock(pn.trad, 'getLanguages', ()=>['fr','en'])
        mokr.mock(pn.trad, 'translate', function(key, lang, data){
            return 'translate'+lang;
        })
        var expects = {
            '{"$or":[{"deviceType":"android","appVersion":{"gte":"4.1.8"}},{"deviceType":"ios","appVersion":{"gte":"401001003"}},{"$or":[{"userId":{"$in":["592581ed754a1b0d120518a7"]}},{"user":{"$in":["lele@fr.fr"]}}]}]}':['fr','en'].length,
        }
        var langs = {translatefr:1, translateen:1};
        mokr.mock(parse, 'sendPush', function(body){
            expects[JSON.stringify(body.where)]--;
            langs[body.data.alert]--;
        })
        return pn.withDisplayVersions(jsonPush).then(function(){
            assert.equal(Object.keys(expects).length, 1);
            assert.equal(expects[Object.keys(expects)[0]], 0, 'called twice');
            assert.equal(Object.keys(langs).length, 2);
            assert(Object.keys(langs).every(x=>langs[x]===0), 'alert is now directly a string');
        })
    }));
});
