const MongoClient = require('mongodb').MongoClient;
const uuid = require('node-uuid').v4;

const SUCCESS = {
  result: 'success'
};

const idRegex = /^api\/(.*?)(\/|$)/;
function getIdFromPath(path) {
  const match = idRegex.exec(path);
  return match && match[1];
}

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
        .updateOne({id: note.id}, Object.assign({}, note));
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

exports.handler = function handler(event, context, callback) {
  const MONGO_URL = event.stageVariables.MONGO_URL || null;
  const noteId = getIdFromPath(event.params.path.proxy);
  
  MongoClient.connect(MONGO_URL, function (err, db) {
    if (err) {
      return callback(err);
    }

    switch (event.context.httpMethod) {
      case 'POST':
        addNote(db, event.bodyJson)
          .then(res => {
            db.close();
            callback(null, res);
          });
        break;
      case 'PUT':
        updateNote(db, event.bodyJson)
          .then(res => {
            db.close();
            callback(null, res);
          });
        break;

      case 'GET':
        return getNotes(db)
          .then(res => {
            db.close();
            callback(null, res);
          });
      default:
        db.close();
        callback(null, JSON.stringify({
          result: 'unhandled request'
        }));
    }
  });
};
