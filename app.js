const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const { ConnectDB } = require('./Middlewares/db');
const { SetRoutes } = require('./Controllers');

require('dotenv').config();

const PORT = process.env.PORT || 8000;
const MongoURL = process.env.MONGOURL;
const app = express();

if(!fs.existsSync('files')){ //make 'files' folder if not exist for storing uploaded files
  fs.mkdirSync('files');
}

try {
  ConnectDB(MongoURL);
} catch (next) {}

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) =>{
    cb(null, 'files');
  },
  filename: (req, file, cb) => {
    cb(null, req.body.uname + "_" + file.originalname);
  }
});

app.use(multer({storage: fileStorage}).single('source'))

/**testing in browser*/
const path = require('path');
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) =>{
  res.render('index.html');
});

// app.post("/file", (req, res, next) => {
//   const fileInfo = req.file;
//   console.log(fileInfo);
// });
/** */
SetRoutes(app); //Add REST API endpoints

//Default error handler
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
