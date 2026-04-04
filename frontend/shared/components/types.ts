import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ComponentSize = "sm" | "md" | "lg";
export type CardVariant = "default" | "elevated" | "outlined";
export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";
export type TrendDirection = "up" | "down" | "flat";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ToastVariant = "success" | "error" | "warning" | "info";

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ComponentSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
};

export type CardProps = {
  children: ReactNode;
  padding?: ComponentSize;
  onPress?: () => void;
  variant?: CardVariant;
};

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  size?: ComponentSize;
};

export type MetricTileProps = {
  label: string;
  value: string | number;
  unit?: string;
  trend?: TrendDirection;
  trendValue?: string;
  color?: string;
};

export type RiskIndicatorProps = {
  level: RiskLevel;
  score: number;
  showLabel?: boolean;
};

export type AvatarProps = {
  name: string;
  imageUrl?: string;
  size?: number;
  tier?: string;
};

export type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

export type LoadingSpinnerProps = {
  size?: ComponentSize;
  overlay?: boolean;
};

export type ToastProps = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  visible?: boolean;
  onClose?: () => void;
};

export type BottomSheetProps = {
  visible: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  snapPoints?: number[];
};

export type ModalProps = {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
};
