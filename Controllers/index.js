const userController = require('./userController');
const fileController = require('./fileController');
const commentController = require('./commentController');

const SetRoutes =  (app) => {
  app.post('/user/log', userController.logUser);
  app.post('/file', fileController.saveFile);
  app.post('/comment', commentController.saveComment);

  app.get('/file', fileController.downloadFileWithCmt);
  app.get('/list/file', userController.getFilesName);
  //app.post('/commenter', userController.addCommenter);
}

module.exports = { SetRoutes };