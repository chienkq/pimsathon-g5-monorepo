import { useEffect, useState } from "react";

export function useSvgIcon(type: string) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadSvg = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/src/assets/icons/${type}.svg`);
        if (!response.ok) {
          throw new Error(`Failed to load icon: ${type}`);
        }
        const svg = await response.text();
        setSvgContent(svg);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setSvgContent("");
      } finally {
        setIsLoading(false);
      }
    };

    if (type) {
      loadSvg();
    }
  }, [type]);

  return { svgContent, isLoading, error };
}
