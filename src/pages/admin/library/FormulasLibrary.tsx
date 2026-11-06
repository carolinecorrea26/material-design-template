import { Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import pricing from "../../../../requirements/global/formulas/pricing.json";

type Rate = { basis: string; rate: number };
type Formula = { id: string; name: string; status: string; authority: string; type: string; statement: string; source: string; [key: string]: unknown };

export const formulas: Formula[] = pricing.formulas;

const rateText = ({ basis, rate }: Rate) => basis === "per-thousand" ? `$${rate.toFixed(2)} per $1,000` : `${rate}% of amount`;

/** Plain-language summary of a formula record's values. */
export function formulaValues(formula: Formula): string {
  if (formula.type === "category-rates") {
    const categories = Object.entries(formula.categories as Record<string, Rate>).map(([category, rate]) => `${category}: ${rateText(rate)}`);
    return [...categories, `Other categories: ${rateText(formula.default as Rate)}`, `Minimum: $${(formula.minimumMonthly as number).toFixed(2)}/mo`].join("; ");
  }
  if (formula.type === "rider-factor") return "Priced on the rider amount, or the base amount when the rider has no amount, times the rider premium factor";
  if (formula.type === "frequency-factors") return Object.entries(formula.factors as Record<string, number>).map(([frequency, months]) => `${frequency} ×${months}`).join("; ");
  return "";
}

/** Formula records from requirements/global/formulas. Mock formulas stand in until actual rate requirements exist. */
export default function FormulasLibrary() {
  return <TableContainer>
    <Table size="small" aria-label="Formulas">
      <TableHead><TableRow><TableCell>Formula</TableCell><TableCell>Status</TableCell><TableCell>Authority</TableCell><TableCell>Statement</TableCell><TableCell>Values</TableCell></TableRow></TableHead>
      <TableBody>{formulas.map(formula => <TableRow key={formula.id}>
        <TableCell sx={{ verticalAlign: "top" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formula.name}</Typography>
          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{formula.id}</Typography>
        </TableCell>
        <TableCell sx={{ verticalAlign: "top" }}>{formula.status}</TableCell>
        <TableCell sx={{ verticalAlign: "top" }}><Chip size="small" label={formula.authority === "mock" ? "Mock" : "Requirement"} color={formula.authority === "mock" ? "warning" : "success"} variant="outlined" /></TableCell>
        <TableCell sx={{ verticalAlign: "top" }}>{formula.statement}</TableCell>
        <TableCell sx={{ verticalAlign: "top" }}>{formulaValues(formula)}</TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </TableContainer>;
}
