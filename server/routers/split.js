const fs = require('fs/promises');
const {createReadStream} = require('fs');
const path = require('path');
const router = require('express').Router();
const connect = require('../connect')();

const {music} = require(path.resolve(__dirname, '../env.json'));

const musicPath = path.resolve(__dirname, '..', music);

router.get('/get/:id/:part', (req, res, next) => {
    let {id, part} = req.params;
    part = parseInt(part);
    if (isNaN(part)) part = null;

    if (id && part != null) {
        let db, collection;
        connect.then(data => {
            db = data.db;
            collection = data.collection;
            return collection.findOne({'_id': id});
        }).then(item => {
            if (item) {
                let filePath = path.join(musicPath, id + '.mp3');
                fs.stat(filePath)
                    .then(stat => {
                        const chunkSize = stat.size > 64 ? stat.size >>> 6 : 1;
                        const start = chunkSize * part;

                        if (start >= stat.size) throw Error('Chunk out of range');

                        let end = start + chunkSize - 1;
                        if (end > stat.size) end = stat.size;

                        createReadStream(filePath, {start, end}).pipe(res);
                    })
                    .catch(e => {
                        next(e);
                    });
            } else {
                next(new Error('File not found'));
            }
        }).catch(e => next(e));
    } else next(Error('Bad params'));
});

module.exports = router;
