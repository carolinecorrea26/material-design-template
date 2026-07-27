import { Box, Skeleton, Typography } from "@mui/material";

type PageTransitionSkeletonProps = {
  /** Status message shown above the skeletons during a page transition. */
  message?: string;
};

export default function PageTransitionSkeleton({
  message,
}: PageTransitionSkeletonProps) {
  return (
    <>
      <Box sx={{ padding: "0 0.5rem" }}>
        {message ? (
          <Typography
            variant="formTransitionStatus"
            sx={{ mt: 1.5, mb: 1.5, color: "text.secondary" }}
          >
            {message}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ mb: "1rem" }} />
      <Box>
        <Skeleton
          variant="rounded"
          height={50}
          sx={{ borderRadius: 1, mb: 2 }}
        />
        <Skeleton
          variant="rounded"
          height={50}
          sx={{ borderRadius: 1, mb: 2 }}
        />
        <Skeleton variant="rounded" height={50} sx={{ borderRadius: 1 }} />
      </Box>
    </>
  );
}
