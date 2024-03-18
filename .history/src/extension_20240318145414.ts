require('dotenv').config();
import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.openAIReview', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No code found or no file is open');
            return;
        }

        const text = editor.document.getText(editor.selection) || editor.document.getText();
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/completions',
                {
                    model: "code-davinci-003",
                    prompt: `Review the following code snippet for errors, best practices, and optimization opportunities:\n\n${text}`,
                    temperature: 0.5,
                    max_tokens: 150,
                    top_p: 1.0,
                    frequency_penalty: 0.0,
                    presence_penalty: 0.0,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            vscode.window.showInformationMessage(response.data.choices[0].text.trim());
        } catch (error) {
            console.error("Error calling OpenAI:", error);
            vscode.window.showErrorMessage("Error reviewing code. Please check the console for more information.");
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
