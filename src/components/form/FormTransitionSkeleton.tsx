import { Box, Skeleton, Typography } from "@mui/material";

// const chipSkeletonWidths = [132, 156, 118];

type FormTransitionSkeletonProps = {
  statusMessage?: string;
};

export function FormTransitionHeaderSkeleton({
  statusMessage,
}: FormTransitionSkeletonProps) {
  return (
    <Box sx={{ padding: "0 0.5rem" }}>
      {statusMessage ? (
        <Typography
          sx={{
            mt: 1.5,
            mb: 1.5,
            color: "text.secondary",
            fontSize: "0.825rem",
            fontWeight: 400,
            lineHeight: 1.4,
          }}
        >
          {statusMessage}
        </Typography>
      ) : null}
    </Box>
  );
}

export default function FormTransitionSkeleton(
  _props: FormTransitionSkeletonProps,
) {
  return (
    <Box>
      <Skeleton variant="rounded" height={42} sx={{ borderRadius: 1, mb: 2 }} />
      <Skeleton variant="rounded" height={42} sx={{ borderRadius: 1, mb: 2 }} />
      <Skeleton variant="rounded" height={42} sx={{ borderRadius: 1 }} />
    </Box>
  );
}
