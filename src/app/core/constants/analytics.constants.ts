export const CHART_WIDTH = 480;
export const CHART_HEIGHT = 280;
export const CHART_PADDING_TOP = 24;
export const CHART_PADDING_RIGHT = 24;
export const CHART_PADDING_BOTTOM = 40;
export const CHART_PADDING_LEFT = 48;
export const BAR_GAP = 16;
export const BURNDOWN_DAYS = 7;

/** Priority fill colors matching CSS variables (--afx-priority-*) */
export const PRIORITY_COLORS = {
  high: '#ff4466',
  medium: '#ffb020',
  low: '#00e5ff',
} as const;

export const PRIORITY_COLOR_VARS = {
  high: '--afx-priority-high',
  medium: '--afx-priority-medium',
  low: '--afx-priority-low',
} as const;
