const {userModel, fileModel} = require('../Models');
const promiseHandler = require('../Utils/promiseHandler');

class UserController {
  static async logUser(req, res, next){
    try{
      let { uname, fname } = req.body;

      let [userInfo, error] = await promiseHandler(userModel.find({userName: uname})); // try to find user with the username in database

      if(error){
        throw new Error("Can't authenticate");
      }

      if(userInfo.length !== 0){
        console.log("User already in database");
      }else{
        let newUser = new userModel({name: fname, userName: uname});
        let [_newUser, err] = await promiseHandler(newUser.save()); // register new user

        if(err){
          console.log(err);
          throw new Error("Can't create a new user!");
        }
      }

      return res.status(200).send({
        success: true
      });

    }catch(error){
      next(error);
    }
  }

  static async getFilesName(req, res, next){
    try{
      let { uname } = req.query;

      let [userInfo, error] = await promiseHandler(userModel.findOne({userName: uname})); // search for user in database

      if(error){
        throw new Error("Can't authenticate");
      }

      if(userInfo.length === 0){
        throw new Error("No such user with the username!");
      }

      return res.status(200).send({
        files: [...userInfo.accessFiles]
      });

    }catch(error){
      next(error)
    }
  } 
}

module.exports = UserController;