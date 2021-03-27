const userController = require('./userController');
const fileController = require('./fileController');
const commentController = require('./commentController');

const SetRoutes =  (app) => {
  app.post('/user/log', userController.logUser);
  app.post('/file', fileController.saveFile);
  app.post('/comment', commentController.saveComment);
}

module.exports = { SetRoutes };