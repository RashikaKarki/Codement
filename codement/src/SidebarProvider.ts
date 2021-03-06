import * as vscode from "vscode";
import { Credentials } from "./authentication";

export class SidebarProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'codement.sidebarView';

	_view?: vscode.WebviewView;
	_doc?: vscode.TextDocument;
	ext_uri?: vscode.Uri;
	credentials: Credentials;

	public static currentView: vscode.WebviewView | undefined;
  public static session: any;

	constructor(private readonly _extensionUri: vscode.Uri, currentContext: vscode.ExtensionContext) { 
		this.ext_uri = _extensionUri;
    this.credentials = new Credentials();
    this.credentials.initialize(currentContext);
	}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "onSignIn": { //run on recieving "onSignIn" message
					if (!data.value) {
						return;
					}
					const session = await this.credentials.getSession();

          if (session) {
            SidebarProvider.session = session;
            
            if (data.value !== "noNotification") {
              vscode.window.showInformationMessage(
                "Signed In as: '" + session.account.label + "'"
              );
            }

            webviewView.webview.postMessage({
              command: "authComplete",
              payload: { session: session },
            });

            if (this.ext_uri) {
              console.log("Hi there!!!"); //create a Homepanel window on sign in
            }
          } else {
            vscode.window.showErrorMessage(
              "Could not authenticate with GitHub, please try again."
            );
          }

          break;
        }
				case "upload":{
					vscode.env.openExternal(vscode.Uri.parse("http://localhost:8000/"));
					break;
				}
				case "download":{
					vscode.env.openExternal(vscode.Uri.parse(`http://localhost:8000/file?flname=${data.value}`));
					break;
				}
				case "onInfo": {
					if (!data.value) {
						return;
					}
					vscode.window.showInformationMessage(data.value);
					break;
				}
				case "onError": {
					if (!data.value) {
						return;
					}
					vscode.window.showErrorMessage(data.value);
					break;
				}
			}
		});
	}

	public revive(panel: vscode.WebviewView) {
		this._view = panel;
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const styleResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
		);
		const styleVSCodeUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
		);
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
		);
		const styleMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
		);

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
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource
			}; script-src 'nonce-${nonce}';">
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

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

