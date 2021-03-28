# Codement

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/RashikaKarki/Codement.svg)](https://github.com/RashikaKarki/Codement/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/RashikaKarki/Codement.svg)](https://github.com/RashikaKarki/Codement/pulls)
![Codement](https://socialify.git.ci/RashikaKarki/Codement/image?description=1&language=1&theme=Light)

Codement is a vscode-extension that helps you share and get feedback on your code with ease even in early stages. 

As a programmer it always helps to get feedback on our code and GitHub Pull Request Review helps a lot to do that however there are a lot of times we want to get feedback early on as going back through a huge codebase ad changing things are for sure not fun and that is where Codement comes in. Codement allows you to share your code with ease with anyone at any point and get feedback all through vscode-extension.

## How to run it locally?

### Release Notes

### 1.0.0

- Sharing your code
- Browsing files shared with you
- Commenting on the code shared with you


## VSCode Extension

#### Steps to run the VSCode Extension

- To install the dependency for codement go to folder codement inside the main folder and run the command:
`npm install`
- Reload the files
`npm run watch`
- Press `f5`


### BackEnd Server

#### Steps to run the server:

- Clone the [repo](https://github.com/RashikaKarki/Codement)
- Go to the main folder `Codement`
- Install all the dependency
`npm install`
- Connect to Database
- Run the backend server
`node app.js`

#### Database Connection:

-  Mongo Atlas is used as a database service for the project. In order to connect to the database create a connection string and store in `.env` folder as `MONGOURL="<CONNECTION_STRING>"` in projects root folder. 


#### REST API ENDPOINTS:
- **POST `/user/log`**
  - Register user after singing in with github
  - Parameters: 
    - `uname`: username of the user (String)
    - `fname` : full name of the user (String)

    Passed as form data in `req.body`.

- **POST `/file`**
  - Save file in the server to share code with commenter
  - Parameters: 
    - `uname`: username of the user (String)
    - `commenter` : username of the commenter (String)
    - `source`: file to be uploaded (selected by file picker) (File Object)

    File selector is required to select file. File info is exposed in `req.file`. `uname` and `commenter` is passed as form data in `req.body`. 
    
    NOTE: define input field for 'uname` and `commenter` before file selector beacude of the multer settings.

- **POST `/comment`**
  - Add comment to the shared file
  - Parameters: 
    - `filename`: filename (should match from our own database) (String)
    - `comment` : comment description (String)
    - `uname`: username of the commenter (String)
    - `line`: single line number (Number)

    Passed as form data in `req.body`.

- **GET `/file?flname=<FILE_NAME>`**
  - Download the shared file
  - Parameters: 
    - `flname`: filename of the file(shoud match filename in db) (String)

    Passed in `req.query`.

- **GET `/list/file?uname=<USERNAME>`**
  - Returns list of files the which the user has access to
  - Parameters: 
    - `uname`: username (String)
    
    Passed in `req.query`.

- **GET `/comment?filename=<FILE_NAME>`**
  - Returns comments associated with the file
  - Parameters: 
    - `filename`: filename of the file(shoud match filename in db) (String)
    
    Passed in `req.query`.
    
### For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)


## Contributors

- [Rashika Karki](https://github.com/RashikaKarki)
- [Shrill Shrestha](https://github.com/ShrillShrestha)

## How to contribute?

Take a look at the [contribution guidelines](https://github.com/RashikaKarki/Codement/blob/main/Contribution.md) and open a [new issue](https://github.com/RashikaKarki/Codement/issues) or [pull request](https://github.com/RashikaKarki/Codement/pulls) on GitHub.
