import Link from "next/link";

interface RichTextProps {
  content: string;
  className?: string;
}

export default function RichText({ content, className = "" }: RichTextProps) {
  const parts = parseContent(content);

  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, i) => {
        if (part.type === "mention") {
          return (
            <Link
              key={i}
              href={`/u/${part.value}`}
              className="text-primary hover:underline font-bold"
            >
              @{part.value}
            </Link>
          );
        }

        if (part.type === "hashtag") {
          return (
            <Link
              key={i}
              href={`/search?q=${encodeURIComponent(part.value)}`}
              className="text-primary hover:underline"
            >
              #{part.value}
            </Link>
          );
        }

        if (part.type === "url") {
          return (
            <a
              key={i}
              href={part.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {part.value}
            </a>
          );
        }

        return <span key={i}>{part.value}</span>;
      })}
    </p>
  );
}

interface Part {
  type: "text" | "mention" | "hashtag" | "url";
  value: string;
}

function parseContent(content: string): Part[] {
  const parts: Part[] = [];

  const regex = /(@[\u0600-\u06FF\w]+)|(#[\u0600-\u06FF\w]+)|(https?:\/\/[^\s]+)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {

    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // mention
      parts.push({ type: "mention", value: match[1].slice(1) });
    } else if (match[2]) {
      // hashtag
      parts.push({ type: "hashtag", value: match[2].slice(1) });
    } else if (match[3]) {
      // url
      parts.push({ type: "url", value: match[3] });
    }

    lastIndex = match.index + match[0].length;
  }


  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return parts;
}