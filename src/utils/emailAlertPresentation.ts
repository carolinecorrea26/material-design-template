import { emailBodyTextStyle } from './emailTypography';
import type { CSSProperties } from 'react';
import { darken, lighten, type Theme } from '@mui/material/styles';

/** Static email fragments cannot depend on the parent document's Emotion sheet.
 * Keep the standard MUI Alert and its slots, with theme-derived inline styles. */
export function emailAlertPresentation(theme: Theme, severity: 'info' | 'warning') {
  const color = theme.palette[severity];
  const foreground = theme.palette.mode === 'light' ? darken : lighten;
  const background = theme.palette.mode === 'light' ? lighten : darken;
  return {
    style: {
      ...emailBodyTextStyle,
      display: 'flex', padding: '6px 16px', boxSizing: 'border-box',
      width: '100%', borderRadius: theme.shape.borderRadius,
      color: foreground(color.light, 0.6), backgroundColor: background(color.light, 0.9),
      overflowWrap: 'anywhere',
    } as CSSProperties,
    slotProps: {
      icon: { style: { display: 'flex', marginRight: 12, padding: '7px 0', fontSize: 22, opacity: 0.9, color: color.main } as CSSProperties },
      message: { style: { padding: '8px 0', minWidth: 0, overflow: 'auto' } as CSSProperties },
    },
  };
}

export function emailAlertTitleStyle(theme: Theme): CSSProperties {
  return { ...emailBodyTextStyle, fontWeight: theme.typography.fontWeightMedium, margin: '-2px 0 0.35em' };
}
