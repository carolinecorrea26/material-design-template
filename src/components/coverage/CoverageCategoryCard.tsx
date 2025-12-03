import {
  Card, CardContent, Stack, Typography, Box, Link
} from '@mui/material';
import CoverageIcon, { getCoverageLabel } from '../../utils/coverageIcons';
import type { CoverageCategory } from '../../types/app';
import { commonStyles } from '../../theme/commonStyles';

interface CoverageCategoryCardProps {
  category: CoverageCategory;
  description: string;
  products: Array<{
    name: string;
    quickDecision?: boolean;
    href?: string;
  }>;
  backgroundColor?: string;
}

const categoryBackgroundColors: Record<CoverageCategory, string> = {
  'LI': 'white',
  'DI': 'white',
  'OO': 'white',
  'SH': 'white',
};

export default function CoverageCategoryCard({
  category,
  description,
  products,
  backgroundColor
}: CoverageCategoryCardProps) {
  const bgColor = backgroundColor || categoryBackgroundColors[category];

  return (
    <Card
      sx={{
        bgcolor: bgColor,
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {getCoverageLabel(category)}
            </Typography>
          </Box>
          <Typography color="text.secondary">
            {description}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Coverage Details:
            </Typography>
          <Stack spacing={1} sx={{ pt: 1 }}>
            {products.map((product, index) => (
              <Box
                key={index}
                sx={commonStyles.coverageProductItem}
              >
                <Typography sx={commonStyles.coverageBulletPoint}>•</Typography>
                <Link
                  href={product.href || "#"}
                  underline="hover"
                  sx={commonStyles.primaryLink}
                >
                  {product.name}
                </Link>
              </Box>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}