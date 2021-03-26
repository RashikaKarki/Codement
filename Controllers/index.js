const SetRoutes =  (app) => {
  app.get('/', (req, res)=>{
    res.send("Hello Word!");
  });
}

module.exports = { SetRoutes };