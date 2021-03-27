const userController = require('./userController');
const fileController = require('./fileController');
const commentController = require('./commentController');

const SetRoutes =  (app) => {
  app.post('/user/log', userController.logUser); // end point to register a user in database (once signed in through GitHub)
  app.post('/file', fileController.saveFile); // end point to save file one wanted to share in the server
  app.post('/comment', commentController.saveComment); // end point to save comment done by commenter

  app.get('/file', fileController.downloadFileWithCmt); // endpoint that downloads the file
  app.get('/list/file', userController.getFilesName); // endpoint that get list of file name which a user has access to
  app.get('/comment', commentController.getComments); //end point to get comments for a file
}

module.exports = { SetRoutes };