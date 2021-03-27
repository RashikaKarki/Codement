const {fileModel, userModel} = require('../Models');
const promiseHandler = require('../Utils/promiseHandler');
const path = require('path');

class FileController {
  static async saveFile(req, res, next){
    try{
      let {uname, commenter} = req.body;
      const fileInfo = req.file;

      let newFile = new fileModel({
        name: fileInfo.filename,
        path: fileInfo.path,
        owner: uname,
        accessTo: commenter
      });

      let [newFl, err] = await promiseHandler(newFile.save());

      if(err){
        console.log(err);
        throw new Error("Can't save the file!");
      }

      let [user, error] = await promiseHandler(userModel.findOne({userName: uname}));

      if(error){
        console.log(error);
        throw new Error("Can't save the file!");
      }

      user.accessFiles.push(fileInfo.filename);

      user.save();

      return res.status(200).send({
        success:true,
      });

    }catch(error){
      next(error)
    }
  }

  static async downloadFileWithCmt(req, res, next) {
    try{
      let { flname } = req.body

      let path1 = __dirname + '/../files/'+flname;

      res.download(path1, (err)=>{
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