import { useState } from "react";
import { Box, Link, Stack, Typography } from "@mui/material";
import type { ClientConfig } from "../../config/clients/types";

type AppFooterProps = {
  client: ClientConfig;
};

export default function AppFooter({ client }: AppFooterProps) {
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  return (
    <Box
      component="footer"
      sx={{
        mt: 4,
        py: 4,
        px: { xs: 2, sm: 3, md: 4 },
        // backgroundColor: "#f2f4f8",
        color: "#798293",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1400,
          marginLeft: "auto",
          marginRight: "auto",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr)",
          },
          gap: 2,
        }}
      >
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
              {client.branding.name}
              {client.support.address?.street && (
                <>
                  <br />
                  {client.support.address.street}
                </>
              )}
              {client.support.address?.city && (
                <>
                  <br />
                  {client.support.address.city}
                  {client.support.address.state &&
                    `, ${client.support.address.state}`}
                  {client.support.address.zip &&
                    ` ${client.support.address.zip}`}
                </>
              )}
            </Typography>

            <Box sx={{ mt: 2 }}>
              {client.support.website && (
                <Typography
                  variant="body2"
                  sx={{ color: "#798293", fontSize: "0.75rem" }}
                >
                  <strong>Website:</strong>{" "}
                  <Link
                    href={`https://${client.support.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: "primary.main", fontSize: "0.75rem" }}
                  >
                    {client.support.website}
                  </Link>
                </Typography>
              )}

              {(client.support.phoneDisplay ?? client.support.phone) && (
                <Typography
                  variant="body2"
                  sx={{ color: "#798293", fontSize: "0.75rem" }}
                >
                  <strong>Phone:</strong>{" "}
                  <Link
                    href={`tel:${client.support.phone}`}
                    sx={{ color: "primary.main", fontSize: "0.75rem" }}
                  >
                    {client.support.phoneDisplay ?? client.support.phone}
                  </Link>
                </Typography>
              )}

              {client.support.email && (
                <Typography
                  variant="body2"
                  sx={{ color: "#798293", fontSize: "0.75rem" }}
                >
                  <strong>Email:</strong>{" "}
                  <Link
                    href={`mailto:${client.support.email}`}
                    sx={{ color: "primary.main", fontSize: "0.75rem" }}
                  >
                    {client.support.email}
                  </Link>
                </Typography>
              )}
            </Box>

            {/* <Box sx={{ mt: 2 }}>
              <Box
                component="img"
                src={client.branding.logo}
                alt={client.branding.logoAlt}
                sx={{ height: 36, width: "auto" }}
              />
            </Box> */}
          </Stack>
        </Box>

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
                  onClick={(event) => {
                    event.preventDefault();
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
                  onClick={(event) => {
                    event.preventDefault();
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

            <Box
              sx={{
                mt: 2,
                display: "flex",
                gap: 3,
                alignItems: "flex-start",
              }}
            >
              <Box sx={{ flexShrink: 0 }}>
                <Box
                  component="img"
                  src="/logo.svg"
                  alt="New York Life Logo"
                  sx={{
                    height: 50,
                    width: "auto",
                  }}
                />
              </Box>

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
                  Moody&apos;s Investors Service
                  <br />
                  <Box
                    component="span"
                    sx={{ fontWeight: 700, fontSize: "0.875rem" }}
                  >
                    AA+
                  </Box>{" "}
                  Standard &amp; Poor&apos;s
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
                  1 Third Party Rating Reports as of 09/30/2025.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>

        <Box>
          <Stack spacing={2}>
            <Typography
              variant="body2"
              sx={{ fontSize: "0.75rem", color: "#798293" }}
            >
              New York Life Insurance Company is licensed/authorized to transact
              business in all of the 50 United States, the District of Columbia,
              Puerto Rico and Canada. However, not all group policies it
              underwrites are available in all jurisdictions. Please check the
              Coverage detail sections for current availability. New York Life
              Insurance Company&apos;s state of domicile is New York, and NAIC
              ID is #66915.
            </Typography>

            <Typography
              variant="body2"
              sx={{ fontSize: "0.75rem", color: "#798293" }}
            >
              NEW YORK LIFE and the NEW YORK LIFE Box Logo are trademarks of New
              York Life Insurance Company.
            </Typography>
          </Stack>
        </Box>
      </Box>

      {showTermsOfUse && (
        <Box sx={{ display: "none" }} aria-hidden>
          Terms of Use modal placeholder
        </Box>
      )}

      {showPrivacyNotice && (
        <Box sx={{ display: "none" }} aria-hidden>
          Privacy Notice modal placeholder
        </Box>
      )}
    </Box>
  );
}
