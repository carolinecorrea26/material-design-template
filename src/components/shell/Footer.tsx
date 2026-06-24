import { useState } from "react";
import { Box, Link, Stack, Typography } from "@mui/material";
import type { ClientConfig } from "../../config/clients/types";
import { getContent } from "../../content";

type AppFooterProps = {
  client: ClientConfig;
};

export default function AppFooter({ client }: AppFooterProps) {
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const footerContent = getContent().footer;

  return (
    <Box
      component="footer"
      sx={{
        mt: 4,
        py: 4,
        px: { xs: 2, sm: 3, md: 4 },
        color: "text.secondary",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1200,
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
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {footerContent.administeredByLabel}
            </Typography>

            <Typography variant="caption" color="text.secondary">
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
                <Typography variant="caption" color="text.secondary">
                  <strong>Website:</strong>{" "}
                  <Link
                    href={`https://${client.support.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {client.support.website}
                  </Link>
                </Typography>
              )}

              {(client.support.phoneDisplay ?? client.support.phone) && (
                <Typography variant="caption" color="text.secondary">
                  <strong>Phone:</strong>{" "}
                  <Link href={`tel:${client.support.phone}`}>
                    {client.support.phoneDisplay ?? client.support.phone}
                  </Link>
                </Typography>
              )}

              {client.support.email && (
                <Typography variant="caption" color="text.secondary">
                  <strong>Email:</strong>{" "}
                  <Link href={`mailto:${client.support.email}`}>
                    {client.support.email}
                  </Link>
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <Box>
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {footerContent.underwrittenBy.label}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {footerContent.underwrittenBy.name}
              <br />
              {footerContent.underwrittenBy.policyForm}
              <br />
              {footerContent.underwrittenBy.address
                .split("\n")
                .map((line, i) => (
                  <span key={i}>
                    {line}
                    {i <
                      footerContent.underwrittenBy.address.split("\n").length -
                        1 && <br />}
                  </span>
                ))}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                <Link
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setShowTermsOfUse(true);
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  {footerContent.links.termsOfUse}
                </Link>
                {" · "}
                <Link
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setShowPrivacyNotice(true);
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  {footerContent.links.privacyNotice}
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
                  sx={{ height: 50, width: "auto" }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ lineHeight: 1.6 }}>
                  {footerContent.ratings.map(({ grade, source }, i) => (
                    <span key={grade}>
                      {i > 0 && <br />}
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        {grade}
                      </Box>{" "}
                      {source}
                    </span>
                  ))}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 1, fontSize: "0.625rem" }}
                >
                  {footerContent.ratingsAsOf}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>

        <Box>
          <Stack spacing={2}>
            {footerContent.legal.map((text, i) => (
              <Typography key={i} variant="caption" color="text.secondary">
                {text}
              </Typography>
            ))}
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
