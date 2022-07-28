const fs = require('fs').promises;
const path = require('path');
const connect = require('./connect')();
const {music} = require(path.resolve(__dirname, './env.json'));
const NodeID3 = require('node-id3');
const iconv = require('iconv-lite');

const musicPath = path.resolve(__dirname, music);

let db, collection
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

                        if (old) {
                            let meta = old.meta;
                            let tags = await new Promise((r, rj) => {
                                NodeID3.read(path.join(musicPath, f.name), (err, tags) => {
                                    if (err) rj(err);
                                    else r(tags);
                                });
                            });
                            if (tags && tags.title && tags.artist) {
                                meta.artist = tags.artist;
                                meta.title = tags.title;
                                meta.album = tags.album;
                                meta.genre = tags.genre;
                                meta.year = tags.year;
                                Object.keys(meta).forEach(key => {
                                    if (typeof meta[key] == 'string' && /\W/.test(meta[key][0])) meta[key] = iconv.decode(meta[key], 'win1251');
                                })
                                await collection.updateOne({_id: hash}, {$set: {meta}});
                            }
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
