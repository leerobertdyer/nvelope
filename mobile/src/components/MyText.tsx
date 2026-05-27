import { Text as RNText, TextProps } from 'react-native';

export function MyText(props: TextProps) {
  return <RNText {...props} className={`font-sans ${props.className ?? ''}`} />;
}
