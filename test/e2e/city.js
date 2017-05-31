var config = require('../../config'); 
var app = require('../../app');
var requester = require('supertest')(app);
var utils = require('../utils');
var assert = require('assert');
var Mocker = require('nodelibs').Mocker;
var jsonPush = require('../../samples/push.json');
describe('e2e push', function(){
    before(utils.waitUntilAppReady.bind(null, app));

    it('send as many notifs as needed', Mocker.mockIt(function(mokr){
        var called = false;
        mokr.mock(app, 'server_dev', function(req,res,next){
            called = true;
            //backward compatibility
            assert(JSON.stringify(req.body).includes('592581ed754a1b0d120518a7'));
            return res.end();
        })
        return requester
            .post('/dev/push')
            .send(JSON.stringify(jsonPush))
            .set({'Content-Type':'text/plain'})
            .expect(200)
        .then(function(res){
            //api should get 4 payloads
            //one for the old mobiles
            //three for the new ones (each per language (fr, en, de)
        })
    }));
});
