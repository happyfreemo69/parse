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
describe('lib pushNotifier', function(){
    before(utils.waitUntilAppReady.bind(null, app));

    it('starts', Mocker.mockIt(function(mokr){
        mokr.mock(config, 'endpoint', 'dum');
        var pn = new PushNotifier(config);
        return pn.trad.reload().then(x=>{
            assert(pn.trad.hasKey('NOTIF_NEW_NOTE_CAMPUS', 'fr'));
            assert(pn.trad.hasKey('LYYTI_STATE_ANSWERED', 'fr'));
            assert(pn.trad.hasKey('LYYTI_STATE_CLOSED', 'fr'));
            assert(pn.trad.hasKey('LYYTI_STATE_ONGOING', 'fr'));
            assert(pn.trad.hasKey('LYYTI_STATE_OPENED', 'fr'));
            assert(pn.trad.hasKey('LYYTI_STATE_READ', 'fr'));
            assert(pn.trad.hasKey('LYYTI_STATE_RESOLVED', 'fr'));
            assert(pn.trad.hasKey('LYYTI_STATE_STANDBY', 'fr'));
            assert(pn.trad.hasKey('NOTIF_LYYTI_FOLLOWED_COMMENT', 'fr'));
            assert(pn.trad.hasKey('NOTIF_LYYTI_STATUS_CHANGED', 'fr'));
            assert(pn.trad.hasKey('NOTIF_MGR_ANSWER', 'fr'));
            assert(pn.trad.hasKey('NOTIF_MGR_ANSWER_PRIVATE_LYYTI', 'fr'));
            assert(pn.trad.hasKey('NOTIF_MODERATED_LYYTI', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_COMMENT', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_DOCUMENT_BUILDING', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_DOCUMENT_CAMPUS', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_DOCUMENT_CITY', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_DOCUMENT_FLAT', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_FLAT_ISSUE', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_ISSUE_BUILDING', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_MESSAGE', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_MESSAGE_ON_LYYTI', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_NOTE_BUILDING', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_NOTE_CAMPUS', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_NOTE_CITY', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_NOTE_FLAT', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_OFFER_BUILDING', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_TOPIC_BUILDING', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_USER_BUILDING', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_VOTE_CITY', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_WORK_BUILDING', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_WORK_CAMPUS', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_WORK_CITY', 'fr'));
            assert(pn.trad.hasKey('NOTIF_NEW_WORK_FLAT', 'fr'));
        })
    }));

    it('replaces states', Mocker.mockIt(function(mokr){
        mokr.mock(config, 'endpoint', 'dum');
        var pn = new PushNotifier(config);
        return pn.trad.reload().then(_=>{
            var x = pn.trad.translate('NOTIF_LYYTI_STATUS_CHANGED', 'fr', {"title":"test asset","state":"OPENED"});
            assert.equal(x, 'Le statut de test asset est passé à Ouvert');
        })
    }));

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
        var str = '[{"a":1,"$or":[{"deviceType":"android","appVersion":{"$gte":"4.1.8"}},{"deviceType":"ios","appVersion":{"$gte":"402000002"}}]},{"b":1,"$or":[{"deviceType":"android","appVersion":{"$gte":"4.1.8"}},{"deviceType":"ios","appVersion":{"$gte":"402000002"}}]}]';
        assert.equal(JSON.stringify(payload.where.$or), str);
    }));

    it('_patchPayload if no $or', Mocker.mockIt(function(mokr){
        mokr.mock(config, 'endpoint', 'dum');
        var pn = new PushNotifier(config);
        var payload = {where:{}};
        pn._patchPayload(payload);
        assert.equal(Object.keys(payload.where).length,1);
        var str = '[{"deviceType":"android","appVersion":{"$gte":"4.1.8"}},{"deviceType":"ios","appVersion":{"$gte":"402000002"}}]'
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
            assert.equal(body.data.data.lang, 'en');
            assert.equal(body.data.alert, 'test');
            called = true;
        })
        return pn.withDisplayVersions(o).then(function(){
            assert(called);
        })
    }));

    it('patches lang en', Mocker.mockIt(function(mokr){
        mokr.mock(config, 'endpoint', 'dum');
        var pn = new PushNotifier(config);
        var payload = {where:{}};
        pn._setLang(payload, 'en');
        assert.equal(Object.keys(payload.where).length,1);
        assert.equal(payload.where.localeIdentifier.$regex, '^(?!fr|de)')
    }));

    it('patches lang fr', Mocker.mockIt(function(mokr){
        mokr.mock(config, 'endpoint', 'dum');
        var pn = new PushNotifier(config);
        var payload = {where:{}};
        pn._setLang(payload, 'fr');
        assert.equal(Object.keys(payload.where).length,1);
        assert.equal(payload.where.localeIdentifier.$regex, '^fr')
    }));
});
