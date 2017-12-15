var config = require('../../config'); 
var app = require('../../app');
var requester = require('supertest')(app);
var utils = require('../utils');
var assert = require('assert');
var Mocker = require('nodelibs').Mocker;
var parse = require('../../externalCalls/parse');
var InstallationActivity = require('../../activity/installationActivity');
var jsonPush = require('../../samples/push.json');
describe('activity installationACtivity', function(){
    before(utils.waitUntilAppReady.bind(null, app));

    it('does not ask deletion if no installs', Mocker.mockIt(function(mokr){
        var ia = new InstallationActivity('a');
        var called = false;
        mokr.mock(parse, 'removeInstallation', function(){
            throw 'should not be called';
        })
        mokr.mock(parse, 'getInstallations', (o,endpoint)=>{
            assert.equal(endpoint, 'a');
            assert.equal(JSON.stringify(o), '{"where":{"userId":"abebbbce"}}');
            called = true;
            return Promise.resolve({results:[]})
        })
        return ia.remove('abebbbce').then(function(){
            assert.equal(called, true);
        })
    }));

    it('deletes install if to be deleted', Mocker.mockIt(function(mokr){
        var ia = new InstallationActivity('a');
        var called = false;
        var expects = ['abebbbce', 'abebbbcf'];
        mokr.mock(parse, 'removeInstallation', (o, endpoint)=>{
            assert.equal(expects.shift(), o._id)
            assert.equal(endpoint, 'a');
            called = true;
            return Promise.resolve();
        })
        mokr.mock(parse, 'getInstallations', (o,endpoint)=>{
            return Promise.resolve({results:[{objectId:'abebbbce'}, {objectId:'abebbbcf'}]})
        })
        return ia.remove('abebbbce').then(function(){
            assert.equal(expects.length, 0);
            assert.equal(called, true);
        })
    }));
});
