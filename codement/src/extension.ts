import * as vscode from 'vscode';

import {SidebarProvider} from './SidebarProvider';

export function activate(context: vscode.ExtensionContext) {

	const provider = new SidebarProvider(context.extensionUri, context);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, provider));

}

// this method is called when your extension is deactivated
export function deactivate() {}