import * as vscode from 'vscode';
import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function getApiKey(): string {
    const config = vscode.workspace.getConfiguration('reviewit');
    const apiKey = config.get<string>('apiKey', '');
    return apiKey;
}

const openai = new OpenAI({ apiKey: (process.env.ENV === 'development') ? process.env.OPENAI_API_KEY : getApiKey() });

export function activate(context: vscode.ExtensionContext) {
    // Create an output channel for OpenAI code reviews
    const reviewOutputChannel = vscode.window.createOutputChannel("OpenAI Code Review");

    let disposable = vscode.commands.registerCommand('extension.openAIReview', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Open a file and select some text to review.');
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        const text = document.getText(selection);

        if (!text) {
            vscode.window.showInformationMessage('Please select some text to review.');
            return;
        }

        vscode.window.showQuickPick(['View in Output Panel', 'View as Notification'], {
            placeHolder: 'How would you like to view the review suggestions?',
        }).then(async (choice) => {
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo-0125",
                    messages: [{ role: 'user', content: `# Code review\n${text}\n## Suggestions:` }],
                    temperature: 0.7,
                    max_tokens: 4000,
                    top_p: 1.0,
                    frequency_penalty: 0.0,
                    presence_penalty: 0.0,
                });

                if (response && response.choices && response.choices.length > 0) {
                    const message = response.choices[0].message.content?.trim();
                    if (message) {
                        if (choice === 'View in Output Panel') {
                            reviewOutputChannel.clear();
                            reviewOutputChannel.appendLine(message);
                            reviewOutputChannel.show(true);
                        } else if (choice === 'View as Notification') {
                            vscode.window.showInformationMessage(message, { modal: true });
                        }
                    } else {
                        vscode.window.showErrorMessage('No review suggestions were found.');
                    }
                } else {
                    vscode.window.showErrorMessage('No review suggestions were found.');
                }
            } catch (error) {
                console.error('Failed to review code:', error);
                vscode.window.showErrorMessage('Failed to review code.');
            }
        });
    });

    context.subscriptions.push(disposable);
}
