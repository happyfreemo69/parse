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
var pn = new PushNotifier({
  endpoint:config.push_endpoint,
  trad_fname:config.trad_fname, 
  notif_withDisplay_android:config.notif_withDisplay_android, 
  notif_withDisplay_ios:config.notif_withDisplay_ios
});
app['pn'] = pn;
app['server'] = new ParseServer({
  databaseURI:  config['parse_mongoUrl'],
  appId:        config['parse_appId'],
  masterKey:    config['parse_masterKey'], // Keep this key secret!
  serverURL:    'http://localhost:1337/parse', // Don't forget to change to https if needed
  push: {
    android: {
      senderId: config['parse_android_senderId'],
      apiKey: config['parse_android_javascriptKey']
    },
    ios: ['dev','prd'].reduce(function(acc, env){
      if(config['parse_ios_'+env+'_pfx']){
        acc.push({
          pfx: config['parse_ios_'+env+'_pfx'],
          bundleId: config['parse_ios_bundleId'],
          production: env=='prd'
        })
      }
      return acc;
    },[])
  }
});
var toJsonBody = function(req, res, next){
  try{
    req.body = JSON.parse(req.body);
  }catch(e){
    return next(e);
  }
  return next();
}
app.use('/parse/push', bodyParser.text()); //do not apply for everything otherwise breaks the dashboard
app.use('/parse/push', toJsonBody);
app.use(pn.endpoint, bodyParser.text());//be identical to public
app.use(pn.endpoint, toJsonBody);

app.post('/parse/push', function(req, res, next){
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
  return app['server'](req,res,next);
});
app.get('/parse/ping', (req,res)=>res.status(200).end());//differentiate from dashboard
app.use('/parse', app['server']);

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