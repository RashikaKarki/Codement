const {commentModel, fileModel} = require('../Models');
const promiseHandler = require('../Utils/promiseHandler');

class CommentController {
  static async saveComment(req, res, next){
    try{
      let { filename, comment, uname, line } = req.body;

      let newComment = new commentModel({
        description: comment,
        createdBy: uname,
        lines: line,
        fileName: filename
      });

      let [newCmt, err] = await promiseHandler(newComment.save());

      if(err){
        console.log(err);
        throw new Error("Can't save the file!");
      }

      let [file, error] = await promiseHandler(fileModel.findOne({name: filename}));

      if(error){
        console.log(error);
        throw new Error ("Something went wrong while retriving file name!");
      }else{
        if(file){
          file.comments.push(newCmt);
          file.save();
        }else{
          throw new Error("Can't assosciate a file for the comment!");
        }
      }

      return res.status(200).send({
        success:true,
      });

    }catch(error){
      next(error)
    }
  }
}

module.exports = CommentController;