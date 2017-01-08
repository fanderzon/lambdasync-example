'use strict';
const MongoClient = require('mongodb').MongoClient;
const uuid = require('node-uuid').v4;

const SUCCESS = {
  result: 'success'
};
const STATUS_CODE_OK = 200;
const STATUS_CODE_NOT_FOUND = 404;
const STATUS_CODE_ERROR = 500;

const idRegex = /^\/(.*?)(\/|$)/;
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
        return resolve(SUCCESS);
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
        return resolve(SUCCESS);
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

function isResponseObject(subject) {
  return typeof response === 'object' && response.statusCode && response.headers && response.body;
}

function formatResponse(statusCode, response) {
  // Check if we have a valid response object, and if so, return it
  if (isResponseObject(response)) {
    return response;
  }

  let body = '';
  try {
    if (response) {
      body = JSON.stringify(response);
    } else {
      body = JSON.stringify('');
    }
  } catch(err) {
    body = JSON.stringify(response.toString())
  }

  return {
    statusCode: statusCode || STATUS_CODE_OK,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body
  };
}

function respondAndClose(db, callback, response, statusCode) {
  db.close();
  return callback(null, formatResponse(statusCode, response));
}

exports.handler = function handler(event, context, callback) {
  const MONGO_URL = process.env.MONGO_URL || null;
  const noteId = getIdFromPath(event.path);
  let body = null;
  try {
    body = JSON.parse(event.body);
  } catch(err) {
    // meh
  }

  MongoClient.connect(MONGO_URL, function (err, db) {
    if (err) {
      return callback(err);
    }

    switch (event.httpMethod) {
      case 'POST':
        addNote(db, body)
          .then(res => respondAndClose(db, callback, res, STATUS_CODE_OK))
          .catch(err => respondAndClose(db, callback, err, STATUS_CODE_ERROR));
        break;
      case 'GET':
        return getNotes(db)
          .then(res => respondAndClose(db, callback, res, STATUS_CODE_OK))
          .catch(err => respondAndClose(db, callback, err, STATUS_CODE_ERROR));
          break;
      case 'PUT':
        if (!noteId) {
          return respondAndClose(db, callback, 'Missing id parameter', null);
        }
        updateNote(db, noteId, body)
          .then(res => respondAndClose(db, callback, res, STATUS_CODE_OK))
          .catch(err => respondAndClose(db, callback, err, STATUS_CODE_ERROR));
        break;
      case 'DELETE':
        if (!noteId) {
          return respondAndClose(db, callback, 'Missing id parameter', null);
        }
        deleteNote(db, noteId)
          .then(res => respondAndClose(db, callback, res, STATUS_CODE_OK))
          .catch(err => respondAndClose(db, callback, err, STATUS_CODE_ERROR));
        break;
      default:
        respondAndClose(db, callback, {
          result: 'unhandled request'
        }, STATUS_CODE_NOT_FOUND);
    }
  });
};
