// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const extractComponent = vscode.commands.registerCommand(
    "extractor.extractComponent",
    async () => {
      const activeTextEditor = vscode.window.activeTextEditor;
      if (!activeTextEditor) {
        return;
      }
      const selection = activeTextEditor.selection;
      const selectionText = activeTextEditor.document.getText(selection);
      if (!selectionText) {
        return;
      }

      const fullPath = activeTextEditor.document.uri.fsPath;

      const currentFolder = path.dirname(fullPath);

      let nameComponent = await vscode.window.showInputBox({
        prompt: "Введите имя компонента",
        placeHolder: "MyComponent",
        validateInput: (text) => {
          if (!/[A-Z][A-Za-z0-9]*$/.test(text)) {
            return "Имя должно начинаться с заглавной буквы и содержать только буквы и цифры";
          }
          return null;
        },
      });

      if (!nameComponent) {
        nameComponent = "ExtractedComponent";
      }

      const newFilePath = path.join(currentFolder, `${nameComponent}.tsx`);

      const component = `const ${nameComponent} = () => {
  return (
    <>
      ${selectionText}
    </>
  );
};

export default ${nameComponent};`;

      const uint8Array = Buffer.from(component, "utf8");

      vscode.workspace.fs.writeFile(vscode.Uri.file(newFilePath), uint8Array);

      const fullText = activeTextEditor.document.getText();

      const lines = fullText.split("\n");

      let lineIndex = -1;

      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith("import")) {
          lineIndex = i;
          break;
        }
      }

      const position = new vscode.Position(lineIndex + 1, 0);

      activeTextEditor.edit((editBuilder) => {
        editBuilder.insert(
          position,
          `import ${nameComponent} from "./${nameComponent}";\n`
        );
        editBuilder.replace(selection, `<${nameComponent} />`);
      });

      vscode.window.showInformationMessage("Компонент создан!");
    }
  );

  context.subscriptions.push(extractComponent);
}

// This method is called when your extension is deactivated
export function deactivate() {}
