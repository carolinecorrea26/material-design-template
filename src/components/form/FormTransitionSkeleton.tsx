import { Box, Skeleton, Typography } from "@mui/material";

type FormTransitionSkeletonProps = {
  statusMessage: string;
};

export default function FormTransitionSkeleton({
  statusMessage,
}: FormTransitionSkeletonProps) {
  return (
    <Box>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", mb: 2, fontSize: "0.85rem" }}
      >
        {statusMessage}
      </Typography>

      <Skeleton variant="rounded" height={42} sx={{ borderRadius: 1, mb: 2 }} />
      <Skeleton variant="rounded" height={42} sx={{ borderRadius: 1, mb: 2 }} />
      <Skeleton variant="rounded" height={42} sx={{ borderRadius: 1 }} />
    </Box>
  );
}
