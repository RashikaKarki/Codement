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

      let [file, error] = await promiseHandler(fileModel.findOne({name: filename}));

      if(error){
        console.log(error);
        throw new Error ("Something went wrong while retriving file name!");
      }

      let [newCmt, err] = await promiseHandler(newComment.save()); // save comment to database

      if(err){
        console.log(err);
        throw new Error("Can't save the file!");
      }

      if(file){
        file.comments.push(newCmt);
        file.save(); // maps comment to the file
      }else{
        throw new Error("Can't assosciate a file for the comment!");
      }

      return res.status(200).send({
        success:true,
      });

    }catch(error){
      next(error)
    }
  }

  static async getComments(req, res, next) {
    try{
      let { filename } = req.query;

      await fileModel.findOne({name: filename}).populate('comments').exec(function(err, commentList){ //find comments(id) for the file and populate
        if(err){
          console.log(err);
        }
        return res.status(200).send({
          comments: [...commentList.comments] //returns comments
        })
      });

    }catch(error){
      next(error)
    }
  }
}

module.exports = CommentController;