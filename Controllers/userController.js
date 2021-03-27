const {userModel, fileModel} = require('../Models');
const promiseHandler = require('../Utils/promiseHandler');


class UserController {
  static async logUser(req, res, next){
    try{
      let { uname, fname } = req.body;

      let [userInfo, error] = await promiseHandler(userModel.find({userName: uname}));

      if(error){
        throw new Error("Can't authenticate");
      }

      if(userInfo.length !== 0){
        console.log("User already in database");
      }else{
        let newUser = new userModel({name: fname, userName: uname});
        let [_newUser, err] = await promiseHandler(newUser.save());

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
      let { uname } = req.body;

      let [userInfo, error] = await promiseHandler(userModel.findOne({userName: uname}));

      if(error){
        throw new Error("Can't authenticate");
      }

      if(userInfo.length === 0){
        throw new Error("No such user with such user name!");
      }

      return res.status(200).send({
        files: [...userInfo.accessFiles]
      });

    }catch(error){
      next(error)
    }
  } 

  // static async addCommenter(req, res, next){
  //   try{
  //     /**
  //      * TODO: Check for the file's ownership of the user, who adds commenter
  //      */
  //     let {commenter, flname} = req.body

  //     let [cmter, error] = await promiseHandler(userModel.findOne({userName: commenter}));

  //     if(error || !cmter){
  //       console.log(error);
  //       throw new Error("Something went wrong with the database while searching commenter!");
  //     }

  //     let [fileInfo, err] = await promiseHandler(fileModel.findOne({name: flname}));

  //     if(err || !fileInfo){
  //       console.log(err);
  //       throw new Error("Something went wrong with the database while searching for file!")
  //     }

  //     cmter.accessFiles.push(flname);
  //     cmter.save();

  //     fileInfo.accessTo.push(commenter);
  //     fileInfo.save();

  //     return res.status(200).send({
  //       success: true
  //     });

  //   }catch(error){
  //     next(error);
  //   }
  // }
}

module.exports = UserController;