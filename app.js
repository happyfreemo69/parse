var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var reqLogger = require('nodelibs/')['Mdw/reqLogger'];
var app = express();
var bodyParser = require('body-parser');
var config = require('./config');


app.use('/:type(dev|uat|prd)/push', bodyParser.text()); //do not apply for everything otherwise breaks the dashboard
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
  app.use('/'+x, api);
})


if(config.https){
    var fs = require('fs');
    var privateKey = fs.readFileSync(__dirname+'/config/server.key');
    var certificate = fs.readFileSync(__dirname+'/config/server.crt');

    var credentials = {key: privateKey, cert: certificate};
    var httpsServer = require('https').createServer(credentials, app);
    httpsServer.listen(config.httpsPort, function(){
        console.info('https on '+config.httpsPort);
    });
}
app.listen(config.httpPort, function() {
  console.info('http on '+config.httpPort);
});