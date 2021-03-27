const {fileModel, userModel} = require('../Models');
const promiseHandler = require('../Utils/promiseHandler');

class FileController {
  static async saveFile(req, res, next){
    try{
      let {uname} = req.body;
      const fileInfo = req.file;

      let newFile = new fileModel({
        name: fileInfo.filename,
        path: fileInfo.path,
        owner: uname,
        accessTo: [uname]
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
}

module.exports = FileController;