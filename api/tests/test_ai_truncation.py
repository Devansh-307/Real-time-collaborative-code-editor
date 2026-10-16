"""
Unit Tests for AI Context-Aware Input Truncation and Error Line Extraction.
"""

import pytest
from app.ai.truncation import (
    extract_error_line_number,
    truncate_code,
    truncate_output
)


def test_extract_error_line_python():
    stderr = """Traceback (most recent call last):
  File "main.py", line 42, in <module>
    result = calculate(10, 0)
ZeroDivisionError: division by zero"""
    line = extract_error_line_number(stderr)
    assert line == 42


def test_extract_error_line_cpp():
    stderr = "main.cpp:15:5: error: expected ';' before 'return'"
    line = extract_error_line_number(stderr)
    assert line == 15


def test_extract_error_line_java():
    stderr = """Exception in thread "main" java.lang.NullPointerException
    at com.example.App.main(App.java:88)"""
    line = extract_error_line_number(stderr)
    assert line == 88


def test_extract_error_line_javascript():
    stderr = """TypeError: Cannot read property 'map' of undefined
    at transform (index.js:27:14)
    at Object.<anonymous> (index.js:35:1)"""
    line = extract_error_line_number(stderr)
    assert line == 27


def test_truncate_code_under_limit():
    short_code = "def hello():\n    print('world')\n"
    res, was_truncated, err_line = truncate_code(short_code, max_chars=1000)
    assert was_truncated is False
    assert res == short_code


def test_truncate_oversized_code_preserves_error_region():
    # Build 500 lines of code with an error at line 250
    lines = [f"line_{i} = {i}" for i in range(1, 501)]
    lines[249] = "buggy_line = 1 / 0  # Line 250"
    full_code = "\n".join(lines)
    stderr = 'File "main.py", line 250, in <module>\n    buggy_line = 1 / 0\nZeroDivisionError: division by zero'

    truncated, was_truncated, detected_line = truncate_code(
        full_code,
        error_text=stderr,
        max_chars=2000,
        context_lines_radius=10,
        head_lines=5,
        tail_lines=5
    )

    assert was_truncated is True
    assert detected_line == 250
    # Head lines must be preserved
    assert "line_1 = 1" in truncated
    # Error line must be preserved
    assert "buggy_line = 1 / 0" in truncated
    # Tail lines must be preserved
    assert "line_500 = 500" in truncated
    # Truncation markers must be present
    assert "[Truncated" in truncated


def test_truncate_output_preserves_head_and_tail():
    long_stderr = "START_DIAGNOSTICS\n" + ("x" * 10000) + "\nFATAL_ERROR: Segfault at 0x000"
    res = truncate_output(long_stderr, max_chars=1000)
    assert len(res) <= 1200
    assert "START_DIAGNOSTICS" in res
    assert "FATAL_ERROR: Segfault at 0x000" in res
    assert "[... Truncated" in res
