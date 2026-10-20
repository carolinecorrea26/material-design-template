import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { toId, storyNameFromExport } from 'storybook/internal/csf';

export function walkFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walkFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
const unwrap = node => node && (ts.isSatisfiesExpression(node) || ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) ? unwrap(node.expression) : node;
const property = (node, name) => unwrap(node)?.properties?.find(item => ts.isPropertyAssignment(item) && item.name.getText() === name)?.initializer;
const literal = node => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null;

export function readStoryInventory(root = 'src') {
  return walkFiles(root).filter(file => /\.stories\.[cm]?[jt]sx?$/.test(file)).map(file => {
    const text = fs.readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const variables = ast.statements.filter(ts.isVariableStatement).flatMap(statement => statement.declarationList.declarations);
    const assignment = ast.statements.find(ts.isExportAssignment)?.expression;
    const meta = assignment && ts.isIdentifier(assignment) ? variables.find(declaration => declaration.name.getText() === assignment.text)?.initializer : assignment;
    const title = literal(property(meta, 'title'));
    const id = literal(property(meta, 'id'));
    if (!title) throw new Error(`Story title missing: ${file}`);
    const exports = ast.statements.flatMap(statement => {
      if (!statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) || statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)) return [];
      if (ts.isVariableStatement(statement)) return statement.declarationList.declarations.map(declaration => declaration.name.getText());
      return ts.isFunctionDeclaration(statement) && statement.name ? [statement.name.text] : [];
    });
    const used = new Set();
    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) used.add(node.tagName.getText());
      ts.forEachChild(node, visit);
    }
    visit(ast);
    const component = property(meta, 'component')?.getText();
    if (component) used.add(component);
    const components = ast.statements.filter(ts.isImportDeclaration).flatMap(node => {
      if (!node.importClause || node.importClause.isTypeOnly || !node.moduleSpecifier.text.startsWith('.')) return [];
      const base = path.resolve(path.dirname(file), node.moduleSpecifier.text);
      const target = [base + '.tsx', base + '.ts', path.join(base, 'index.tsx')].find(file => fs.existsSync(file));
      if (!target || !target.includes('/components/') || /\/(admin|docs)\//.test(target)) return [];
      const bindings = [node.importClause.name?.text, ...(node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings) ? node.importClause.namedBindings.elements.map(item => item.name.text) : [])].filter(Boolean);
      if (!bindings.some(name => used.has(name))) return [];
      return [{ name: path.basename(target).replace(/\.[jt]sx?$/, ''), source: path.relative(process.cwd(), target), ownsStory: path.basename(file).replace(/\.stories\.[jt]sx?$/, '') === path.basename(target).replace(/\.[jt]sx?$/, '') }];
    });
    return { file, title, section: title.split('/')[0], storyIds: exports.map(name => toId(id ?? title, storyNameFromExport(name))), components };
  }).sort((a, b) => a.file.localeCompare(b.file));
}
