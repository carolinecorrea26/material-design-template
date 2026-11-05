import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { storyNameFromExport, toId } from 'storybook/internal/csf';

const unwrap = node => node && (ts.isSatisfiesExpression(node) || ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) ? unwrap(node.expression) : node;
const property = (node, name) => unwrap(node)?.properties?.find(item => ts.isPropertyAssignment(item) && item.name.getText().replace(/^['"]|['"]$/g, '') === name)?.initializer;
const literal = node => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null;
const exported = node => node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
const defaulted = node => node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword);
const uiSource = file => /^src\/(components\/(?!admin\/|docs\/)|app\/|pages\/(?!admin\/))/.test(file) && /\.tsx$/.test(file) && !/\.(stories|test)\./.test(file);
// Documentation stories render real source too, but remain outside the applicant inventory.
const renderSource = file => uiSource(file) || /^src\/(components\/docs|docs)\/.*\.tsx$/.test(file) && !/\.(stories|test)\./.test(file);

/** Trace JSX render paths, including local harnesses and CSF args-only stories.
 * A meta.component/import alone never proves that an explicit render uses it.
 * This is source coverage, not proof that every conditional state was mounted. */
export function createComponentAnalyzer(root = process.cwd()) {
  const cache = new Map();
  const relative = file => path.relative(root, file).split(path.sep).join('/');
  function resolve(from, specifier) {
    if (!specifier.startsWith('.')) return null;
    const base = path.resolve(root, path.dirname(from), specifier);
    const result = [base, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    return result ? relative(result) : null;
  }
  function module(file) {
    if (cache.has(file)) return cache.get(file);
    const text = fs.readFileSync(path.resolve(root, file), 'utf8');
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const imports = new Map(), exports = new Set(), top = new Map();
    const result = { ast, imports, exports, top }; cache.set(file, result);
    for (const node of ast.statements) {
      if (ts.isImportDeclaration(node) && node.importClause && !node.importClause.isTypeOnly) {
        const origin = node.moduleSpecifier.text, source = resolve(file, origin);
        const add = (name, symbol) => imports.set(name, { origin, source, symbol });
        if (node.importClause.name) add(node.importClause.name.text, 'default');
        const bindings = node.importClause.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements.filter(binding => !binding.isTypeOnly)) add(binding.name.text, binding.propertyName?.text ?? binding.name.text);
        if (bindings && ts.isNamespaceImport(bindings)) add(bindings.name.text, '*');
      }
      if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) {
        top.set(node.name.text, node);
        if (exported(node)) exports.add(defaulted(node) ? 'default' : node.name.text);
      }
      if (ts.isVariableStatement(node)) for (const declaration of node.declarationList.declarations) {
        top.set(declaration.name.getText(), declaration.initializer);
        if (exported(node)) exports.add(declaration.name.getText());
      }
      if (ts.isExportAssignment(node)) exports.add('default');
      if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) for (const binding of node.exportClause.elements) exports.add(binding.name.text);
    }
    return result;
  }
  function declaration(name, node, mod) {
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (!ts.isBlock(parent) && !ts.isSourceFile(parent)) continue;
      for (const item of parent.statements) {
        if ((ts.isFunctionDeclaration(item) || ts.isClassDeclaration(item)) && item.name?.text === name) return item;
        if (ts.isVariableStatement(item)) {
          const found = item.declarationList.declarations.find(item => item.name.getText() === name);
          if (found) return found.initializer;
        }
      }
    }
    return mod.top.get(name);
  }
  function trace(file, entry, ancestry = new Set()) {
    const identity = `${file}:${entry?.pos}:${entry?.end}`;
    if (ancestry.has(identity)) return { components: [], elements: [], unresolved: [] };
    const trail = new Set(ancestry).add(identity);
    const mod = module(file), seen = new Set(), components = new Map(), elements = new Map(), unresolved = new Set();
    function binding(name, node, tag) {
      const base = name.split('.')[0], imported = mod.imports.get(base);
      if (imported) {
        const provider = /\.(Provider|Consumer)$/.test(name);
        const kind = provider ? 'provider' : imported.source ? 'source-component' : 'package-component';
        if (imported.source && renderSource(imported.source) && !provider) {
          const target = module(imported.source);
          const symbol = imported.symbol === '*' ? name.split('.')[1] : imported.symbol;
          if (!target.exports.has(symbol)) unresolved.add(`${name}: ${imported.source} does not export ${symbol}`);
          else components.set(`${imported.source}:${symbol}`, { source: imported.source, symbol, binding: name });
        }
        // Imported Storybook harnesses are not production components. Follow
        // their actual export bodies and credit only the real views they render.
        if (imported.source?.startsWith('.storybook/') && imported.source.endsWith('.tsx') && !provider) {
          const target = module(imported.source);
          const symbol = imported.symbol === '*' ? name.split('.')[1] : imported.symbol;
          const assignment = target.ast.statements.find(ts.isExportAssignment)?.expression;
          const body = symbol === 'default'
            ? target.ast.statements.find(node => defaulted(node) && (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)))
              ?? (assignment && ts.isIdentifier(assignment) ? target.top.get(assignment.text) : assignment)
            : target.top.get(symbol);
          if (!target.exports.has(symbol) || !body) unresolved.add(`${name}: missing fixture export ${symbol}`);
          else {
            const nested = trace(imported.source, body, trail);
            for (const component of nested.components) components.set(`${component.source}:${component.symbol}`, component);
            for (const error of nested.unresolved) unresolved.add(error);
          }
        }
        return { kind, ...imported };
      }
      const boundName = binding => ts.isIdentifier(binding) ? binding.text === base : (ts.isObjectBindingPattern(binding) || ts.isArrayBindingPattern(binding)) && binding.elements.some(element => ts.isBindingElement(element) && boundName(element.name));
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (parent.parameters?.some(parameter => boundName(parameter.name))) return { kind: 'component-prop', source: file };
      }
      const local = declaration(base, node, mod);
      if (local) { visit(local); return { kind: 'local-composition', source: file }; }
      if (tag && /^[a-z]/.test(name)) return { kind: 'native-element' };
      if (tag) unresolved.add(`${name}: no source binding`);
      return { kind: 'unresolved' };
    }
    function visit(node) {
      if (!node || seen.has(node)) return; seen.add(node);
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const name = node.tagName.getText(), origin = binding(name, node, true);
        const line = mod.ast.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const previous = elements.get(name);
        if (previous) previous.occurrences++;
        else elements.set(name, { tag: name, line, occurrences: 1, ...origin });
      }
      if (ts.isCallExpression(node)) {
        let callee = node.expression;
        if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'bind') callee = callee.expression;
        if (ts.isIdentifier(callee)) {
          const local = declaration(callee.text, callee, mod);
          if (local) visit(local);
          const imported = mod.imports.get(callee.text);
          // Render helpers (e.g. configuredHealthQuestionEntries) are real JSX
          // owners too; pure .ts policy/config imports are not visual components.
          if (imported?.source && renderSource(imported.source) && /^(configured.*Entries|render[A-Z]|[A-Z])/.test(callee.text)) binding(callee.text, callee, false);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(entry);
    return { components: [...components.values()], elements: [...elements.values()], unresolved: [...unresolved] };
  }
  function stories(file) {
    const mod = module(file), assignment = mod.ast.statements.find(ts.isExportAssignment)?.expression;
    const meta = unwrap(assignment && ts.isIdentifier(assignment) ? mod.top.get(assignment.text) : assignment);
    const title = literal(property(meta, 'title')), metaId = literal(property(meta, 'id'));
    if (!title) throw new Error(`Missing story title: ${file}`);
    const rows = [];
    for (const node of mod.ast.statements) {
      if (!exported(node) || defaulted(node)) continue;
      const declarations = ts.isVariableStatement(node) ? node.declarationList.declarations : ts.isFunctionDeclaration(node) && node.name ? [{ name: node.name, initializer: node }] : [];
      for (const item of declarations) {
        const name = item.name.getText(), value = unwrap(item.initializer);
        const render = property(value, 'render') ?? property(meta, 'render');
        const result = render ? trace(file, render) : value && (ts.isArrowFunction(value) || ts.isFunctionDeclaration(value) || ts.isFunctionExpression(value)) ? trace(file, value) : { ...trace(file, property(meta, 'component')), argsOnly: true };
        if (result.argsOnly) {
          const name = property(meta, 'component')?.getText(), imported = name && mod.imports.get(name);
          if (imported?.source && renderSource(imported.source) && module(imported.source).exports.has(imported.symbol)) result.components.push({ source: imported.source, symbol: imported.symbol, binding: name });
        }
        rows.push({ id: toId(metaId ?? title, storyNameFromExport(name)), export: name, title, file, renderKind: result.argsOnly ? 'CSF default component renderer' : 'explicit render', ...result });
      }
    }
    return rows;
  }
  return { module, trace, stories, uiSource };
}

/** Select the story that actually renders this source, preferring its default
 * export over a sibling named helper. Never select a file's first story blindly. */
export function storyForComponent(stories, source) {
  return stories.find(story => story.components.some(component => component.source === source && component.symbol === 'default'))
    ?? stories.find(story => story.components.some(component => component.source === source));
}
