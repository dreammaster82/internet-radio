const MongoClient = require('mongodb').MongoClient;
const {mongoUrl} = require('./env.json');

if (!mongoUrl) throw new Error('Need mongodb url');

let db, collection;
async function mongoConnect(config) {
    return new Promise((r, rj) => {
        if (config) {
            MongoClient.connect(config, {useNewUrlParser: true}, (err, client) => {
                if (!err) r(client);
                else rj(err);
            });
        } else rj(new Error('Does`t mongodb config'));
    });
};

const promise = mongoConnect(mongoUrl)
    .then(async client => {
        db = client.db();
        collection = db.collection('items');

        process.on('SIGINT', () => {
            client.close();
            process.exit();
        });

        return {db, collection};
    });

module.exports = () => promise;
