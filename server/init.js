const fs = require('fs').promises;
const path = require('path');
const md5 = require('md5');
const connect = require('./connect')();
const {getHash} = require('./utils');
const {music, init} = require(path.resolve(__dirname, './env.json'));
const NodeID3 = require('node-id3');
const iconv = require('iconv-lite');

const initPath = path.resolve(__dirname, init),
    musicPath = path.resolve(__dirname, music);

let db, collection
connect.then(async data => {
    db = data.db;
    collection = data.collection;
    await collection.createIndex({weight: -1});
    await collection.createIndex({deleted: 1});
    return fs.readdir(initPath, {withFileTypes: true});
})
    .then(async files => {
        let weightAdding = 0;
        let cursor = collection.find().sort({weight: -1}).limit(1);
        let cnt = await cursor.count();
        if (cnt) {
            let item = await cursor.next();
            weightAdding = item.weight;
        }
        return Promise.all(
            files.map(async (f, index) => {
                if (f.isFile() && f.name.search(/\.mp3$/) != -1) {
                    try {
                        let filePath = path.join(initPath, f.name);
                        let stat = await fs.stat(filePath);

                        let name = f.name.replace('.mp3', '');
                        let tmp = [];
                        let hash;
                        if (name.length == 32 && /[a-z0-9]{32}/.test(name)) hash = name;
                        else {
                            if (name.includes(' - ')) tmp = name.split(' - ', 2).map(it => it.trim());
                            else if (name.includes('_-_')) tmp = name.split('_-_', 2).map(it => it.trim());
                            hash = getHash(name, stat.size)
                        }

                        let old = await collection.findOne({_id: hash});
                        let weight, isFile = false;

                        if (old) {
                            weight = old.weight;
                            try {
                                let file = await fs.stat(path.join(musicPath, hash + '.mp3'));
                                if (file.isFile()) isFile = true;
                            } catch (e) {
                                console.warn(e);
                            }
                        } else {
                            weight = weightAdding + index;
                        }

                        if (!isFile) await fs.copyFile(filePath, path.join(musicPath, hash + '.mp3'));

                        try {
                            let meta = {artist: null, title: null, size: stat.size};
                            let tags = await new Promise((r, rj) => {
                                NodeID3.read(filePath, (err, tags) => {
                                    if (err) rj(err);
                                    else r(tags);
                                })
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
                            } else if (tmp.length > 1) {
                                meta.artist = tmp[0];
                                meta.title = tmp[1];
                            }
                            await collection.updateOne({_id: hash}, {$set: {name, meta, weight}}, {upsert: true});
                        } catch (e) {
                            console.warn(e);
                            fs.unlink(path.join(musicPath, hash + '.mp3'));
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
