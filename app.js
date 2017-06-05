var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var reqLogger = require('nodelibs/')['Mdw/reqLogger'];
var AppStarter = require('./lib/appStarter');
var app = express();
var bodyParser = require('body-parser');
var config = require('./config');
app.config = config;
var appStarter = AppStarter(app, config);
var PushNotifier = require('./lib/pushNotifier');

app.use(reqLogger(config));
config.phases.forEach(function(x){
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
  var pn = new PushNotifier({
    endpoint:config.push_endpoint.replace('%',x),
    trad_fname:config.trad_fname.replace('{{phase}}',x), 
    notif_withDisplay_android:config.notif_withDisplay_android, 
    notif_withDisplay_ios:config.notif_withDisplay_ios
  });
  app['pn_'+x] = pn;
  app['server_'+x] = new ParseServer(u);
  app.get('/'+x+'/_tradreloads', function(req,res,next){
    return res.end(pn.version());
  });
  app.use('/'+x+'/push', bodyParser.text()); //do not apply for everything otherwise breaks the dashboard
  app.use('/'+x+'/push', function(req, res, next){
    try{
      req.body = JSON.parse(req.body);
    }catch(e){
      return next(e);
    }
    return next();
  });
  app.use(pn.endpoint, bodyParser.text());
  app.use(pn.endpoint, function(req,res,next){
    req.body = JSON.parse(req.body);
    return next();
  });
  
  app.post('/'+x+'/push', function(req, res, next){
    return pn.sendNotifications(req.body).then(function(){
      res.end();
    }).catch(e=>{
      config.logger.inf('failed to send ', e);
      res.end('e:'+e);
    })
  })
  /* this route is not meant to be known */
  app.post(pn.endpoint, function(req,res,next){
    req.url = '/push';
    return app['server_'+x](req,res,next);
  });
  app.get('/'+x+'/ping', (req,res)=>res.status(200).end());
  app.use('/'+x, app['server_'+x]);
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