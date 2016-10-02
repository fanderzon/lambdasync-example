const MongoClient = require('mongodb').MongoClient;
const uuid = require('node-uuid@1.4.3').v4;
const SUCCESS = {"result": "success"};

function writeNote(db, {id, title, text, read}) {
  return new Promise((resolve, reject) => {
    try {
      db
        .collection('notes')
        .insertOne({
          id,
          title,
          text,
          read
        });
      resolve(SUCCESS);
    } catch(err) {
      reject(err);
    }
  });
}

function addNote(db, {title, text} = {}) {
  const read = false;

  return writeNote(db, {
    id: uuid(),
    title,
    text,
    read,
  });
}

function updateNote(db, {id, title, text, read} = {}) {
  read = read === 'false' ? false : true;
  return new Promise((resolve, reject) => {
    try {
      db
        .collection('notes')
        .updateOne({id}, {
          id,
          title,
          text,
          read
        });
        resolve(SUCCESS)
    } catch(err) {
      reject(err);
    }
  });
}

function getNotes(db, filter = {}) {
  return new Promise((resolve, reject) => {
    db.collection('notes').find(filter).toArray((err, data) => {
      resolve(data);
    });
  });
}

exports.handler = function(event, context, done) {
  const {MONGO_URL} = event.stageVariables;
  MongoClient.connect(MONGO_URL, function (err, db) {
    if(err) {
      return done(err);
    }

    switch(event.context.httpMethod) {
      case 'POST':
        addNote(db, event.bodyJson)
          .then(res => done(null, res));
        break;
      case 'PUT':
        updateNote(db, event.bodyJson)
          .then(res => done(null, res));
        break;
      case 'GET':
        return getNotes(db)
          .then(res => done(null, res));
      default:
        done(null, {
          "result": "unhandled request"
        });
    }
  });
};
