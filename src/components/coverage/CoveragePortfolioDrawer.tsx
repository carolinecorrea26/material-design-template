import * as React from "react";
import {
  Drawer,
  Box,
  Typography,
  Stack,
  Divider,
  IconButton,
  Chip,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useAppData } from "../../state/AppDataContext";
import { getProducts } from "../../api/client";
import type { Product, SelectedItem } from "../../types/app";

interface CoveragePortfolioDrawerProps {
  open: boolean;
  onClose: () => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

const getMockMonthly = (item: SelectedItem) => {
  const baseRate = 0.12;
  return Number(((item.amount / 1000) * baseRate).toFixed(2));
};

export default function CoveragePortfolioDrawer({
  open,
  onClose,
}: CoveragePortfolioDrawerProps) {
  const { data } = useAppData();
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await getProducts();
        if (mounted) setProducts(result);
      } catch {
        if (mounted) setProducts([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const productMap = React.useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const selections = data.coverage ?? [];
  const total = selections.reduce((sum, item) => sum + getMockMonthly(item), 0);

  return (
    <Drawer anchor="top" open={open} onClose={onClose}>
      <Box sx={{ width: "100%", maxHeight: "70vh", p: 3, overflowY: "auto" }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Coverage Portfolio
            </Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Estimated monthly cost based on mock pricing.
          </Typography>
          <Divider />

          {selections.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No coverage selections yet.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {selections.map((item, index) => {
                const product = productMap.get(item.productId);
                const monthly = getMockMonthly(item);
                return (
                  <Box
                    key={`${item.productId}-${item.applicant}-${index}`}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 2,
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {product?.name ?? item.productId}
                        </Typography>
                        <Chip
                          label={item.applicant}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Amount: {formatCurrency(item.amount)}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        Est. Monthly: {formatCurrency(monthly)}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}

              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={600}>
                  Total
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {formatCurrency(total)}
                </Typography>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
}
