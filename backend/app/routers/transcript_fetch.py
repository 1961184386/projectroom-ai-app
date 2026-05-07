"""Endpoint to fetch transcript content from a Tencent Meeting share URL."""

import re
import json
import logging

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/meetings", tags=["transcript-fetch"])


class TranscriptFetchRequest(BaseModel):
    url: str


class TranscriptFetchResponse(BaseModel):
    transcript_text: str | None = None
    title: str | None = None
    meeting_time: str | None = None
    participants: str | None = None
    warning: str | None = None
    source_type: str = "unknown"


def _extract_tencent_meeting_title(html: str) -> str | None:
    """Try to extract meeting title from Tencent Meeting share page HTML."""
    # Try __NEXT_DATA__
    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html)
    if match:
        try:
            data = json.loads(match.group(1))
            props = data.get("props", {})
            page_props = props.get("pageProps", {})
            query = page_props.get("query", {})
            if query.get("short_link"):
                # We have the short code but not much else from SSR
                pass
        except (json.JSONDecodeError, KeyError):
            pass

    # Try page title
    match = re.search(r"<title>([^<]+)</title>", html)
    if match and match.group(1).strip():
        title = match.group(1).strip()
        if title not in ("", "腾讯会议", "404 -- 腾讯会议"):
            return title

    # Try og:title meta
    match = re.search(r'<meta\s+property="og:title"\s+content="([^"]+)"', html)
    if match:
        return match.group(1)

    return None


@router.post("/fetch-transcript")
def fetch_transcript_from_url(payload: TranscriptFetchRequest):
    """
    Attempt to fetch transcript content from a Tencent Meeting or DingTalk share URL.
    Falls back gracefully if the page requires authentication.
    """
    url = payload.url.strip()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is required.",
        )

    is_tencent = "meeting.tencent.com" in url or "voovmeeting.com" in url
    is_dingtalk = "dingtalk" in url

    if not is_tencent and not is_dingtalk:
        return {
            "data": TranscriptFetchResponse(
                warning="仅支持腾讯会议和钉钉会议的转写链接",
                source_type="unknown",
            ).model_dump(),
            "message": "ok",
        }

    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml",
        }

        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            html = response.text

        if is_tencent:
            title = _extract_tencent_meeting_title(html)
            if title:
                return {
                    "data": TranscriptFetchResponse(
                        title=title,
                        source_type="tencent_meeting_link",
                        warning="腾讯会议转写页面需要登录才能获取完整内容。已提取标题，请手动粘贴转写文本或上传文件。",
                    ).model_dump(),
                    "message": "ok",
                }

            return {
                "data": TranscriptFetchResponse(
                    source_type="tencent_meeting_link",
                    warning="腾讯会议转写页面需要登录认证，无法自动获取转写内容。请手动复制粘贴转写文本至下方文本框。",
                ).model_dump(),
                "message": "ok",
            }

        # DingTalk: similar approach
        if is_dingtalk:
            return {
                "data": TranscriptFetchResponse(
                    source_type="dingtalk_link",
                    warning="钉钉会议链接需要登录认证，无法自动获取转写内容。请手动复制粘贴转写文本至下方文本框。",
                ).model_dump(),
                "message": "ok",
            }

    except httpx.HTTPStatusError as exc:
        logger.warning("HTTP error fetching transcript URL: %s", exc)
        return {
            "data": TranscriptFetchResponse(
                warning=f"链接访问失败 (HTTP {exc.response.status_code})，请检查链接是否正确或手动粘贴转写文本。",
                source_type="tencent_meeting_link" if is_tencent else "dingtalk_link",
            ).model_dump(),
            "message": "ok",
        }
    except Exception as exc:
        logger.warning("Failed to fetch transcript URL: %s", exc)
        return {
            "data": TranscriptFetchResponse(
                warning="获取转写内容失败，请手动粘贴转写文本至下方文本框。",
                source_type="tencent_meeting_link" if is_tencent else "dingtalk_link",
            ).model_dump(),
            "message": "ok",
        }

    return {"data": {}, "message": "ok"}
