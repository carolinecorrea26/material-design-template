import { useState } from "react";
import { Alert, Box, FormControl, InputLabel, MenuItem, Paper, Select, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { analyticsService } from "../../services/analyticsService";
import { useServiceData } from "../../hooks/useServiceData";
import type { AnalyticsMeasurement, AnalyticsMetric } from "../../persistence/types";
import { Section, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import ResponsiveTableContainer from "../../components/docs/ResponsiveTableContainer";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const colors = { current: "#1565c0", prior: "#90caf9" };
const formatValue = (value: number, unit: AnalyticsMetric["unit"]) => unit === "percent" ? `${value.toFixed(1)}%` : Math.round(value).toLocaleString();
const portfolio = (rows: AnalyticsMeasurement[]) => rows.filter((row) => !row.siteId && !row.clientId && !row.device);
const yearOf = (row: AnalyticsMeasurement) => Number(row.periodStart.slice(0, 4));

function totalFor(rows: AnalyticsMeasurement[], metricKey: string, year: number) {
  const matching = portfolio(rows).filter((row) => row.metricKey === metricKey && yearOf(row) === year);
  return matching.find((row) => row.periodType === "ytd")?.value ?? matching.filter((row) => row.periodType === "month").reduce((sum, row) => sum + row.value, 0);
}

function KpiCard({ label, value, delta, favorable }: { label: string; value: string; delta: string; favorable?: boolean }) {
  const color = favorable === undefined ? "text.secondary" : favorable ? "success.main" : "error.main";
  return <Paper variant="outlined" sx={{ p: 2, minHeight: 126 }}>
    <Typography variant="overline" color="text.secondary" sx={{ display: "block", fontWeight: 800 }}>{label}</Typography>
    <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
    <Stack direction="row" gap={0.5} alignItems="center" sx={{ mt: 1, color }}>
      {favorable === true && <TrendingUpRoundedIcon fontSize="small" />}{favorable === false && <TrendingDownRoundedIcon fontSize="small" />}
      <Typography variant="caption" sx={{ fontWeight: 700 }}>{delta}</Typography>
    </Stack>
  </Paper>;
}

function TrendChart({ rows, metric }: { rows: AnalyticsMeasurement[]; metric: AnalyticsMetric }) {
  const series = [2025, 2026].map((year) => ({ year, values: months.map((_, index) => rows.find((row) => row.metricKey === metric.metricKey && row.periodType === "month" && yearOf(row) === year && Number(row.periodStart.slice(5, 7)) === index + 1)?.value ?? 0) }));
  const max = Math.max(...series.flatMap((entry) => entry.values), 1);
  const width = 840; const height = 260; const left = 54; const top = 18; const plotWidth = 760; const plotHeight = 190;
  const x = (index: number) => left + (plotWidth / (months.length - 1)) * index;
  const y = (value: number) => top + plotHeight - (value / max) * plotHeight;
  const points = (values: number[]) => values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  return <Box sx={{ width: "100%", overflowX: "auto" }}><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${metric.name} monthly trend for 2025 and 2026`} style={{ minWidth: 620, width: "100%", display: "block" }}>
    {[0, 0.25, 0.5, 0.75, 1].map((step) => <g key={step}><line x1={left} x2={left + plotWidth} y1={top + plotHeight * step} y2={top + plotHeight * step} stroke="#e5e7eb" /><text x={left - 8} y={top + plotHeight * step + 4} textAnchor="end" fontSize="10" fill="#667085">{formatValue(max * (1 - step), metric.unit)}</text></g>)}
    {series.map((entry) => <g key={entry.year}><polyline fill="none" stroke={entry.year === 2026 ? colors.current : colors.prior} strokeWidth={entry.year === 2026 ? 4 : 3} strokeDasharray={entry.year === 2026 ? undefined : "8 6"} points={points(entry.values)} />{entry.values.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r={entry.year === 2026 ? 5 : 4} fill="#fff" stroke={entry.year === 2026 ? colors.current : colors.prior} strokeWidth="3"><title>{`${months[index]} ${entry.year}: ${formatValue(value, metric.unit)}`}</title></circle>)}</g>)}
    {months.map((month, index) => <text key={month} x={x(index)} y={height - 20} textAnchor="middle" fontSize="11" fill="#667085">{month}</text>)}
  </svg></Box>;
}

export default function AnalyticsWorkspace() {
  const { data, error, loading } = useServiceData(() => analyticsService.getDashboard());
  const [metricKey, setMetricKey] = useState("submitted_applications");
  const metrics = data?.metrics ?? []; const measurements = data?.measurements ?? [];
  const chartMetrics = metrics.filter((metric) => measurements.some((row) => row.metricKey === metric.metricKey && row.periodType === "month"));
  const metric = chartMetrics.find((entry) => entry.metricKey === metricKey) ?? chartMetrics[0];
  const kpis = metrics.map((definition) => {
    const current = totalFor(measurements, definition.metricKey, 2026); const prior = totalFor(measurements, definition.metricKey, 2025);
    const delta = definition.unit === "percent" ? current - prior : prior ? ((current - prior) / prior) * 100 : 0;
    return { definition, current, delta, favorable: definition.metricKey === "application_rate" ? undefined : delta >= 0 };
  });
  const deviceRows = measurements.filter((row) => row.metricKey === "application_rate" && row.periodType === "ytd" && row.device);

  return <Workspace><WorkspaceHeader title="Analytics" description="Portfolio performance from normalized, source-traceable measurements." actions={<Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ width: { xs: "100%", sm: "auto" } }}><FormControl size="small" sx={{ minWidth: 170 }} disabled><InputLabel>Period</InputLabel><Select label="Period" value="jan-aug-2026"><MenuItem value="jan-aug-2026">Jan-Aug 2026</MenuItem></Select></FormControl><FormControl size="small" sx={{ minWidth: 150 }} disabled><InputLabel>Compare</InputLabel><Select label="Compare" value="prior-year"><MenuItem value="prior-year">Prior year</MenuItem></Select></FormControl></Stack>} />
    {error && <Alert severity="error">{error.message}</Alert>}
    {loading ? <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="rounded" height={126} />)}</Stack> : <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, gap: 1.5 }}>{kpis.map(({ definition, current, delta, favorable }) => <KpiCard key={definition.metricKey} label={definition.name} value={formatValue(current, definition.unit)} delta={`${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}${definition.unit === "percent" ? "pp" : "%"} YoY`} favorable={favorable} />)}</Stack>}
    {metric && <Section title="Portal performance - YoY" description="Monthly portfolio series; hover points for exact values." action={<FormControl size="small" sx={{ minWidth: 230 }}><InputLabel>Metric</InputLabel><Select label="Metric" value={metric.metricKey} onChange={(event) => setMetricKey(event.target.value)}>{chartMetrics.map((entry) => <MenuItem key={entry.metricKey} value={entry.metricKey}>{entry.name}</MenuItem>)}</Select></FormControl>}><Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 } }}><Stack direction="row" gap={2} justifyContent="flex-end" sx={{ px: 1 }}><Typography variant="caption" color="text.secondary"><Box component="span" sx={{ display: "inline-block", width: 18, borderTop: `3px dashed ${colors.prior}`, mr: 0.75, verticalAlign: "middle" }} />2025</Typography><Typography variant="caption" color="text.secondary"><Box component="span" sx={{ display: "inline-block", width: 18, borderTop: `4px solid ${colors.current}`, mr: 0.75, verticalAlign: "middle" }} />2026</Typography></Stack><TrendChart rows={measurements} metric={metric} /></Paper></Section>}
    <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" }, gap: 2 }}>
      <Section title="Device performance" description="Application rate, Jan-Aug 2026 vs prior year."><Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>{(["desktop", "mobile"] as const).map((device) => { const current = deviceRows.find((row) => row.device === device && yearOf(row) === 2026)?.value ?? 0; const prior = deviceRows.find((row) => row.device === device && yearOf(row) === 2025)?.value ?? 0; return <Paper key={device} variant="outlined" sx={{ p: 2, flex: 1 }}><Typography variant="subtitle2" sx={{ textTransform: "capitalize", fontWeight: 800 }}>{device}</Typography><Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>{current.toFixed(1)}%</Typography><Typography variant="caption" color={current >= prior ? "success.main" : "text.secondary"}>{current >= prior ? "+" : ""}{(current - prior).toFixed(1)}pp YoY</Typography></Paper>; })}</Stack></Section>
      <Section title="Reporting scope" description="Definition metadata travels with every measurement."><Alert severity="info" icon={false} sx={{ height: "100%" }}><Typography variant="body2" sx={{ fontWeight: 700 }}>Adobe Analytics · definition version 2026-08-31</Typography><Typography variant="caption" display="block" sx={{ mt: 0.75 }}>All sites except Guaranteed Issue and Simplified Issue. Bot traffic and outdated browsers are excluded. Unique visitors are period-deduplicated; submissions are additive.</Typography></Alert></Section>
    </Stack>
    <Section title="Metric definitions" description="Definitions remain explicit while measurement values are database-backed."><ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Metric</TableCell><TableCell>Definition</TableCell><TableCell>Unit</TableCell><TableCell>Source</TableCell></TableRow></TableHead><TableBody>{metrics.map((entry) => <TableRow key={entry.id}><TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{entry.name}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{entry.metricKey}</Typography></TableCell><TableCell>{entry.description}</TableCell><TableCell>{entry.unit}</TableCell><TableCell>{entry.source}</TableCell></TableRow>)}</TableBody></Table></ResponsiveTableContainer></Section>
  </Workspace>;
}
