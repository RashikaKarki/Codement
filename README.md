# Codement

### REST API ENDPOINTS:
- POST `/user/log`
  - Register user after singing in with github
  - Parameters: 
    - `uname`: username of the user (String)
    - `fname` : full name of the user (String)
    Passed as form data in req.body

- POST `/file`
  - Save file in the server to share code with commenter
  - Parameters: 
    - `uname`: username of the user (String)
    - `commenter` : username of the commenter (String)
    - `source`: file to be uploaded (selected by file picker) (File Object)
    File selector is required to select file. File info is exposed in req.file. `uname` and `commenter` is passed as form data in req.body. 
    
    NOTE: define input field for 'uname` and `commenter` before file selector beacude of the multer settings.

- POST `/comment`
  - Add comment to the shared file
  - Parameters: 
    - `filename`: filename (should match from our own database) (String)
    - `comment` : comment description (String)
    - `uname`: username of the commenter (String)
    - `line`: single line number (Number)
    Passed as form data in req.body

- GET `/file?flname=<FILE_NAME>`
  - Download the shared file
  - Parameters: 
    - `flname`: filename of the file(shoud match filename in db) (String)
    Passed as form data in req.query

- GET `/list/file?uname=<USERNAME>`
  - Returns list of files the which the user has access to
  - Parameters: 
    - `uname`: username (String)
    Passed as form data in req.query

- GET `/comment?filename=<FILE_NAME>`
  - Returns comments associated with the file
  - Parameters: 
    - `filename`: filename of the file(shoud match filename in db) (String)
    Passed as form data in req.query