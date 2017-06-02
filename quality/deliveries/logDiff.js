#!/usr/bin/node


var fs = require('fs');
var path = require('path');

var optimist = require('optimist')
    .usage('$0: node app -o oldTag -n newTag')
    .options('o', {
        alias : 'old',
        type:'string',
        describe:'tag or ref'
    })
    .options('n', {
        alias : 'new',
        type:'string',
        describe:'tag or ref',
        default:'HEAD'
    })
    .demand('old','new');

var argv = optimist.argv;
if(argv.help){
    optimist.showHelp()
    process.exit(0);
}
var exec = require('child_process').exec;
var tok = '|@|';//separate author from msg
var cmd = 'git log --pretty=format:"%an'+tok+'%s" '+argv.old+'..'+argv.new;
function Line(x){
    this.author;
    this.tag;
    this.msg;
    var idx = x.indexOf(tok);

    var format=x.substring(0, idx);
    this.author = format.substring(format.indexOf('=')+1);
    var left = x.substring(idx+tok.length);
    var res = left.split(' ');
    var tag = res[0];
    if(tag.match(/\d/)){
        this.tag = tag.match(/\d+/)[0];
        res.shift();
    }else{
        this.tag = 'junk';
    }
    this.msg = res.slice(0).join(' ');
}
Line.prototype.isValid = function(){
    return !!this.tag;
}
Line.prototype.output = function(){
    return this.author+' - '+this.msg;
}
exec(cmd, function(err, out, stderr){
    if(err||stderr){return console.error(err, stderr);}

    var map = {};//hash -> msg
    out.split('\n').filter(function(x){
        return x.length>2;
    }).map(function(x){
        var line = new Line(x);
        map[line.tag] = map[line.tag] || [];
        map[line.tag].push(line);
    });
    Object.keys(map).map(function(key){
        var lines = map[key].map(function(line){return '\t'+line.output()}).join('\n');
        var str = '';
        str += key + '\n';
        str += lines;
        var idx = key=='junk'?0:parseInt(key,10);
        return {line:str, idx:idx}
    }).sort(function(a,b){
        return a.idx - b.idx;
    }).forEach(function(x){
        console.log(x.line+'\n');
    });
});