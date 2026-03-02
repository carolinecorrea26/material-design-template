import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  TextField,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  ArrowRightAlt as ArrowRightAltIcon,
  ShieldOutlined as ShieldIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import * as React from "react";

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
  onCoverageChange,
}: QuoteModalProps) {
  const [email, setEmail] = React.useState("");
  const [emailSent, setEmailSent] = React.useState(false);

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxWidth: { xs: "100%", sm: "600px", md: "900px", lg: "1200px" },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Your Insurance Quote
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
        <Stack spacing={4}>
          {/* Intro Section */}
          <Typography variant="body2" color="text.secondary">
            Based on the information you provided, here are your estimated
            monthly premiums for each coverage option. Select your desired
            coverage amount and begin your application to lock in these rates.
          </Typography>

          {/* Coverage Cards - Horizontal on large screens */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2.5,
              justifyContent: "center",
              "& > *": {
                flex: { xs: "1", md: "1 1 0" },
                maxWidth: { md: "400px" },
              },
            }}
          >
            {/* 10-Year Term Life */}
            <Card variant="outlined" sx={{ bgcolor: "grey.50" }}>
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <ShieldIcon
                      sx={{ color: "primary.main", fontSize: "1.25rem" }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      10-Year Term Life Insurance
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      color="primary.main"
                      sx={{ fontWeight: 700 }}
                    >
                      $24.50
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      / month
                    </Typography>
                  </Box>

                  <FormControl fullWidth size="small">
                    <InputLabel>Coverage Amount</InputLabel>
                    <Select
                      value={selectedCoverages.term10}
                      label="Coverage Amount"
                      onChange={(e) =>
                        onCoverageChange({
                          ...selectedCoverages,
                          term10: e.target.value,
                        })
                      }
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
                    size="medium"
                  >
                    Begin Application
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* 20-Year Term Life */}
            <Card variant="outlined" sx={{ bgcolor: "grey.50" }}>
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <ShieldIcon
                      sx={{ color: "primary.main", fontSize: "1.25rem" }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      20-Year Term Life Insurance
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      color="primary.main"
                      sx={{ fontWeight: 700 }}
                    >
                      $38.75
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      / month
                    </Typography>
                  </Box>

                  <FormControl fullWidth size="small">
                    <InputLabel>Coverage Amount</InputLabel>
                    <Select
                      value={selectedCoverages.term20}
                      label="Coverage Amount"
                      onChange={(e) =>
                        onCoverageChange({
                          ...selectedCoverages,
                          term20: e.target.value,
                        })
                      }
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
                    size="medium"
                  >
                    Begin Application
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Whole Life */}
            <Card variant="outlined" sx={{ bgcolor: "grey.50" }}>
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <ShieldIcon
                      sx={{ color: "primary.main", fontSize: "1.25rem" }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Whole Life Insurance
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      color="primary.main"
                      sx={{ fontWeight: 700 }}
                    >
                      $89.99
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      / month
                    </Typography>
                  </Box>

                  <FormControl fullWidth size="small">
                    <InputLabel>Coverage Amount</InputLabel>
                    <Select
                      value={selectedCoverages.wholeLife}
                      label="Coverage Amount"
                      onChange={(e) =>
                        onCoverageChange({
                          ...selectedCoverages,
                          wholeLife: e.target.value,
                        })
                      }
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
                    size="medium"
                  >
                    Begin Application
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Email This Quote Section */}
          {emailSent && (
            <Alert severity="success">Quote sent successfully to {email}</Alert>
          )}

          <Card variant="outlined">
            <CardContent sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Email This Quote
                </Typography>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={handleSendEmail}
                        disabled={!email}
                        edge="end"
                        color="primary"
                      >
                        <SendIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Disclosure */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center" }}
          >
            <sup>1</sup>Quoted cost is the best rate available based on the
            information you provided. Final cost may be based upon factors such
            as gender, health status, and use of tobacco/nicotine. Rates current
            as of 2025.
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
