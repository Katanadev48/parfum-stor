const mongoose = require('mongoose');

let connection;

async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState !== 2) connection = undefined;
  if (!connection) {
    connection = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .then(() => {
        console.log('MongoDB connected');
        return mongoose.connection;
      })
      .catch(error => {
        connection = undefined;
        throw error;
      });
  }
  return connection;
}

module.exports = connectDatabase;
