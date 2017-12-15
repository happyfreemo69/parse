var bulker = require('nodelibs').bulker;
var parse = require('../externalCalls/parse');
var config = require('../config');

function InstallationActivity(endpoint){
    this.endpoint = endpoint;
}
InstallationActivity.prototype.remove = function(userId){
    return parse.getInstallations({where:{userId:userId}}, this.endpoint).then(installs=>{
        if(!installs.results.length){
            config.logger.inf('no installs to be processed', userId);
            return Promise.resolve('OK - '+installs.results.length);
        }
        return bulker.bulkIt(installs.results, 1, install=>{
            config.logger.inf('got', install.objectId)
            return parse.removeInstallation({_id: install.objectId}, this.endpoint).catch(e=>{
                config.logger.inf('failed for ', e);
            })
        }).then(_=>{
            return Promise.resolve('OK - '+installs.results.length);
        })
    })
}

module.exports = InstallationActivity