export enum ProgressRange {
  ZERO = "0",
  RANGE_1_25 = "1-25",
  RANGE_26_50 = "26-50",
  RANGE_51_75 = "51-75",
  RANGE_76_99 = "76-99",
  FULL = "100",
}

export enum StarsRange {
  LOW = "0-1",
  MEDIUM = "1.1-2",
  HIGH = "2.1-3",
}

export enum AttemptsRange {
  FAST = "<3",
  NORMAL = "3-6",
  MANY = "6-9",
  TOO_MANY = "+10",
}

export enum ActivityRange {
  LAST_24H = "24h",
  LAST_3D = "3d",
  LAST_5D = "5d",
  LAST_7D = "7d",
  INACTIVE = "inactive",
}
