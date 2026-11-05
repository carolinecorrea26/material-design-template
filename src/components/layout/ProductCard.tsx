import { forwardRef, type ReactNode } from "react";
import { Link, Paper, Stack, Typography, type PaperProps } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import QuickDecisionIndicator from "../coverage/QuickDecisionIndicator";

const ProductSurface = styled(Paper, {
  shouldForwardProp: prop => prop !== "selected",
})<{ selected?: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(2.5),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  border: `1px solid ${selected ? theme.palette.success.main : theme.palette.divider}`,
  boxShadow: selected ? theme.shadows[1] : "none",
  ...(selected && { backgroundColor: alpha(theme.palette.success.main, 0.03) }),
}));

export type ProductCardProps = PaperProps & {
  selected?: boolean;
  productName?: ReactNode;
  description?: ReactNode;
  brochureUrl?: string;
  quickDecision?: boolean;
  titleAdornment?: ReactNode;
  headerAction?: ReactNode;
};

/** Shared product container and heading for shopping, beneficiary, payment and receipt flows. */
const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(function ProductCard({
  productName, description, brochureUrl, quickDecision, titleAdornment, headerAction, children, ...props
}, ref) {
  return <ProductSurface ref={ref} {...props}>
    {productName != null && <Stack spacing={0.25}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography variant="subtitle2" component="h4" sx={{ minWidth: 0, overflowWrap: "anywhere", fontWeight: 800 }}>
          {brochureUrl ? <Link href={brochureUrl} target="_blank" rel="noopener noreferrer" color="inherit" variant="inherit">{productName}</Link> : productName}
          {quickDecision && <QuickDecisionIndicator />}
          {titleAdornment}
        </Typography>
        {headerAction}
      </Stack>
      {description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
    </Stack>}
    {children}
  </ProductSurface>;
});

export default ProductCard;
