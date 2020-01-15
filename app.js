var express = require('express');
var config = require('./config');
var ParseServer = require('parse-server').ParseServer;
var reqLogger = require('nodelibs/')['Mdw/reqLogger'];
var AppStarter = require('./lib/appStarter');
var app = express();
var bodyParser = require('body-parser');
app.config = config;
var appStarter = AppStarter(app, config);
var PushNotifier = require('./lib/pushNotifier');
var context = require('nodelibs').context;
var path = require('path')

var domainMdw = require('express-domain-middleware');
var ctxMgr = require('nodelibs')['Mdw/contextManager']({logger:config.logger});
var V = require('nodelibs').validator;
var errorHandler = require('nodelibs').errorHandler;
app.use(domainMdw);
app.use(ctxMgr);
app.use(function(req, res, next){
    context.set('x-forwarded-for',req.headers['x-forwarded-for']);
    context.set('pfx',req.headers.pfx);
    context.set('tid',req.headers.tid);
    context.set('sid',req.headers.sid);

    context.set('x-parse-master-key',req.headers['x-parse-master-key']);
    context.set('x-parse-application-id',req.headers['x-parse-application-id']);
    return next();
});
app.use(reqLogger(config));

var pn = new PushNotifier({
  endpoint:config.push_endpoint,
  trad_fname:config.trad_fname, 
  notif_withDisplay_android:config.notif_withDisplay_android, 
  notif_withDisplay_ios:config.notif_withDisplay_ios
});

var installationActivity = new (require('./activity/installationActivity'))(config.install_endpoint);
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
    ios: {
        token : {
            key: path.resolve(config.serviceRoot + config['rel_parse_ios_p8']),
            keyId: 'WSK7K88QTW',
            teamId: '7A8MA56NRQ'
        },
        topic: config['parse_ios_bundleId'],
        production: true
    }
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

app.use('/synty/push', bodyParser.text());
app.use('/synty/push', toJsonBody);

app.use(pn.endpoint, bodyParser.text());//be identical to public
app.use(pn.endpoint, toJsonBody);

app.post('/synty/push', function(req, res, next){
  config.logger.dbg('incoming synty ', req.body);
  return V.validate({
      where: V.sub({
        $or:V.arr(V.sub(),1).req()
      }).req(),
  }, req.body).catch(e=>{
    return errorHandler.invalidParameters(e)
  }).then(_=>{
    return pn.sendNotifications(req.body).then(function(innerPushStatuses){
      var s = JSON.stringify([].concat(innerPushStatuses));
      return res.end(s);
    })
  }).catch(e=>{
    if(e.id==4){
      return res.status(e.statusCode).send(e);
    }
    config.logger.inf('failed to send ', e);
    return res.end('e:'+e);
  })
})

app.delete('/synty/users/:userId', function(req,res,next){
  config.logger.dbg('incoming synty ', req.body);
  var userId = req.params.userId;
  if(!req.params.userId){
    return next('missing userId'+userId)
  }
  return installationActivity.remove(userId).then(function(ok){
    return res.end(ok);
  }).catch(e=>{
    config.logger.inf('failed to send ', e);
    return res.end('e:'+e);
  })
})
/* this route is not meant to be known */
app.post(pn.endpoint, function(req,res,next){
  req.url = '/push';
  config.logger.dbg('sent '+JSON.stringify(req.body));
  return app['server'](req,res,next);
});
/* this route is not meant to be known */
app.get(installationActivity.endpoint, function(req,res,next){
  req.url = '/installations';
  config.logger.dbg('sent '+JSON.stringify(req.body));
  return app['server'](req,res,next);
});
app.delete(installationActivity.endpoint+'/:installId', function(req,res,next){
  req.url = '/installations/'+req.params.installId;
  config.logger.dbg('sent '+req.params.installId);
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