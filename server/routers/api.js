const router = require('express').Router();
const connect = require('../connect')();
const path = require('path');
const {promises: fs, createReadStream} = require('fs');
const {getHash} = require('../utils');
const {music} = require(path.resolve(__dirname, '../env.json'));

const musicPath = path.resolve(__dirname, '..', music);

router.get('/items', (req, res, next) => {
    let db, collection;
    connect.then(data => {
        db = data.db;
        collection = data.collection;
        return collection.find({deleted: {$ne: true}}).sort({weight: -1}).toArray();
    }).then(files => {
        res.json(files.map(it => ({id: it['_id'], name: it.name, meta: it.meta})));
    }).catch(e => next(e));
});

router.get('/download/:id', (req, res, next) => {
    if (req.params.id) {
        let db, collection;
        connect.then(data => {
            db = data.db;
            collection = data.collection;
            return collection.findOne({'_id': req.params.id});
        }).then(item => {
            if (item) {
                let filePath = path.join(musicPath, req.params.id + '.mp3');
                fs.stat(filePath)
                    .then(stat => new Promise((r, rj) => {
                        res.download(filePath, item.name + '.mp3', err => {
                            if (err) rj(err);
                            else r();
                        });
                    }))
                    .then(() => updateWeight(req.params.id, .1))
                    .catch(e => {
                        collection.updateOne({_id: req.params.id}, {$set: {deleted: true}})
                            .finally(() => next(new Error('File not found')));
                    });
            } else {
                next(new Error('File not found'));
            }
        }).catch(e => next(e));
    }
});

router.get('/play/:id', (req, res, next) => {
    if (req.params.id) {
        let db, collection;
        connect.then(data => {
            db = data.db;
            collection = data.collection;
            return collection.findOne({'_id': req.params.id});
        }).then(item => {
            if (item) {
                let filePath = path.join(musicPath, req.params.id + '.mp3');
                fs.stat(filePath)
                    .then(stat => {
                        res.set({
                            'Content-Type': 'audio/mpeg3',
                            'Content-Length': stat.size,
                            'Accept-Ranges': 'bytes'
                        });
                        let fileStream = createReadStream(filePath);

                        fileStream.pipe(res);
                    }).catch(e => {
                        collection.updateOne({_id: req.params.id}, {$set: {deleted: true}})
                            .finally(() => next(new Error('File not found')));
                    });

            } else {
                next(new Error('File not found'));
            }
        }).catch(e => next(e));
    } else next(Error('Bad params'));
});

router.put('/upload', (req, res, next) => {
    let files = [];
    if (req.files && Object.keys(req.files).length) {
        files = Object.values(req.files).filter(f => f.size && f.mimetype == 'audio/mp3');
        if (files.length) {
            let db, collection;
            connect.then(async data => {
                db = data.db;
                collection = data.collection;

                let weightAdding = 0;
                let cursor = collection.find().sort({weight: -1}).limit(1);
                let cnt = await cursor.count();
                if (cnt) {
                    let item = await cursor.next();
                    weightAdding = item.weight + 1;
                }
                return weightAdding;
            }).then(weightAdding => {
                return Promise.all(files.map(async (f, index) => {
                    let name = f.name.replace('.mp3', '')
                    const hash = getHash(name, f.size)

                    let old = await collection.findOne({_id: hash});
                    if (!old) {
                        let weight = weightAdding + index, isFile = false, filePath = path.join(musicPath, hash + '.mp3');
                        try {
                            let file = await fs.stat(filePath);
                            if (file.isFile()) isFile = true;
                        } catch (e) {
                            console.warn(e);
                        }
                        if (!isFile) {
                            try {
                                let tmp = [];
                                if (name.includes(' - ')) tmp = name.split(' - ', 2).map(it => it.trim());
                                else if (name.includes('_-_')) tmp = name.split('_-_', 2).map(it => it.trim());

                                let meta = {artist: null, title: null, size: f.size};
                                if (tmp.length > 1) {
                                    meta.artist = tmp[0];
                                    meta.title = tmp[1];
                                }
                                await collection.updateOne({_id: hash}, {$set: {name, meta, weight}}, {upsert: true});
                                return new Promise((r, rj) => {
                                    f.mv(filePath, err => {
                                        if (err) rj(err);
                                        else r(name)
                                    });
                                })
                            } catch (e) {
                                console.warn(e);
                            }
                        }
                    }
                    return null;
                }))
            }).then(files => {
                if (files.filter(f => f).length) res.sendStatus(200);
                else next(new Error('Duplicate files'));
            }).catch(e => {
                next(e);
            })
        }
    } else next(new Error('Bad params'));
});

async function updateWeight(id, weight) {
    if (id && weight) {
        return connect.then(data => {
            let collection = data.collection;
            return collection.findOne({'_id': id})
                .then(item => {
                    return collection.find({weight: {$gt: item.weight}}).sort({weight: 1}).toArray()
                        .then(items => {
                            if (items.length) {
                                let newWeight = item.weight + weight;

                                if (newWeight < items[0].weight) return collection.updateOne({'_id': id}, {$set: {weight: newWeight}}).then(() => newWeight);

                                let index = items.findIndex(it => it.weight > newWeight);
                                let updateArr = [];
                                if (index == -1) index = items.length - 1;
                                newWeight = items[index].weight;
                                updateArr.push([{'_id': id}, {$set: {weight: newWeight}}]);
                                let tmpWeight = Math.floor(item.weight);
                                for (let i = 0; i <= index; i++) {
                                    let adding = items[i].weight - Math.floor(items[i].weight);
                                    updateArr.push([{'_id': items[i]['_id']}, {$set: {weight: tmpWeight + adding}}]);
                                    tmpWeight++;
                                }
                                return Promise.all(updateArr.map(it => collection.updateOne(it[0], it[1]))).then(() => newWeight);
                            }
                        });
                })
        });
    }
}

router.post('/update-weight/:id', (req, res, next) => {
    updateWeight(req.params.id, +req.body.weight).then(r => {
        res.send('' + r);
    }).catch(e => {
        next(e);
    });
});

module.exports = router;
