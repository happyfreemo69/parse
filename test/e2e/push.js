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
describe('e2e push', function(){
    before(utils.waitUntilAppReady.bind(null, app));

    it('is synty backward compatible', Mocker.mockIt(function(mokr){
        var fwding = false;
        var oldCalled = false;
        var displayCalled = false;
        mokr.mock(app, 'server_dev', function(req,res,next){
            fwding = true;
            return res.end();
        })
        mokr.mock(trad, 'getLanguages', ()=>{
            return ['fr'];
        })
        mokr.mock(trad, 'translate', ()=>{
            return 'ok';
        })
        mokr.mock(PushNotifier.prototype, 'oldVersions', ()=>{
            oldCalled = true;
            return Promise.resolve();
        })
        mokr.mock(PushNotifier.prototype, 'withDisplayVersions', ()=>{
            displayCalled = true;
            return Promise.resolve();
        })
        return requester
            .post('/dev/push')
            .send(JSON.stringify(jsonPush))
            .set({'Content-Type':'text/plain'})
            .expect(200)
        .then(function(res){
            assert(!fwding, 'no need for forwarding');
            assert(oldCalled, 'old mobiles should be called');
            assert(!displayCalled, 'display should not be called');
        })
    }));

    it('translates for every languages', Mocker.mockIt(function(mokr){
        var oldCalled = false;
        var displayCalled = false;
        var sendPushCalled = false;
        mokr.mock(trad, 'getLanguages', ()=>{
            return ['fr','en'];
        });
        var inst = null;
        var expects = {'fr':1, 'en':1}
        mokr.mock(trad, 'translate', (key, lang, data)=>{
            assert.equal(key, 'max');
            expects[lang]--;
            assert.equal(data.displayKey, 'max');
            return lang;
        })
        mokr.mock(PushNotifier.prototype, 'oldVersions', ()=>{
            oldCalled = true;
            return Promise.resolve();
        })
        mokr.mock(parse, 'sendPush', (body, endpoint)=>{
            sendPushCalled = true;
            assert(body != inst);
            inst = body;
        });
        var tmp = JSON.parse(JSON.stringify(jsonPush));
        tmp.data.data.displayKey = 'max';
        return requester
            .post('/dev/push')
            .send(JSON.stringify(tmp))
            .set({'Content-Type':'text/plain'})
            .expect(200)
        .then(function(res){
            assert(oldCalled, 'old mobiles should be called');
            assert(!displayCalled, 'display should not be called');
            assert(sendPushCalled);
            assert(Object.keys(expects).length, 0);
        })
    }));
});