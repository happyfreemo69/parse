var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var reqLogger = require('nodelibs/')['Mdw/reqLogger'];
var AppStarter = require('./lib/appStarter');
var app = express();
var bodyParser = require('body-parser');
var config = require('./config');
app.config = config;
var appStarter = AppStarter(app, config);

app.use('/:type(dev|uat|prd)/push', bodyParser.text()); //do not apply for everything otherwise breaks the dashboard
app.use('/:type(dev|uat|prd)/push', function(req, res, next){
  try{
    req.body = JSON.parse(req.body);
  }catch(e){
    return next(e);
  }
  return next();
});
app.use(reqLogger(config));
['dev', 'uat', 'prd'].forEach(function(x){
  var u = {
    databaseURI:  config[x+'_mongoUrl'],
    appId:        config[x+'_appId'],
    masterKey:    config[x+'_masterKey'], // Keep this key secret!
    serverURL:    'http://localhost:1337/'+x, // Don't forget to change to https if needed
    push: {
      android: {
        senderId: config[x+'_android_senderId'],
        apiKey: config[x+'_android_javascriptKey']
      },
      ios: ['dev','prd'].reduce(function(acc, env){
        if(config[x+'_ios_'+env+'_pfx']){
          acc.push({
            pfx: config[x+'_ios_'+env+'_pfx'],
            bundleId: config[x+'_ios_bundleId'],
            production: env=='prd'
          })
        }
        return acc;
      },[])
    }
  }

  var api = new ParseServer(u);
  app.get('/'+x+'/ping', function(req,res){
      return res.status(200).end();
  })
  app.use('/'+x, function(req,res,next){
    //take care of lang, version
    return api(req,res,next)
  });
})

if(!module.parent){
    appStarter.start();
    var onDeath = function(signal, e){
        console.log('crashed ('+signal+'):',new Date());
        if(e){
            console.log('e : ', e, e && e.stack);
        }
        return process.exit(1);
    }
    process.on('uncaughtException', function(err) {
        console.log('process.on handler');
        console.log(new Date, err);
    });
    process.on('exit', onDeath.bind(null, 'exit'));
    require('death')({debug: true, uncaughtException: true})(onDeath);
}else{
  module.exports = app;
}