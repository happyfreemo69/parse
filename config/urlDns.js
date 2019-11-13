/*
Purpose of this file
It overrides config
 */
exports = module.exports;
var config = require('./');
var Network = require('nodelibs').Network;
var network = new Network(config.phase);

exports.lgs_pri_port = network.lgs().pri().port();
exports.lgs_pri_host = network.lgs().pri().host();
exports.lgs_pri_protocol = network.lgs().pri().protocol();

exports.admserv_pub_url = network.admserv().pub().url();
