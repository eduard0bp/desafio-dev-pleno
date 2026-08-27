export const GRID_TEMPLATE_COLUMNS = 'minmax(160px, 1fr) 110px 120px 100px 110px 90px 60px'

export const TABLE_MIN_WIDTH = 160 + 110 + 120 + 100 + 110 + 90 + 60 + 6 * 10 + 32

export const COLUMN_LABELS = ['Empresa', 'Nota', 'Status', 'Sentimento', 'Categoria', 'Data', 'Ações']

export const CELL_FLEX_STYLE = {
  display: 'flex',
  alignItems: 'center',
  minWidth: 0
} as const

const STICKY_GAP_COVER = {
  marginLeft: 'calc(-1 * var(--mantine-spacing-sm))',
  paddingLeft: 'var(--mantine-spacing-sm)'
} as const

const STICKY_EDGE_SHADOW = '-8px 0 12px -8px rgba(0, 0, 0, 0.15)'

export const STICKY_ACTIONS_HEADER_STYLE = {
  position: 'sticky',
  right: '-5px',
  backgroundColor: 'var(--mantine-color-body)',
  boxShadow: STICKY_EDGE_SHADOW,
  ...STICKY_GAP_COVER
} as const

export const STICKY_ACTIONS_ROW_STYLE = {
  ...CELL_FLEX_STYLE,
  position: 'sticky',
  right: '-5px',
  alignSelf: 'stretch',
  justifyContent: 'center',
  backgroundColor: 'var(--mantine-color-body)',
  boxShadow: STICKY_EDGE_SHADOW,
  ...STICKY_GAP_COVER,
  borderTopRightRadius: 'var(--mantine-radius-md)',
  borderBottomRightRadius: 'var(--mantine-radius-md)'
} as const
