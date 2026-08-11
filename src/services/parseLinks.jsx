import React from "react";

const LINK_REGEX = /([^(]+)\((https?:\/\/[^)]+)\)/g;

export function parseLinks(text) {
  if (!text) return text;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = LINK_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const linkText = match[1].trim();
    const linkUrl = match[2].trim();

    parts.push(
      <a
        key={`l-${lastIndex}`}
        href={linkUrl}
        className="article-inline-link"
      >
        {linkText}
      </a>
    );

    lastIndex = LINK_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}
