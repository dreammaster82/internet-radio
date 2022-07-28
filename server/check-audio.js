const fs = require('fs').promises;
const path = require('path');
const connect = require('./connect')();
const {music} = require(path.resolve(__dirname, './env.json'));
const NodeID3 = require('node-id3');
const iconv = require('iconv-lite');

const musicPath = path.resolve(__dirname, music);

let db, collection;
connect.then(data => {
    db = data.db;
    collection = data.collection;
    return fs.readdir(musicPath, {withFileTypes: true});
})
    .then(async files => {
        return Promise.all(
            files.map(async (f, index) => {
                if (f.isFile() && f.name.search(/\.mp3$/) != -1) {
                    try {
                        let hash = f.name.replace('.mp3', '');
                        let old = await collection.findOne({_id: hash});

                        if (!old) {
                            console.log(hash);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                    return f.name;
                }
            })
        );
    })
    .catch(err => {
        console.error(err);
        process.exit()
    }).then(files => {
    console.log(files);
}).finally(() => process.exit());
