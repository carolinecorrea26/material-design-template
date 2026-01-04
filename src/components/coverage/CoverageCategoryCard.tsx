import {
  Card, CardContent, Stack, Typography, Box, Chip, Link
} from '@mui/material';
import { Circle as CircleIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { getCoverageLabel } from '../../utils/coverageIcons';
import type { CoverageCategory } from '../../types/app';

interface CoverageCategoryCardProps {
  category: CoverageCategory;
  description: string;
  products: Array<{
    name: string;
    quickDecision?: boolean;
    href?: string;
  }>;
  backgroundColor?: string;
  brochureUrl?: string;
}

export default function CoverageCategoryCard({
  category,
  description,
  products,
  brochureUrl
}: CoverageCategoryCardProps) {
  // Check if any product has quickDecision (for life or disability)
  const hasQuickDecision = products.some(p => p.quickDecision);
  const isLifeOrDisability = category === 'LI' || category === 'DI';

  return (
    <Card
      sx={{
        bgcolor: 'white',
        boxShadow: 1
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Title with QuickDecision chip */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography 
              variant="h5" 
              component="h2"
              sx={{ 
                fontSize: '20px',
                fontWeight: 700
              }}
            >
              {getCoverageLabel(category)}
            </Typography>
            {isLifeOrDisability && hasQuickDecision && (
              <Chip
                label="QuickDecision"
                size="small"
                sx={{
                  bgcolor: '#e8f5e9',
                  color: '#2e7d32',
                  fontSize: '12px',
                  fontWeight: 600,
                  height: 'auto',
                  py: 0.5,
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            )}
          </Box>

          {/* Description */}
          <Typography 
            color="text.secondary"
            sx={{
              fontSize: '14px',
              lineHeight: 1.6
            }}
          >
            {description}
          </Typography>

          {/* Coverage Options Label */}
          <Typography 
            sx={{ 
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'text.primary',
              mt: 1
            }}
          >
            COVERAGE OPTIONS
          </Typography>

          {/* Product List */}
          <Stack spacing={0.5}>
            {products.map((product, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1
                }}
              >
                <CircleIcon sx={{ fontSize: 8, color: 'primary.main', mt: 0.75, flexShrink: 0 }} />
                <Link
                  href={product.href || '#'}
                  sx={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
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