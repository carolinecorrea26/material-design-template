import { useEffect, useState } from "react";
import { Box, Link, Stack, Typography } from "@mui/material";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import type { ClientConfig } from "../../config/clients/types";
import { getContent } from "../../content";
import AppModal from "../ui/AppModal";
import LegalDocViewer from "../ui/LegalDocViewer";

type AppFooterProps = {
  client: ClientConfig;
};

export default function AppFooter({ client }: AppFooterProps) {
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const footerContent = getContent().footer;

  useEffect(() => {
    const handleOpenPrivacyNotice = () => setShowPrivacyNotice(true);
    window.addEventListener("app:open-privacy-notice", handleOpenPrivacyNotice);

    return () => {
      window.removeEventListener(
        "app:open-privacy-notice",
        handleOpenPrivacyNotice,
      );
    };
  }, []);

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
            sm: "1fr",
            md: "1fr minmax(0, 1fr)",
            lg: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr)",
          },
          gap: 2,
        }}
      >
        {/* Column 1: Administered by (client-specific) */}
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

            <Stack sx={{ mt: 2 }} spacing={0.75}>
              {client.support.website && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <LanguageOutlinedIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                  <Link
                    href={`https://${client.support.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    variant="caption"
                  >
                    {client.support.website}
                  </Link>
                </Stack>
              )}

              {client.support.email && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmailOutlinedIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                  <Link
                    href={`mailto:${client.support.email}`}
                    underline="hover"
                    variant="caption"
                  >
                    {client.support.email}
                  </Link>
                </Stack>
              )}

              {(client.support.phoneDisplay ?? client.support.phone) && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneOutlinedIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                  <Link
                    href={`tel:${client.support.phone}`}
                    underline="hover"
                    variant="caption"
                  >
                    {client.support.phoneDisplay ?? client.support.phone}
                  </Link>
                </Stack>
              )}

              {client.support.phoneHours && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccessTimeOutlinedIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {client.support.phoneHours}
                  </Typography>
                </Stack>
              )}
            </Stack>

            {client.licenseInfo && client.licenseInfo.length > 0 && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                {client.licenseInfo.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < client.licenseInfo!.length - 1 && <br />}
                  </span>
                ))}
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Column 2: Underwritten by (global NYL content) */}
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
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ whiteSpace: "nowrap" }}
              >
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

            {/* NYL ratings logo — global, not client-configurable */}
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
                  sx={{ display: "block", mt: 1, fontSize: "0.75rem" }}
                >
                  <sup>{footerContent.ratingsAsOf.split(" ")[0]}</sup>{" "}
                  {footerContent.ratingsAsOf.split(" ").slice(1).join(" ")}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Column 3: Legal disclosures */}
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

      {/* Terms of Use modal */}
      <AppModal
        open={showTermsOfUse}
        onClose={() => setShowTermsOfUse(false)}
        title={footerContent.termsOfUseContent.title}
        maxWidth={700}
        actions={[
          {
            label: "Close",
            onClick: () => setShowTermsOfUse(false),
            variant: "contained",
          },
        ]}
      >
        <LegalDocViewer doc={footerContent.termsOfUseContent} />
      </AppModal>

      {/* Privacy Notice modal */}
      <AppModal
        open={showPrivacyNotice}
        onClose={() => setShowPrivacyNotice(false)}
        title={footerContent.privacyNoticeContent.title}
        maxWidth={700}
        actions={[
          {
            label: "Close",
            onClick: () => setShowPrivacyNotice(false),
            variant: "contained",
          },
        ]}
      >
        <LegalDocViewer doc={footerContent.privacyNoticeContent} />
      </AppModal>
    </Box>
  );
}
