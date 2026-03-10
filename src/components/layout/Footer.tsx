import * as React from "react";
import { Box, Container, Typography, Link, Stack } from "@mui/material";
import { commonStyles } from "../../theme/commonStyles";
import { getClientBranding } from "../../config/clients";
import TermsOfUseModal from "../modals/TermsOfUseModal";
import PrivacyNoticeModal from "../modals/PrivacyNoticeModal";

export default function Footer() {
  const [showTermsOfUse, setShowTermsOfUse] = React.useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = React.useState(false);
  const branding = getClientBranding();

  return (
    <Box component="footer" sx={commonStyles.footer}>
      <Container sx={{ px: { xs: 3, sm: 3 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 4,
            // py: 4
          }}
        >
          {/* Left Column - Administered By */}
          <Box>
            <Stack spacing={1}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: "#798293",
                  fontSize: "0.875rem",
                }}
              >
                Administered By:
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#798293", fontSize: "0.75rem" }}
              >
                American Bar Endowment
                <br />
                321 North Clark Street
                <br />
                14th Floor
                <br />
                Chicago, Illinois 60654-7648
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#798293", fontSize: "0.75rem" }}
                >
                  <strong>Website:</strong>{" "}
                  <Link
                    href="http://abendowment.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: "primary.main", fontSize: "0.75rem" }}
                  >
                    abendowment.org
                  </Link>
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#798293", fontSize: "0.75rem" }}
                >
                  <strong>Phone:</strong>{" "}
                  <Link
                    href="tel:8006218981"
                    sx={{ color: "primary.main", fontSize: "0.75rem" }}
                  >
                    (800) 621-8981
                  </Link>
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#798293", fontSize: "0.75rem" }}
                >
                  <strong>Email:</strong>{" "}
                  <Link
                    href="mailto:information@abendowment.org"
                    sx={{ color: "primary.main", fontSize: "0.75rem" }}
                  >
                    information@abendowment.org
                  </Link>
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Box
                  component="img"
                  src={branding.logo}
                  alt={branding.logoAlt}
                  sx={{ height: 36, width: "auto" }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Middle Column - Underwritten By */}
          <Box>
            <Stack spacing={1}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: "#798293",
                  fontSize: "0.875rem",
                }}
              >
                Underwritten By:
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#798293", fontSize: "0.75rem" }}
              >
                New York Life Insurance Company
                <br />
                on Policy Form GMR
                <br />
                51 Madison Avenue
                <br />
                New York, New York 10010
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#798293", fontSize: "0.75rem" }}
                >
                  <Link
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsOfUse(true);
                    }}
                    sx={{
                      cursor: "pointer",
                      color: "primary.main",
                      fontSize: "0.75rem",
                    }}
                  >
                    NYL Terms of Use
                  </Link>
                  {" · "}
                  <Link
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPrivacyNotice(true);
                    }}
                    sx={{
                      cursor: "pointer",
                      color: "primary.main",
                      fontSize: "0.75rem",
                    }}
                  >
                    NYL Privacy Notice
                  </Link>
                </Typography>
              </Box>

              {/* NYL Logo and Ratings Side by Side */}
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  gap: 3,
                  alignItems: "flex-start",
                }}
              >
                {/* NYL Logo */}
                <Box sx={{ flexShrink: 0 }}>
                  <img
                    src="/brand/nyl/logo-cookie.svg"
                    alt="New York Life Logo"
                    style={{
                      height: "50px",
                      width: "auto",
                    }}
                  />
                </Box>

                {/* Ratings */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#798293",
                      fontSize: "0.75rem",
                      lineHeight: 1.6,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{ fontWeight: 700, fontSize: "0.875rem" }}
                    >
                      A++
                    </Box>{" "}
                    A.M. Best
                    <br />
                    <Box
                      component="span"
                      sx={{ fontWeight: 700, fontSize: "0.875rem" }}
                    >
                      AAA
                    </Box>{" "}
                    Fitch Ratings
                    <br />
                    <Box
                      component="span"
                      sx={{ fontWeight: 700, fontSize: "0.875rem" }}
                    >
                      Aa1
                    </Box>{" "}
                    Moody's Investors Service
                    <br />
                    <Box
                      component="span"
                      sx={{ fontWeight: 700, fontSize: "0.875rem" }}
                    >
                      AA+
                    </Box>{" "}
                    Standard & Poor's
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#798293",
                      display: "block",
                      mt: 1,
                      fontSize: "0.625rem",
                    }}
                  >
                    ¹ Third Party Rating Reports as of 09/30/2025.
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>

          {/* Right Column - Legal Disclosure */}
          <Box>
            <Stack spacing={2}>
              <Typography
                variant="body2"
                sx={{ fontSize: "0.75rem", color: "#798293" }}
              >
                New York Life Insurance Company is licensed/authorized to
                transact business in all of the 50 United States, the District
                of Columbia, Puerto Rico and Canada. However, not all group
                policies it underwrites are available in all jurisdictions.
                Please check the Coverage detail sections for current
                availability. New York Life Insurance Company's state of
                domicile is New York, and NAIC ID is #66915.
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontSize: "0.75rem", color: "#798293" }}
              >
                NEW YORK LIFE and the NEW YORK LIFE Box Logo are trademarks of
                New York Life Insurance Company.
              </Typography>
            </Stack>
          </Box>
        </Box>

        {/* Bottom Copyright */}
        {/* <Box sx={{ borderTop: 1, borderColor: 'rgba(255, 255, 255, 0.1)', py: 2, mt: 2 }}>
          <Typography variant="body2" align="center" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
            © {new Date().getFullYear()} New York Life Insurance Company
          </Typography>
        </Box> */}
      </Container>

      {/* Terms of Use Modal */}
      <TermsOfUseModal
        open={showTermsOfUse}
        onClose={() => setShowTermsOfUse(false)}
      />

      {/* Privacy Notice Modal */}
      <PrivacyNoticeModal
        open={showPrivacyNotice}
        onClose={() => setShowPrivacyNotice(false)}
      />
    </Box>
  );
}
