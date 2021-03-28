"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Credentials = void 0;
const vscode = require("vscode");
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
//# sourceMappingURL=authentication.js.map