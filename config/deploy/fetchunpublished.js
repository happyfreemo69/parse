#!/usr/bin/node
/*
 https://github.com/npm/npm/issues/4191
 Summary: 
   - npm2 always install/update git url
   - npm3 never do so once the package is in local
 
 We don't want to always install/update if the specified version is present.
 If we don't specify the git url, and the package exists, npm will do nothing
 
 So we will manually fetch the repository ourselves if the specified version in package.json
 is not present in node_modules


*/
//./this.js happyFreemo69/nodelibs user/package
//Check in current project the package.json versions corresponding to those packages
//specified as nodelibs:1.6.5
//If those versions are present in the node_modules, then skip
//else fetch them via npm install happyFreemo69/nodelibs#1.6.5
var argv = process.argv.splice(2);
var exec = require('child_process').exec;
var fs = require('fs');

var BASE_PATH = __dirname.replace('config/deploy','');
function getPackageJson(cbk){
    //assumes I am in config/deploy
    var f = BASE_PATH+'package.json';
    return require(f);
}
function Package(x){
    var arr = x.split('/');
    this.name = arr[1];
    this.user = arr[0];
    this.version;
}
Package.prototype.privateUrl = function(){
    //in npm you dont have the v prefix we use
    return this.user+'/'+this.name+'#v'+this.version;
}

var json = getPackageJson();
var packages = argv.map(function(x){
    var p = new Package(x);
    p.version = json.dependencies[p.name] || json.devDependencies[p.name];
    if(!p.version){throw 'version not found in package.json for '+p.name}
    return p;
})


/**
 * check in node_modules if 
 * @param  {package} customPackage the package we want to be installed with specified version
 * @param  {str} modulesPath ... (with trailing slash)
 * @return {[type]}         [description]
 */
function checkModule(customPackage, modulesPath, cbk){
    return fs.exists(modulesPath+customPackage.name, function(yes){
        if(yes){
            try{
                var p = require(modulesPath+customPackage.name+'/package.json');
                if(p.version == customPackage.version){
                    return cbk(null,null);
                }
            }catch(e){
                return cbk(e);
            }
            return cbk('different');
        }
        return cbk('different');
    })
}
var p = Promise.resolve();
packages.forEach(function(pack){
    p = p.then(function(){
        return new Promise(function(resolve, reject){
            return checkModule(pack, BASE_PATH+'node_modules/', function(err){
                if(!err) {
                    console.log(pack.name+' is ok - '+pack.version);
                    return resolve();
                }
                console.log('installing ', pack.privateUrl())
                return exec('cd '+BASE_PATH+' && npm install '+pack.privateUrl(), function(err, stdout, stderr){
                    if(err||stderr){return reject(err)}
                    console.log(pack.name+' is ok - '+pack.version);
                    return resolve();
                });
            })
        });
    })
})
p.catch(function(e){
    console.log('e :' , e);
});