import { Skeleton as MUISkeleton, type SkeletonProps, Box } from "@mui/material"

export const Skeleton = (props: SkeletonProps) => {
  return <MUISkeleton animation="pulse" {...props} />
}

interface ChatSkeletonProps {
  count?: number
}

export const ChatSkeleton = ({ count = 3 }: ChatSkeletonProps) => {
  return (
    <Box sx={{ width: "100%" }}>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <Box key={index} sx={{ display: "flex", alignItems: "flex-start", mb: 2, p: 1 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Box sx={{ width: "100%" }}>
              <Skeleton width="30%" height={24} sx={{ mb: 1 }} />
              <Skeleton width="90%" height={20} />
              <Skeleton width="75%" height={20} />
            </Box>
          </Box>
        ))}
    </Box>
  )
}
