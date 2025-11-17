import { Card, CardContent, CircularProgress, Typography } from "@mui/material";

interface KpiCardProps {
  title: string;
  value: string | number;
  loading: boolean;
}

export default function KpiCard({ title, value, loading }: KpiCardProps) {
  return (
    <Card>
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h5" component="div">
          {loading ? <CircularProgress size={30} /> : value}
        </Typography>
      </CardContent>
    </Card>
  );
}
