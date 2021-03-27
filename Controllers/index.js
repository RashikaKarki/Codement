const userController = require('./userController');

const SetRoutes =  (app) => {
  app.post('/user/login', userController.logUser);
}

module.exports = { SetRoutes };