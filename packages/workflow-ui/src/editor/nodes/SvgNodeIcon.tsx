import { useState, useEffect } from "react";
import { getNodeIcon } from "./nodeIcons";

interface SvgNodeIconProps {
  nodeType: string;
  displayName: string;
  className?: string;
}

export function SvgNodeIcon({ nodeType, displayName, className = "wf-node__icon" }: SvgNodeIconProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [hasError, setHasError] = useState(false);
  const fallbackIcon = getNodeIcon(nodeType, displayName);

  useEffect(() => {
    const loadSvg = async () => {
      try {
        // Resolved against this module's own location, so the icon ships inside
        // this package's dist and never depends on the consuming app's public/ folder.
        const iconUrl = new URL(`../../assets/icons/${nodeType}.svg`, import.meta.url);
        const response = await fetch(iconUrl);
        const contentType = response.headers.get("content-type") ?? "";
        const isSvg = response.ok && contentType.includes("svg");
        if (isSvg) {
          const svg = await response.text();
          setSvgContent(svg);
          setHasError(false);
        } else {
          setHasError(true);
        }
      } catch {
        setHasError(true);
      }
    };

    loadSvg();
  }, [nodeType]);

  if (svgContent && !hasError) {
    return <span className={className} dangerouslySetInnerHTML={{ __html: svgContent }} />;
  }

  // Fallback to text icon
  return <span className={className}>{fallbackIcon}</span>;
}
