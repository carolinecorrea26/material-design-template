import * as React from "react";
import { 
  Box, Container, Stack, Typography, Button, Card, CardContent,
  TextField, MenuItem, Chip, Switch
} from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowRightAlt as ArrowRightAltIcon,
  VerifiedUserOutlined as VerifiedUserOutlinedIcon
} from "@mui/icons-material";
import { getClientBranding, getClientFeatures } from "../config/clients";
import CoverageCategoryCard from "../components/coverage/CoverageCategoryCard";
import RadioGroup from "../components/form/RadioGroup";
import QuoteModal from "../components/coverage/QuoteModal";
import { commonStyles } from "../theme/commonStyles";
import { getProducts } from "../api/client";
import type { Product, CoverageCategory } from "../types/app";

// US States constant
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", 
  "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", 
  "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
  "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", 
  "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming", "U.S. Armed Forces Pacific", "U.S. Armed Forces Americas"
];

// Rating badge data
const RATINGS = [
  { rating: "A++", agency: "A.M. Best" },
  { rating: "AAA", agency: "Fitch Ratings" },
  { rating: "Aa1", agency: "Moody's Investors Service" },
  { rating: "AA+", agency: "Standard & Poor's" }
];

interface LandingProps {
  hideNonHero?: boolean;
}

