var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var reqLogger = require('nodelibs/')['Mdw/reqLogger'];
var app = express();
var config = require('./config');
var api = new ParseServer({
  databaseURI: config.mongoUrl,
  appId: config.appId,
  masterKey: config.masterKey, // Keep this key secret!
  serverURL: 'http://localhost:1337/parse' // Don't forget to change to https if needed
});
app.use(reqLogger(config));
app.get('/ping', function(req,res){
    return res.status(200).end();
})
// Serve the Parse API on the /parse URL prefix
app.use('/parse', api);


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