export interface MeetingLinkInfo {
  title: string | null;
  date: string | null;
  url: string | null;
  sourceType: "tencent_meeting_link" | "dingtalk_link" | "generic_link" | "unknown";
  warning?: string;
}

/**
 * Parse a pasted block of meeting link info and extract structured meeting data.
 * 
 * Supported formats:
 * 1. Tencent Meeting notification format:
 *    转写：转写_国的快速会议
 *    日期：2026-04-16 14:02:16
 *    转写文件：https://meeting.tencent.com/ctm/ld68rgD074
 * 
 * 2. Generic format:
 *    Title line, date line, URL line in any order
 */
export function parseMeetingLink(text: string): MeetingLinkInfo {
  const trimmed = text.trim();
  if (!trimmed) {
    return { title: null, date: null, url: null, sourceType: "unknown", warning: "输入为空" };
  }

  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
  
  let title: string | null = null;
  let date: string | null = null;
  let url: string | null = null;
  let sourceType: MeetingLinkInfo["sourceType"] = "generic_link";

  // URL pattern
  const urlPattern = /https?:\/\/[^\s]+/;

  for (const line of lines) {
    // Extract URL
    const urlMatch = line.match(urlPattern);
    if (urlMatch) {
      url = urlMatch[0].replace(/[。，,;）)】」》"']+$/, ""); // strip trailing punctuation
      if (url.includes("meeting.tencent.com")) {
        sourceType = "tencent_meeting_link";
      } else if (url.includes("dingtalk")) {
        sourceType = "dingtalk_link";
      }
      continue;
    }

    // Try to match structured key: value patterns
    const kvMatch = line.match(/^(转写|会议主题|标题|主题|name|title|日期|时间|date|time|转写文件|链接|link|url)[：:=]\s*(.+)$/i);
    if (kvMatch) {
      const key = kvMatch[1].toLowerCase();
      const value = kvMatch[2].trim();
      
      if (["title", "主题", "标题", "name", "转写", "会议主题"].some((k) => key.includes(k))) {
        if (!title) title = value;
      } else if (["日期", "时间", "date", "time"].some((k) => key.includes(k))) {
        if (!date) date = value;
      }
      continue;
    }

    // Heuristic: first non-empty, non-URL, non-date line is likely the title
    if (!title && !isDateLike(line)) {
      title = line;
      continue;
    }

    // Heuristic: date-like line
    if (!date && isDateLike(line)) {
      date = line;
    }
  }

  // If we found a Tencent Meeting URL, mark the source type
  if (url) {
    if (url.includes("meeting.tencent.com") || url.includes("voovmeeting.com")) {
      sourceType = "tencent_meeting_link";
    } else if (url.includes("dingtalk")) {
      sourceType = "dingtalk_link";
    }
  }

  // Clean up title
  if (title) {
    title = title.replace(/^[转写转录][：:]?\s*/, "").trim();
  }

  // Normalize date
  if (date) {
    const parsed = parseDateString(date);
    if (parsed) date = parsed;
  }

  const warnings: string[] = [];
  if (!title) warnings.push("未识别到会议标题");
  if (!date) warnings.push("未识别到会议时间");
  if (!url) warnings.push("未识别到转写链接");

  // Extract record ID from Tencent Meeting URL for storage
  if (url && sourceType === "tencent_meeting_link") {
    // Pattern: /ctm/xxx or /v2/xxx?record_id=xxx
    const ctmMatch = url.match(/\/ctm\/([a-zA-Z0-9_-]+)/);
    if (ctmMatch) {
      // Store the short code
    }
  }

  return {
    title,
    date,
    url,
    sourceType,
    warning: warnings.length > 0 ? warnings.join("；") : undefined,
  };
}

function isDateLike(text: string): boolean {
  return /(\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[:：]\d{2}([:：]\d{2})?)/.test(text);
}

function parseDateString(text: string): string | null {
  // Try YYYY-MM-DD HH:mm:ss
  let match = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, y, mo, d, h, mi, s] = match;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${mi.padStart(2, "0")}:${s ? s.padStart(2, "0") : "00"}`;
  }

  // Try YYYY-MM-DD
  match = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (match) {
    const [, y, mo, d] = match;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T09:00:00`;
  }

  return null;
}

/**
 * Extract the record ID from a Tencent Meeting share URL.
 */
export function extractTencentRecordId(url: string): string | null {
  // /ctm/{code}
  const ctmMatch = url.match(/\/ctm\/([a-zA-Z0-9_-]+)/);
  if (ctmMatch) return ctmMatch[1];

  // ?record_id=xxx
  const paramMatch = url.match(/record_id=([a-zA-Z0-9_-]+)/);
  if (paramMatch) return paramMatch[1];

  return null;
}

/**
 * Extract the meeting code from a DingTalk meeting URL
 */
export function extractDingtalkMeetingCode(url: string): string | null {
  const match = url.match(/dingtalk\.com[^\s]*[?&](?:meetingCode|conferenceId)=([a-zA-Z0-9]+)/);
  if (match) return match[1];
  return null;
}
