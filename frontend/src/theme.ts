import { createTheme, type MantineColorsTuple } from '@mantine/core';

const primary: MantineColorsTuple = [
  '#e6fbff',
  '#c0f4ff',
  '#96ecff',
  '#69e3ff',
  '#45dbff',
  '#22d3f5',
  '#00c4e8',
  '#00a8c7',
  '#008ba6',
  '#006f85',
];

const secondary: MantineColorsTuple = [
  '#e3f6f9',
  '#b8e6ec',
  '#8cd5df',
  '#5fc3d1',
  '#3bb2c4',
  '#1d9fb3',
  '#0288a1',
  '#026f83',
  '#015866',
  '#01424b',
];

const tertiary: MantineColorsTuple = [
  '#fff4e0',
  '#ffe2b3',
  '#ffcf80',
  '#ffbb4d',
  '#ffa926',
  '#ff9c0d',
  '#ff9000',
  '#e57f00',
  '#cc6f00',
  '#b35f00',
];

const neutral: MantineColorsTuple = [
  '#f1f2f4',
  '#dfe2e7',
  '#c7ccd4',
  '#aeb5c1',
  '#94a0ae',
  '#7c899b',
  '#64748b',
  '#535f72',
  '#434c5a',
  '#333a44',
];

const fontFamily = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", sans-serif';

export const theme = createTheme({
  primaryColor: 'primary',
  colors: { primary, secondary, tertiary, neutral },
  fontFamily,
  headings: { fontFamily },
  defaultRadius: 'lg',
});
