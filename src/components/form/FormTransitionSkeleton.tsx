import { Box, Skeleton } from "@mui/material";

type FormTransitionSkeletonProps = {
  statusMessage?: string;
};

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
