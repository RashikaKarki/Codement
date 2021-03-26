const mongoose = require('mongoose');

const ConnectDB = async (connectionURL) => {
  try{
    await mongoose.connect(connectionURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });
    console.log("Connected to database!");
  }catch(err){
    console.log("Can't connect to database!");
  }
};

module.exports = { ConnectDB };