var config = require('../../config'); 
var app = require('../../app');
var requester = require('supertest')(app);
var utils = require('../utils');
var assert = require('assert');
var Mocker = require('nodelibs').Mocker;
var jsonPush = require('../../samples/push.json');
var trad = require('trad-cli');
var parse = require('../../externalCalls/parse');
describe('e2e push', function(){
    before(utils.waitUntilAppReady.bind(null, app));

    it('translates for every languages', Mocker.mockIt(function(mokr){
        var displayCalled = false;
        var sendPushCalled = false;

        mokr.mock(trad, 'getLanguages', ()=>{
            return ['fr','en'];
        });
        var inst = null;
        var expects = {'fr':1, 'en':1}

        mokr.mock(app.pn.trad, 'getLanguages', ()=>['fr','en'])
        mokr.mock(app.pn.trad, 'translate', function(key, lang, displayData){
            assert.equal(key, 'NEW_USER');
            expects[lang]--;
            assert.equal(displayData.username, 'bob');
            return lang;
        })
        mokr.mock(parse, 'sendPush', (body, endpoint)=>{
            sendPushCalled = true;
            assert(body != inst);
            inst = body;
            return Promise.resolve();
        });
        var tmp = JSON.parse(JSON.stringify(jsonPush));
        tmp.data.data.displayKey = 'NEW_USER';
        tmp.data.data.displayData = {username:'bob'};
        return requester
            .post('/synty/push')
            .send(JSON.stringify(tmp))
            .set({'Content-Type':'text/plain'})
            .expect(200)
        .then(function(res){
            assert(!displayCalled, 'display should not be called');
            assert(sendPushCalled);
            assert(Object.keys(expects).length, 0);
        })
    }));

    it('rejects if no matching criteria', Mocker.mockIt(function(mokr){
        var tmp = JSON.parse(JSON.stringify(jsonPush));
        delete tmp.where;
        tmp.data.data.displayKey = 'NEW_USER';
        tmp.data.data.displayData = {username:'bob'};
        return requester
            .post('/synty/push')
            .send(JSON.stringify(tmp))
            .set({'Content-Type':'text/plain'})
            .expect(400)
        .then(function(res){
            assert.equal(res.body.error, 'INVALID_PARAMETERS');
        })
    }));

    it('rejects if empty criteria', Mocker.mockIt(function(mokr){
        var tmp = JSON.parse(JSON.stringify(jsonPush));
        tmp.where.$or = [];
        return requester
            .post('/synty/push')
            .send(JSON.stringify(tmp))
            .set({'Content-Type':'text/plain'})
            .expect(400)
        .then(function(res){
            assert.equal(res.body.error, 'INVALID_PARAMETERS');
        })
    }));
});
