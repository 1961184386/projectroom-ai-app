export interface ParsedTranscript {
  title: string | null;
  meetingTime: string | null;
  participants: string[];
  transcriptText: string;
  detectedFormat: "timestamp" | "dialogue" | "metadata_header" | "unknown";
  warning?: string;
}

interface ParsedDialogue {
  participants: string[];
  transcriptText: string;
  matched: boolean;
}

const metadataKeys = ["会议主题", "会议时间", "参会人", "录制文件"] as const;

function normalizeLineBreaks(value: string) {
  return value.replace(/\r\n?/g, "\n");
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function normalizeParticipantName(value: string) {
  return value
    .trim()
    .replace(/[（(][^()（）]+[)）]\s*$/g, "")
    .trim();
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }

  return result;
}

function inferTitleFromFileName(fileName?: string) {
  if (!fileName) {
    return null;
  }

  const baseName = stripExtension(fileName).trim();
  if (!baseName) {
    return null;
  }

  const cleaned = baseName
    .replace(/[_-]?\d{8}([_-]\d{4,6})?$/g, "")
    .replace(/[_-]?\d{4}[-_]\d{2}[-_]\d{2}([ T_-]\d{2}[-_:]?\d{2}([ -_:]?\d{2})?)?$/g, "")
    .replace(/[_-]+$/g, "")
    .trim();

  return cleaned || baseName;
}

function parseMeetingTime(value: string) {
  const match = value.trim().match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2}).*?(\d{1,2}):(\d{2})/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hours, minutes] = match;
  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
}

function parseParticipants(value: string) {
  return uniqueValues(
    value
      .split(/[、，,；;]/)
      .map((item) => normalizeParticipantName(item))
      .filter(Boolean)
  );
}

function parseDialogueLines(lines: string[]): ParsedDialogue {
  const dialoguePattern = /^([^:：]{1,40})[：:]\s*(.+)$/;
  const participants: string[] = [];
  const transcriptLines: string[] = [];
  let currentSpeaker = "";
  let currentContent: string[] = [];
  let matchCount = 0;

  const flushCurrentLine = () => {
    const content = currentContent.join(" ").trim();
    if (currentSpeaker && content) {
      transcriptLines.push(`${currentSpeaker}：${content}`);
    }
    currentSpeaker = "";
    currentContent = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushCurrentLine();
      continue;
    }

    const match = line.match(dialoguePattern);
    if (match && !metadataKeys.includes(match[1].trim() as (typeof metadataKeys)[number])) {
      flushCurrentLine();
      currentSpeaker = normalizeParticipantName(match[1]);
      currentContent = [match[2].trim()];
      if (currentSpeaker) {
        participants.push(currentSpeaker);
        matchCount += 1;
      }
      continue;
    }

    if (currentSpeaker) {
      currentContent.push(line);
    }
  }

  flushCurrentLine();

  return {
    participants: uniqueValues(participants),
    transcriptText: transcriptLines.join("\n").trim(),
    matched: matchCount > 0 && transcriptLines.length > 0
  };
}

function parseTimestampTranscript(lines: string[]): ParsedDialogue {
  const timestampPattern = /^(\d{1,2}:\d{2}:\d{2})\s+(.+)$/;
  const participants: string[] = [];
  const transcriptLines: string[] = [];
  let currentSpeaker = "";
  let currentContent: string[] = [];
  let matchCount = 0;

  const flushCurrentLine = () => {
    const content = currentContent.join(" ").trim();
    if (currentSpeaker && content) {
      transcriptLines.push(`${currentSpeaker}：${content}`);
    }
    currentSpeaker = "";
    currentContent = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const match = line.match(timestampPattern);
    if (match) {
      flushCurrentLine();
      currentSpeaker = normalizeParticipantName(match[2]);
      currentContent = [];
      if (currentSpeaker) {
        participants.push(currentSpeaker);
        matchCount += 1;
      }
      continue;
    }

    if (currentSpeaker) {
      currentContent.push(line);
    }
  }

  flushCurrentLine();

  return {
    participants: uniqueValues(participants),
    transcriptText: transcriptLines.join("\n").trim(),
    matched: matchCount > 0 && transcriptLines.length > 0
  };
}

export function parseTranscript(rawText: string, fileName?: string): ParsedTranscript {
  const normalizedText = normalizeLineBreaks(rawText).trim();
  const fallbackTitle = inferTitleFromFileName(fileName);

  if (!normalizedText) {
    return {
      title: fallbackTitle,
      meetingTime: null,
      participants: [],
      transcriptText: "",
      detectedFormat: "unknown",
      warning: "文件内容为空，请检查导出的转写文本。"
    };
  }

  const allLines = normalizedText.split("\n");
  const metadata: Partial<Record<(typeof metadataKeys)[number], string>> = {};
  let metadataLineCount = 0;
  let bodyStartIndex = 0;

  for (let index = 0; index < allLines.length; index += 1) {
    const line = allLines[index].trim();
    if (!line) {
      bodyStartIndex = index + 1;
      break;
    }

    const match = line.match(/^(会议主题|会议时间|参会人|录制文件)\s*[：:]\s*(.+)$/);
    if (!match) {
      break;
    }

    metadata[match[1] as (typeof metadataKeys)[number]] = match[2].trim();
    metadataLineCount += 1;
    bodyStartIndex = index + 1;
  }

  if (metadataLineCount > 0) {
    const dialogue = parseDialogueLines(allLines.slice(bodyStartIndex));
    return {
      title: metadata["会议主题"] || fallbackTitle,
      meetingTime: metadata["会议时间"] ? parseMeetingTime(metadata["会议时间"]) : null,
      participants:
        dialogue.participants.length > 0
          ? dialogue.participants
          : parseParticipants(metadata["参会人"] ?? ""),
      transcriptText: dialogue.transcriptText || allLines.slice(bodyStartIndex).join("\n").trim(),
      detectedFormat: "metadata_header",
      warning:
        dialogue.matched || allLines.slice(bodyStartIndex).join("").trim()
          ? undefined
          : "已识别元信息，但未解析出标准对话内容，请手动检查。"
    };
  }

  const timestampParsed = parseTimestampTranscript(allLines);
  if (timestampParsed.matched) {
    return {
      title: fallbackTitle,
      meetingTime: null,
      participants: timestampParsed.participants,
      transcriptText: timestampParsed.transcriptText,
      detectedFormat: "timestamp"
    };
  }

  const dialogueParsed = parseDialogueLines(allLines);
  if (dialogueParsed.matched) {
    return {
      title: fallbackTitle,
      meetingTime: null,
      participants: dialogueParsed.participants,
      transcriptText: dialogueParsed.transcriptText,
      detectedFormat: "dialogue"
    };
  }

  return {
    title: fallbackTitle,
    meetingTime: null,
    participants: [],
    transcriptText: normalizedText,
    detectedFormat: "unknown",
    warning: "未识别为标准腾讯会议转写格式，已保留原文，请手动补充会议信息。"
  };
}
