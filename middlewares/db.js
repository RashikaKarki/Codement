const mongoose = require('mongoose');

const ConnectDB = async (connectionURL) => {
  try{
    // connection request to mongoDB Atlas
    await mongoose.connect(connectionURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });
    console.log("Connected to database!");
  }catch(err){
    console.log(err);
  }
};

module.exports = { ConnectDB };