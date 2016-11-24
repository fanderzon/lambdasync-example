const MongoClient = require('mongodb').MongoClient;
const uuid = require('node-uuid').v4;

const SUCCESS = {
  result: 'success'
};

function writeNote(db, note) {
  return new Promise((resolve, reject) => {
    try {
      db
        .collection('notes')
        .insertOne(note);
      resolve(JSON.stringify(SUCCESS));
    } catch (err) {
      reject(err);
    }
  });
}

function addNote(db, note) {
  if (!note) {
    return Promise.reject();
  }
  return writeNote(db, Object.assign({}, note, {
    id: uuid(),
    read: false
  }));
}

function updateNote(db, note) {
  if (!note) {
    return Promise.reject();
  }
  return new Promise((resolve, reject) => {
    try {
      db
        .collection('notes')
        .updateOne({id: note.id}, Object.assign({}, note, {
          read: note.read && note.read === 'false'
        }));
      resolve(JSON.stringify(SUCCESS));
    } catch (err) {
      reject(err);
    }
  });
}

function getNotes(db, filter) {
  filter = filter || {};
  return new Promise((resolve, reject) => {
    db.collection('notes').find(filter).toArray((err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

exports.handler = function handler(event, context, done) {
  const MONGO_URL = event.stageVariables.MONGO_URL || null;
  MongoClient.connect(MONGO_URL, function (err, db) {
    if (err) {
      return done(null, err);
    }

    switch (event.context.httpMethod) {
      case 'POST':
        addNote(db, event.bodyJson)
          .then(res => {
            db.close();
            done(null, res);
          });
        break;
      case 'PUT':
        updateNote(db, event.bodyJson)
          .then(res => {
            db.close();
            done(null, res);
          });
        break;
      case 'GET':
        return getNotes(db)
          .then(res => {
            db.close();
            done(null, res);
          });
      default:
        db.close();
        done(null, JSON.stringify({
          result: 'unhandled request'
        }));
    }
  });
};
