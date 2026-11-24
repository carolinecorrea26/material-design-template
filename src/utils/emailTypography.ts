import presentation from '../../requirements/global/presentation-tokens.json';

/** Inline styles are required because email frames do not inherit app styles. */
export const emailTypography = presentation.email;
export const emailBodyTextStyle = {
  fontFamily: emailTypography.fontFamily,
  fontSize: emailTypography.body.fontSize,
  lineHeight: emailTypography.body.lineHeight,
};
export const emailBodyCss = `font-family:${emailTypography.fontFamily}; font-size:${emailTypography.body.fontSize}px; line-height:${emailTypography.body.lineHeight};`;
