const fs = require('fs').promises;
const path = require('path');
const connect = require('./connect')();
const {music} = require(path.resolve(__dirname, './env.json'));

const musicPath = path.resolve(__dirname, music);

let db, collection
connect.then(data => {
    db = data.db;
    collection = data.collection;
    return collection.find({weight: {$gt: 76}}).toArray();
})
    .then(async files => {
        return Promise.all(
            files.map(async f => {
                let filePath = path.join(musicPath, f._id + '.mp3');
                try {
                    await fs.stat(filePath);
                    await fs.unlink(filePath);
                    await collection.deleteOne({_id: f._id});
                } catch (e) {
                    console.log(e);
                }
                return f._id;
            })
        );
    })
    .catch(err => {
        console.error(err);
        process.exit()
    }).then(files => {
    console.log(files);
}).finally(() => process.exit());
