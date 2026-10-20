import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import { TableHead, TableRow, TableCell } from '@mui/material';
import { libraryDisplayId } from '../../domain/provenance';

function cellText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return isValidElement<{ children?: ReactNode }>(node) ? Children.toArray(node.props.children).map(cellText).join('') : '';
}

/** One primary ID column, last. Natural keys remain in data/search, not duplicate ID columns. */
export function withLibraryMetadata(children: ReactNode, table: string): ReactNode {
  const identityColumns = new Set<number>();
  function inspect(nodes: ReactNode, header = false) {
    Children.forEach(nodes, node => {
      if (!isValidElement<{ children?: ReactNode }>(node)) return;
      const isHeader = header || node.type === TableHead;
      if (node.type === TableRow && isHeader) Children.toArray(node.props.children).forEach((cell, index) => {
        if (/^(?:.+\s)?ID(?:\s*#)?$/i.test(cellText(cell).trim())) identityColumns.add(index);
      });
      else inspect(node.props.children, isHeader);
    });
  }
  inspect(children);
  function visit(nodes: ReactNode, header = false): ReactNode {
    return Children.map(nodes, node => {
      if (!isValidElement<{ children?: ReactNode; colSpan?: number }>(node)) return node;
      const isHeader = header || node.type === TableHead;
      if (node.type === 'colgroup') return cloneElement(node, {}, Children.toArray(node.props.children).filter((_, index) => !identityColumns.has(index)), <col style={{ width: 170 }} />);
      if (node.type === TableRow && (isHeader || node.key !== null)) {
        const original = Children.toArray(node.props.children);
        if (original.some(c => isValidElement<{ colSpan?: number }>(c) && c.props.colSpan)) return node;
        return cloneElement(node, {}, original.filter((_, index) => !identityColumns.has(index)), <TableCell>{isHeader ? 'ID #' : libraryDisplayId(table, String(node.key))}</TableCell>);
      }
      return node.props.children ? cloneElement(node, {}, visit(node.props.children, isHeader)) : node;
    });
  }
  return visit(children);
}
