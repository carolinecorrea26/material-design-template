import {
  Dialog, DialogTitle, DialogContent, Button,
  Card, CardContent, Stack, Typography, Box, FormControl,
  InputLabel, Select, MenuItem, IconButton, Divider
} from "@mui/material";
import { Close as CloseIcon, ArrowRightAlt as ArrowRightAltIcon } from "@mui/icons-material";

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
  onBeginApplication: () => void;
  selectedCoverages: {
    term10: string;
    term20: string;
    wholeLife: string;
  };
  onCoverageChange: (coverages: {
    term10: string;
    term20: string;
    wholeLife: string;
  }) => void;
}

export default function QuoteModal({
  open,
  onClose,
  onBeginApplication,
  selectedCoverages,
  onCoverageChange
}: QuoteModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Your Life Insurance Quote
        </Typography>
        <IconButton
          edge="end"
          onClick={onClose}
          aria-label="close"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* 10-Year Term Life */}
          <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
                    10-Year Term Life Insurance
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, justifyContent: 'center' }}>
                  <Typography variant="h3" color="primary.light" sx={{ fontWeight: 700, fontSize: '2rem' }}>
                    $24.50
                  </Typography>
                  <Typography color="text.secondary">/ month</Typography>
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Coverage Amount</InputLabel>
                  <Select
                    value={selectedCoverages.term10}
                    label="Coverage Amount"
                    onChange={(e) => onCoverageChange({ ...selectedCoverages, term10: e.target.value })}
                  >
                    <MenuItem value="100000">$100,000</MenuItem>
                    <MenuItem value="250000">$250,000</MenuItem>
                    <MenuItem value="500000">$500,000</MenuItem>
                    <MenuItem value="750000">$750,000</MenuItem>
                    <MenuItem value="1000000">$1,000,000</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  fullWidth
                  endIcon={<ArrowRightAltIcon />}
                  onClick={onBeginApplication}
                >
                  Begin Application
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* 20-Year Term Life */}
          <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
                    20-Year Term Life Insurance
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, justifyContent: 'center' }}>
                  <Typography variant="h3" color="primary.light" sx={{ fontWeight: 700, fontSize: '2rem' }}>
                    $38.75
                  </Typography>
                  <Typography color="text.secondary">/ month</Typography>
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Coverage Amount</InputLabel>
                  <Select
                    value={selectedCoverages.term20}
                    label="Coverage Amount"
                    onChange={(e) => onCoverageChange({ ...selectedCoverages, term20: e.target.value })}
                  >
                    <MenuItem value="100000">$100,000</MenuItem>
                    <MenuItem value="250000">$250,000</MenuItem>
                    <MenuItem value="500000">$500,000</MenuItem>
                    <MenuItem value="750000">$750,000</MenuItem>
                    <MenuItem value="1000000">$1,000,000</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  fullWidth
                  endIcon={<ArrowRightAltIcon />}
                  onClick={onBeginApplication}
                >
                  Begin Application
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Whole Life */}
          <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
                    Whole Life Insurance
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, justifyContent: 'center' }}>
                  <Typography variant="h3" color="primary.light" sx={{ fontWeight: 700, fontSize: '2rem' }}>
                    $89.99
                  </Typography>
                  <Typography color="text.secondary">/ month</Typography>
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Coverage Amount</InputLabel>
                  <Select
                    value={selectedCoverages.wholeLife}
                    label="Coverage Amount"
                    onChange={(e) => onCoverageChange({ ...selectedCoverages, wholeLife: e.target.value })}
                  >
                    <MenuItem value="50000">$50,000</MenuItem>
                    <MenuItem value="100000">$100,000</MenuItem>
                    <MenuItem value="250000">$250,000</MenuItem>
                    <MenuItem value="500000">$500,000</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  fullWidth
                  endIcon={<ArrowRightAltIcon />}
                  onClick={onBeginApplication}
                >
                  Begin Application
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}