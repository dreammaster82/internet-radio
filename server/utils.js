const md5 = require('md5');

exports.getHash = function (name, size) {
    return md5(name + size);
};