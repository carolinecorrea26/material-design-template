import { getPrototypeLibrary } from '../domain/prototypeLibrary';
import { requirementPageHelp } from "../domain/requirementContent";
import { Box, Stack, Link, Typography } from "@mui/material";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CreditCardOffRoundedIcon from "@mui/icons-material/CreditCardOffRounded";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import type { PageHelpItem } from "../components/content/PageHelpChips";
import CoverageOptionsPanel from "../app/sections/ConfiguredCoverageOptionsPanel";
import HowApplyingWorksPanel from "../components/home/HowApplyingWorksPanel";
import { getContent, resolveTemplate } from "./index";
import type { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageCategoryId,
  CoverageDefinition,
} from "../config/coverages/types";

type CoverageProductGroup = {
  category: (typeof coverageCategories)[number];
  products: CoverageDefinition[];
};

export { default as ApplicationReviewDrawerContent } from "../components/content/ApplicationReviewDrawerContent";

export function GroupInsuranceDrawerContent({
  associationName,
}: {
  associationName: string;
}) {
  const groupHelp = getContent().help.groupInsurance;
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {resolveTemplate(groupHelp.intro).replace(
          /\{\{associationName\}\}/g,
          associationName,
        )}
      </Typography>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {groupHelp.exploreTitle}
        </Typography>

        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          {groupHelp.exploreItems.map((item, i) => (
            <Typography
              key={i}
              component="li"
              variant="body2"
              color="text.secondary"
            >
              {item}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

export function CoverageProductsDrawerContent({
  productsByCategory,
}: {
  productsByCategory: CoverageProductGroup[];
}) {
  return (
    <Stack spacing={2.25}>
      <Typography variant="body2" color="text.secondary">
        These products are available through this group. You can review and
        select coverage options later in the application.
      </Typography>

      <Stack spacing={2}>
        {productsByCategory.map(({ category, products }) => (
          <Box key={category.id}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
              {category.label}
            </Typography>

            <Stack spacing={0.75}>
              {products.map((product) => (
                <Link
                  key={product.id}
                  href="#"
                  onClick={(event) => event.preventDefault()}
                  sx={{
                    width: "fit-content",
                    color: "primary.main",
                    fontSize: "0.875rem",
                    lineHeight: 1.35,
                    textUnderlineOffset: "0.15em",
                  }}
                >
                  {product.name}
                </Link>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

export function CoverageOptionsDrawerContent({
  initialCategory,
}: { initialCategory?: CoverageCategoryId } = {}) {
  return (
    <CoverageOptionsPanel variant="drawer" initialCategory={initialCategory} />
  );
}

function HelpParagraphs({ paragraphs }: { paragraphs: string[] }) {
  return <Stack spacing={2}>{paragraphs.map((paragraph, index) => <Typography key={index} variant="body2">{paragraph}</Typography>)}</Stack>;
}

function HelpSections({ intro, sections, icons }: { intro: string; sections: Array<{ title: string; description: string }>; icons: Array<typeof InfoRoundedIcon> }) {
  return <Stack spacing={3}>
    <Typography variant="body2" color="text.secondary">{intro}</Typography>
    {sections.map((section, index) => {
      const Icon = icons[index] ?? InfoRoundedIcon;
      return <Box key={index} sx={{ display: 'flex', gap: 2 }}>
        <Icon sx={{ color: 'primary.main', fontSize: '2.5rem', flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{section.title}</Typography>
          <Typography variant="body2" color="text.secondary">{section.description}</Typography>
        </Box>
      </Box>;
    })}
  </Stack>;
}

const pageHelpBodies: Record<string, () => React.ReactNode> = {
  'coverage-options-available': () => <CoverageOptionsDrawerContent />,
  'application-process': () => <HowApplyingWorksPanel variant="drawer" />,
  'beneficiary-basics': () => <HelpParagraphs paragraphs={getContent().help.beneficiary.whatIs.paragraphs} />,
  'beneficiary-share': () => <HelpParagraphs paragraphs={getContent().help.beneficiary.percentageShare.paragraphs} />,
  'payment-handling': () => <HelpSections {...getContent().help.paymentHandling} icons={[CreditCardOffRoundedIcon, LockRoundedIcon, LoopRoundedIcon, DeleteOutlineRoundedIcon]} />,
};

/** Source selections/wording plus shared topic content; evaluated for the current Site. */
export function pageHelpItems(pageId: string): PageHelpItem[] {
  const library = getPrototypeLibrary();
  const topics = library ? library.pages.find(page => page.definition.id === pageId)?.definition.help : requirementPageHelp(pageId);
  if (!topics) throw new Error(`Missing fresh-start page help: ${pageId}`);
  return topics.map(item => {
    const body = pageHelpBodies[item.id];
    if (!body) throw new Error(`Unsupported page help topic: ${item.id}`);
    return { ...item, content: body() };
  });
}
