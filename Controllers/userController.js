const {userModel} = require('../Models');
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
        success:true,
      });

    }catch(error){
      next(error);
    }
  }
}

module.exports = UserController;