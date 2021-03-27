/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");;

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SidebarProvider = void 0;
const vscode = __webpack_require__(1);
const authentication_1 = __webpack_require__(3);
class SidebarProvider {
    constructor(_extensionUri, currentContext) {
        this._extensionUri = _extensionUri;
        this.ext_uri = _extensionUri;
        this.credentials = new authentication_1.Credentials();
        this.credentials.initialize(currentContext);
    }
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        SidebarProvider.currentView = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((data) => __awaiter(this, void 0, void 0, function* () {
            switch (data.type) {
                case "onSignIn": {
                    //run on recieving "onSignIn" message
                    if (!data.value) {
                        return;
                    }
                    const session = yield this.credentials.getSession();
                    if (session) {
                        SidebarProvider.session = session;
                        if (data.value !== "noNotification") {
                            vscode.window.showInformationMessage("Signed In as: '" + session.account.label + "'");
                        }
                        webviewView.webview.postMessage({
                            command: "authComplete",
                            payload: { session: session },
                        });
                    }
                    else {
                        vscode.window.showErrorMessage("Could not authenticate with GitHub, please try again.");
                    }
                    break;
                }
            }
        }));
    }
    _getHtmlForWebview(webview) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js"));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css"));
        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();
        return `<!DOCTYPE html>
						<html lang="en">
						<head>
							<meta charset="UTF-8">
							<!--
								Use a content security policy to only allow loading images from https or from our extension directory,
								and only allow scripts that have a specific nonce.
					-->
					<meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
							<meta name="viewport" content="width=device-width, initial-scale=1.0">
							<link href="${styleResetUri}" rel="stylesheet">
							<link href="${styleVSCodeUri}" rel="stylesheet">
					<link href="${styleMainUri}" rel="stylesheet">
							<script nonce="${nonce}">
								const ext_vscode = acquireVsCodeApi();
							</script>
						</head>
				<body>
							<script nonce="${nonce}" src="${scriptUri}"></script>
						</body>
						</html>`;
    }
}
exports.SidebarProvider = SidebarProvider;
SidebarProvider.viewType = 'codement.sidebarView';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


/***/ }),
/* 3 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Credentials = void 0;
const vscode = __webpack_require__(1);
const GITHUB_AUTH_PROVIDER_ID = "github";
// The GitHub Authentication Provider accepts the scopes described here:
// https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/
const SCOPES = ["user"];
class Credentials {
    initialize(context) {
        return __awaiter(this, void 0, void 0, function* () {
            this.registerListeners(context);
            this.setSession();
        });
    }
    setSession() {
        return __awaiter(this, void 0, void 0, function* () {
            /**
             * By passing the `createIfNone` flag, a numbered badge will show up on the accounts activity bar icon.
             * An entry for the sample extension will be added under the menu to sign in. This allows quietly
             * prompting the user to sign in.
             * */
            const session = yield vscode.authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, { createIfNone: false });
            if (this.session) {
                this.session = session;
                return this.session;
            }
            this.session = undefined;
        });
    }
    registerListeners(context) {
        /**
         * Sessions are changed when a user logs in or logs out.
         */
        context.subscriptions.push(vscode.authentication.onDidChangeSessions((e) => __awaiter(this, void 0, void 0, function* () {
            if (e.provider.id === GITHUB_AUTH_PROVIDER_ID) {
                yield this.setSession();
            }
        })));
    }
    getSession() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.session) {
                return this.session;
            }
            /**
             * When the `createIfNone` flag is passed, a modal dialog will be shown asking the user to sign in.
             * Note that this can throw if the user clicks cancel.
             */
            this.session = yield vscode.authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, { createIfNone: true });
            return this.session;
        });
    }
}
exports.Credentials = Credentials;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = void 0;
const vscode = __webpack_require__(1);
const SidebarProvider_1 = __webpack_require__(2);
function activate(context) {
    const provider = new SidebarProvider_1.SidebarProvider(context.extensionUri, context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(SidebarProvider_1.SidebarProvider.viewType, provider));
}
exports.activate = activate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map