import * as React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Menu,
  MenuItem,
  Link,
  Divider,
  ListSubheader,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Collapse,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { commonStyles } from "../../theme/commonStyles";
import { getClientBranding } from "../../config/clients";
import { getProducts } from "../../api/client";
import { COVERAGE_CATEGORY_LABELS } from "../../constants/coverage";
import type { Product, CoverageCategory } from "../../types/app";
import ResumeConfirmationDialog from "./ResumeConfirmationDialog";
import { useLayout } from "../../state/LayoutContext";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { layoutMode } = useLayout();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const branding = getClientBranding();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showResumeDialog, setShowResumeDialog] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [coverageMenuOpen, setCoverageMenuOpen] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // Fetch products on mount
  React.useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
  }, []);

  // Group products by category
  const productsByCategory = React.useMemo(() => {
    const grouped: Record<CoverageCategory, Product[]> = {
      LI: [],
      AD: [],
      DI: [],
      OO: [],
      SH: [],
    };

    products.forEach((product) => {
      grouped[product.category].push(product);
    });

    return grouped;
  }, [products]);

  const handleResumeClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Determine if we should show the modal
    const isOnLandingPage =
      location.pathname === "/" || location.pathname === "/landing";
    const shouldShowModal =
      layoutMode === "single-page" ||
      (layoutMode === "multi-page" && !isOnLandingPage);

    if (shouldShowModal) {
      setShowResumeDialog(true);
    } else {
      // Multi-page layout on landing page: navigate directly
      navigate("/resume");
    }
  };

  const handleResumeConfirm = () => {
    setShowResumeDialog(false);
    navigate("/resume");
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ maxWidth: 1400, width: "100%", mx: "auto" }}>
        {/* Client logo(s) with home link */}
        <Link component={RouterLink} to="/" sx={commonStyles.unstyledLink}>
          <Box
            component="img"
            src={branding.logo}
            alt={branding.logoAlt}
            sx={commonStyles.logo}
          />
        </Link>

        <Box sx={commonStyles.flexGrow} />

        {/* Mobile: Hamburger Menu */}
        {isMobile ? (
          <>
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ color: "text.primary" }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            >
              <Box sx={{ width: 280, pt: 2 }}>
                <List>
                  {/* Coverage Details Section */}
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => setCoverageMenuOpen(!coverageMenuOpen)}
                    >
                      <ListItemText primary="Coverage Details" />
                      {coverageMenuOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={coverageMenuOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {/* Dynamic product sections */}
                      {(
                        Object.keys(productsByCategory) as CoverageCategory[]
                      ).map((category) => {
                        const categoryProducts = productsByCategory[category];
                        if (categoryProducts.length === 0) return null;

                        return (
                          <React.Fragment key={category}>
                            <ListSubheader>
                              {COVERAGE_CATEGORY_LABELS[category]}
                            </ListSubheader>
                            {categoryProducts.map((product) => (
                              <ListItem key={product.id} disablePadding>
                                <ListItemButton
                                  component={Link}
                                  href={`https://d160mojjx9yhiu.cloudfront.net/pdfs/4591/abe-tl-overview.pdf`}
                                  target="_blank"
                                  sx={commonStyles.nestedListItem}
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <ListItemText
                                    primary={product.name}
                                    primaryTypographyProps={{
                                      fontSize: "0.875rem",
                                    }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                            <Divider sx={commonStyles.dividerSpacing} />
                          </React.Fragment>
                        );
                      })}
                    </List>
                  </Collapse>

                  <Divider sx={commonStyles.dividerSpacing} />

                  {/* Resume Application */}
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setMobileMenuOpen(false);

                        // Same logic as desktop
                        const isOnLandingPage =
                          location.pathname === "/" ||
                          location.pathname === "/landing";
                        const shouldShowModal =
                          layoutMode === "single-page" ||
                          (layoutMode === "multi-page" && !isOnLandingPage);

                        if (shouldShowModal) {
                          setShowResumeDialog(true);
                        } else {
                          navigate("/resume");
                        }
                      }}
                    >
                      <ListItemText primary="Resume Application" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <>
            {/* Desktop: Coverage Details Menu */}
            <Link
              component="button"
              onClick={handleOpen}
              sx={{
                color: "text.primary",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": {
                  color: "primary.main",
                  textDecoration: "none",
                },
              }}
            >
              Coverage Details
              <KeyboardArrowDownIcon />
            </Link>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  maxWidth: 360,
                  "& .MuiListSubheader-root": {
                    bgcolor: "background.paper",
                    lineHeight: "32px",
                    mt: 1,
                    color: "primary.main",
                    fontWeight: 600,
                  },
                  "& .MuiMenuItem-root": {
                    minHeight: "auto",
                    py: 1,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    "&.MuiLink-root": {
                      color: "text.primary",
                      textDecoration: "none",
                    },
                  },
                },
              }}
            >
              {/* Dynamic product sections */}
              {(Object.keys(productsByCategory) as CoverageCategory[]).map(
                (category, index) => {
                  const categoryProducts = productsByCategory[category];
                  if (categoryProducts.length === 0) return null;

                  return (
                    <React.Fragment key={category}>
                      <ListSubheader>
                        {COVERAGE_CATEGORY_LABELS[category]}
                      </ListSubheader>
                      {categoryProducts.map((product) => (
                        <MenuItem
                          key={product.id}
                          component={Link}
                          href="https://d160mojjx9yhiu.cloudfront.net/pdfs/4591/abe-tl-overview.pdf"
                          target="_blank"
                          onClick={handleClose}
                        >
                          {product.name}
                        </MenuItem>
                      ))}
                      {index < Object.keys(productsByCategory).length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  );
                },
              )}
            </Menu>

            {/* Desktop: Resume Application */}
            <Link
              component="button"
              onClick={handleResumeClick}
              sx={{
                color: "text.primary",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": {
                  color: "primary.main",
                  textDecoration: "none",
                },
              }}
            >
              Resume Application
            </Link>
          </>
        )}

        {/* Resume confirmation dialog */}
        <ResumeConfirmationDialog
          open={showResumeDialog}
          onClose={() => setShowResumeDialog(false)}
          onConfirm={handleResumeConfirm}
        />
      </Toolbar>
    </AppBar>
  );
}
