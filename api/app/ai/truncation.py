"""
Context-Aware Input Truncation Utility.
Preserves critical error regions and surrounding lines while truncating oversized
files to keep LLM context focused, fast, and cost-effective.
"""

import re
from typing import Optional, Tuple
from app.config import settings

def extract_error_line_number(error_text: str) -> Optional[int]:
    """
    Scans stderr/stdout to find the most probable source code line number causing the error.
    Handles language-specific stack trace orientations (Python innermost at bottom,
    Node.js / Java innermost at top, and C++ compiler primary error at top).
    """
    if not error_text:
        return None

    lines = error_text.splitlines()

    # 1. Node.js V8 stack trace (first 'at ... (file:line:col)' is the crash point)
    for line in lines:
        js_match = re.search(r'at\s+.*?:(\d+):\d+', line, re.IGNORECASE)
        if js_match:
            try:
                val = int(js_match.group(1))
                if val > 0:
                    return val
            except (ValueError, IndexError):
                pass

    # 2. Java runtime stack trace (first '(Class.java:line)' is the crash point)
    for line in lines:
        java_match = re.search(r'\([A-Za-z0-9_]+\.java:(\d+)\)', line, re.IGNORECASE)
        if java_match:
            try:
                val = int(java_match.group(1))
                if val > 0:
                    return val
            except (ValueError, IndexError):
                pass

    # 3. C++ / GCC / Clang / Javac compiler error (first error line is primary)
    for line in lines:
        c_match = re.search(r':(\d+):\d*:\s*(?:fatal\s+)?error:', line, re.IGNORECASE)
        if c_match:
            try:
                val = int(c_match.group(1))
                if val > 0:
                    return val
            except (ValueError, IndexError):
                pass

    # 4. Python traceback (innermost frame is the last 'File "...", line X' frame)
    py_matches = re.findall(r'File\s+["\'][^"\']+["\'],\s+line\s+(\d+)', error_text, re.IGNORECASE)
    if py_matches:
        try:
            val = int(py_matches[-1])
            if val > 0:
                return val
        except (ValueError, IndexError):
            pass

    # 5. Generic fallback ("line 42")
    gen_matches = re.findall(r'\bline\s+(\d+)\b', error_text, re.IGNORECASE)
    if gen_matches:
        try:
            val = int(gen_matches[0])
            if val > 0:
                return val
        except (ValueError, IndexError):
            pass

    return None


def truncate_code(
    code: str,
    error_text: str = "",
    max_chars: Optional[int] = None,
    context_lines_radius: int = 25,
    head_lines: int = 20,
    tail_lines: int = 15
) -> Tuple[str, bool, Optional[int]]:
    """
    Truncates source code if it exceeds max_chars, ensuring the error region
    and imports are preserved.

    Returns:
        (truncated_code: str, was_truncated: bool, detected_error_line: Optional[int])
    """
    limit = max_chars or settings.AI_MAX_CODE_CHARS
    if len(code) <= limit:
        err_line = extract_error_line_number(error_text)
        return code, False, err_line

    code_lines = code.splitlines()
    total_lines = len(code_lines)
    if total_lines <= (head_lines + context_lines_radius * 2 + tail_lines):
        # Line count is small, but character length is high (e.g. very wide minified lines)
        # Simply slice characters with clear message
        return code[:limit] + "\n// ... [Content truncated to limit token usage] ...", True, None

    err_line = extract_error_line_number(error_text)
    selected_line_indices = set()

    # 1. Always keep head lines (imports, namespace, config)
    for i in range(min(head_lines, total_lines)):
        selected_line_indices.add(i)

    # 2. Always keep tail lines (main caller, export)
    for i in range(max(0, total_lines - tail_lines), total_lines):
        selected_line_indices.add(i)

    # 3. If error line found, keep surrounding radius
    if err_line is not None and 1 <= err_line <= total_lines:
        err_idx = err_line - 1
        start_idx = max(0, err_idx - context_lines_radius)
        end_idx = min(total_lines, err_idx + context_lines_radius + 1)
        for i in range(start_idx, end_idx):
            selected_line_indices.add(i)
    else:
        # Fallback: keep first 50 lines and last 50 lines
        for i in range(min(50, total_lines)):
            selected_line_indices.add(i)
        for i in range(max(0, total_lines - 50), total_lines):
            selected_line_indices.add(i)

    # Reconstruct code with truncation markers
    result_lines = []
    sorted_indices = sorted(selected_line_indices)
    prev_idx = -1

    for idx in sorted_indices:
        if prev_idx != -1 and idx > prev_idx + 1:
            skipped = idx - prev_idx - 1
            result_lines.append(f"// ... [Truncated {skipped} lines of code] ...")
        result_lines.append(code_lines[idx])
        prev_idx = idx

    truncated_code = "\n".join(result_lines)
    return truncated_code, True, err_line


def truncate_output(text: str, max_chars: Optional[int] = None) -> str:
    """
    Truncates compiler or execution output (stdout/stderr) preserving the most
    informative tail where stack traces and error messages typically appear.
    """
    limit = max_chars or settings.AI_MAX_OUTPUT_CHARS
    if not text or len(text) <= limit:
        return text or ""

    # Preserve top 500 chars (command header) + tail of error
    head_len = min(500, limit // 4)
    tail_len = limit - head_len - 100
    return (
        text[:head_len]
        + f"\n\n[... Truncated {len(text) - (head_len + tail_len)} characters of output ...]\n\n"
        + text[-tail_len:]
    )
