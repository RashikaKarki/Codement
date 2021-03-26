const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { ConnectDB } = require('./middlewares/db');

require('dotenv').config();

const PORT = process.env.PORT || 8000;
const MongoURL = process.env.MONGOURL;
const app = express();

try {
  ConnectDB(MongoURL);
} catch (next) {}

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use((err, req, res, next) => {
  console.log(err);
  res.status(400).send({
    success: false,
    message: err.message || err
  });
});

app.listen(PORT, ()=>{
  console.log(`Server listening on ${PORT}`);
})
