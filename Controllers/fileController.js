const {fileModel, userModel} = require('../Models');
const promiseHandler = require('../Utils/promiseHandler');
const path = require('path');

class FileController {
  static async saveFile(req, res, next){
    try{
      let {uname, commenter} = req.body; // retrive owner username and commenter username
      const fileInfo = req.file; // retirve file info

      let newFile = new fileModel({
        name: fileInfo.filename,
        path: fileInfo.path,
        owner: uname,
        accessTo: commenter
      });

      let [_newFl, err] = await promiseHandler(newFile.save()); // save file info to database

      if(err){
        console.log(err);
        throw new Error("Can't save the file!");
      }

      [commenter, uname].forEach(async(person) => {
        let [user, error] = await promiseHandler(userModel.findOne({userName: person}));

        if(error){
          console.log(error);
          throw new Error("Can't save the file!");
        }

        user.accessFiles.push(fileInfo.filename); // add file to user(owner and commentor) accessFiles field

        user.save();
      });

      return res.status(200).send({
        success:true,
      });

    }catch(error){
      next(error)
    }
  }

  static async downloadFileWithCmt(req, res, next) {
    try{
      let { flname } = req.query

      let path1 = __dirname + '/../files/'+flname; //get access to file's location

      res.download(path1, (err)=>{ // download response
        if(err){
          console.log(err);
        }
      });
    }catch(error){
      next(error);
    }
  }
}

module.exports = FileController;