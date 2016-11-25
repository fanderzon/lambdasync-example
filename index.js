const MongoClient = require('mongodb').MongoClient;
const uuid = require('node-uuid').v4;

const SUCCESS = 'success';

const idRegex = /^api\/(.*?)(\/|$)/;
function getIdFromPath(path) {
  const match = idRegex.exec(path);
  return match && match[1];
}

function addNote(db, note) {
  return new Promise((resolve, reject) => {
    db
      .collection('notes')
      .insertOne(
        Object.assign({}, note, {
          id: uuid(),
          pinned: false
        }),
        err => {
          if (err) {
            reject(err);
          }
          resolve(SUCCESS);
        }
      );
  });
}

function updateNote(db, noteId, note) {
  if (!note || !noteId) {
    return Promise.reject();
  }
  return new Promise((resolve, reject) => {
    db
      .collection('notes')
      .updateOne({id: noteId}, Object.assign({}, note), err => {
        if (err) {
          return reject(err);
        }
        return resolve(JSON.stringify(SUCCESS));
      });
  });
}

function deleteNote(db, id) {
  if (!id) {
    return Promise.reject();
  }
  return new Promise((resolve, reject) => {
    db
      .collection('notes')
      .deleteOne({id}, err => {
        if (err) {
          return reject(err);
        }
        return resolve(JSON.stringify(SUCCESS));
      });
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

function respondAndClose(db, callback, error, response) {
  db.close();
  callback(error, {
    result: response
  });
}

exports.handler = function handler(event, context, callback) {
  const MONGO_URL = event.stageVariables.MONGO_URL || null;
  const noteId = getIdFromPath(event.params.path.proxy);
  
  MongoClient.connect(MONGO_URL, function (err, db) {
    if (err) {
      return callback(null, err);
    }

    switch (event.context.httpMethod) {
      case 'POST':
        addNote(db, event.bodyJson)
          .then(res => respondAndClose(db, callback, null, res))
          .catch(err => respondAndClose(db, callback, err, null));
        break;
      case 'PUT':
        if (!noteId) {
          return respondAndClose(db, callback, 'Missing id parameter', null);
        }
        updateNote(db, noteId, event.bodyJson)
          .then(res => respondAndClose(db, callback, null, res))
          .catch(err => respondAndClose(db, callback, err, null));
        break;
      case 'DELETE':
        if (!noteId) {
          return respondAndClose(db, callback, 'Missing id parameter', null);
        }
        deleteNote(db, noteId)
          .then(res => respondAndClose(db, callback, null, res))
          .catch(err => respondAndClose(db, callback, err, null));
        break;
      case 'GET':
        return getNotes(db)
          .then(res => respondAndClose(db, callback, null, res))
          .catch(err => respondAndClose(db, callback, err, null));
      default:
        respondAndClose(db, callback, null, 'unhandled request');
    }
  });
};
