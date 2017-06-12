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
describe('lib pushNotifier', function(){
    before(utils.waitUntilAppReady.bind(null, app));

    it('replaces alert obj with str', Mocker.mockIt(function(mokr){
        mokr.mock(config, 'endpoint', 'dum');
        var pn = new PushNotifier(config);

        mokr.mock(pn.trad, 'getLanguages', ()=>['fr','en'])
        mokr.mock(pn.trad, 'translate', function(key, lang, data){
            return 'translate'+lang;
        })
        var langs = {translatefr:1, translateen:1};
        mokr.mock(parse, 'sendPush', function(body){
            langs[body.data.alert]--;
        })
        return pn.withDisplayVersions(jsonPush).then(function(){
            assert.equal(Object.keys(langs).length, 2);
            assert(Object.keys(langs).every(x=>langs[x]===0), 'alert is now directly a string');
        })
    }));

    it('_patchPayload with existing $or', Mocker.mockIt(function(mokr){
        mokr.mock(config, 'endpoint', 'dum');
        var pn = new PushNotifier(config);
        var payload = {where:{$or:[{a:1},{b:1}]}};
        pn._patchPayload(payload);
        assert.equal(Object.keys(payload.where).length,1);
        var str = '[{"a":1,"$or":[{"deviceType":"android","appVersion":{"$gte":"4.1.8"}},{"deviceType":"ios","appVersion":{"$gte":"401001003"}}]},{"b":1,"$or":[{"deviceType":"android","appVersion":{"$gte":"4.1.8"}},{"deviceType":"ios","appVersion":{"$gte":"401001003"}}]}]';
        assert.equal(JSON.stringify(payload.where.$or), str);
    }));

    it('_patchPayload if no $or', Mocker.mockIt(function(mokr){
        mokr.mock(config, 'endpoint', 'dum');
        var pn = new PushNotifier(config);
        var payload = {where:{}};
        pn._patchPayload(payload);
        assert.equal(Object.keys(payload.where).length,1);
        var str = '[{"deviceType":"android","appVersion":{"$gte":"4.1.8"}},{"deviceType":"ios","appVersion":{"$gte":"401001003"}}]'
        assert.equal(JSON.stringify(payload.where.$or), str);
    }))

    it('withDisplayVersions without translation still sends a notif', Mocker.mockIt(function(mokr){
        mokr.mock(config, 'endpoint', 'dum');

        var pn = new PushNotifier(config);

        mokr.mock(pn.trad, 'getLanguages', ()=>[])
        var o = JSON.parse(JSON.stringify(jsonPush));
        o.data.data.displayKey = 'test';
        var called = false;
        mokr.mock(parse, 'sendPush', function(body){
            assert.equal(body.data.alert, 'test');
            called = true;
        })
        return pn.withDisplayVersions(o).then(function(){
            assert(called);
        })
    }));
});
