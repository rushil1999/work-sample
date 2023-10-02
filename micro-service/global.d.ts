declare module 'generate-unique-id' {
  export default function (config: {
    length?: number;
    useLetters?: boolean;
    useNumbers?: boolean;
    includeSymbols?: string[];
    excludeSymbols?: string[];
  }): string;
}
