"""
Room Service.
Manages room code generation, language template definitions, and default starter files.
"""

import random
import string
from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.schemas.room import FileItem, LanguageInfo, RoomCreateResponse


# Language metadata definitions
LANGUAGE_CATALOG: Dict[str, LanguageInfo] = {
    "python": LanguageInfo(
        id="python",
        label="Python",
        monaco_id="python",
        extension="py",
        entry_file="main.py",
        version="3.12",
        description="Python 3.12 with standard libraries",
        command="python3 main.py",
        supports_execution=True,
        supports_preview=False,
    ),
    "javascript": LanguageInfo(
        id="javascript",
        label="JavaScript",
        monaco_id="javascript",
        extension="js",
        entry_file="main.js",
        version="Node 22",
        description="Node.js 22 runtime environment",
        command="node main.js",
        supports_execution=True,
        supports_preview=False,
    ),
    "cpp": LanguageInfo(
        id="cpp",
        label="C++",
        monaco_id="cpp",
        extension="cpp",
        entry_file="main.cpp",
        version="GCC 14",
        description="C++20 compiled with GCC -O2",
        command="g++ main.cpp -O2 -o main && ./main",
        supports_execution=True,
        supports_preview=False,
    ),
    "java": LanguageInfo(
        id="java",
        label="Java",
        monaco_id="java",
        extension="java",
        entry_file="Main.java",
        version="OpenJDK 21",
        description="OpenJDK 21 runtime environment",
        command="javac Main.java && java Main",
        supports_execution=True,
        supports_preview=False,
    ),
    "json": LanguageInfo(
        id="json",
        label="JSON",
        monaco_id="json",
        extension="json",
        entry_file="data.json",
        version="Schema v1",
        description="JSON data structure format with preview and validation",
        command="N/A",
        supports_execution=False,
        supports_preview=True,
    ),
    "html": LanguageInfo(
        id="html",
        label="HTML / Web Preview",
        monaco_id="html",
        extension="html",
        entry_file="index.html",
        version="HTML5",
        description="Interactive HTML/CSS/JavaScript sandboxed iframe preview",
        command="N/A",
        supports_execution=False,
        supports_preview=True,
    ),
}

# Template starter codes
TEMPLATES: Dict[str, Dict[str, str]] = {
    "python": {
        "main.py": (
            "# ==========================================================\n"
            "# Welcome to CodeSync - Real-time Collaborative Code Editor\n"
            "# Language: Python 3.12\n"
            "# ==========================================================\n\n"
            "def main():\n"
            "    name = \"Developer\"\n"
            "    print(f\"Hello, World! Welcome {name} to CodeSync.\")\n"
            "    print(\"Python 3.12 runtime environment is ready.\")\n"
            "    print(\"Press Ctrl+Enter / Cmd+Enter to execute your code.\")\n\n"
            "if __name__ == '__main__':\n"
            "    main()\n"
        )
    },
    "javascript": {
        "main.js": (
            "// ==========================================================\n"
            "// Welcome to CodeSync - Real-time Collaborative Code Editor\n"
            "// Language: JavaScript (Node.js 22)\n"
            "// ==========================================================\n\n"
            "function main() {\n"
            "  const name = 'Developer';\n"
            "  console.log(`Hello, World! Welcome ${name} to CodeSync.`);\n"
            "  console.log('Node.js 22 runtime environment is ready.');\n"
            "  console.log('Press Ctrl+Enter / Cmd+Enter to execute your code.');\n"
            "}\n\n"
            "main();\n"
        )
    },
    "cpp": {
        "main.cpp": (
            "// ==========================================================\n"
            "// Welcome to CodeSync - Real-time Collaborative Code Editor\n"
            "// Language: C++ (GCC 14)\n"
            "// ==========================================================\n\n"
            "#include <iostream>\n"
            "#include <string>\n\n"
            "int main() {\n"
            "    std::string name = \"Developer\";\n"
            "    std::cout << \"Hello, World! Welcome \" << name << \" to CodeSync.\" << std::endl;\n"
            "    std::cout << \"C++20 (GCC 14) runtime environment is ready.\" << std::endl;\n"
            "    std::cout << \"Press Ctrl+Enter / Cmd+Enter to execute your code.\" << std::endl;\n"
            "    return 0;\n"
            "}\n"
        )
    },
    "java": {
        "Main.java": (
            "// ==========================================================\n"
            "// Welcome to CodeSync - Real-time Collaborative Code Editor\n"
            "// Language: Java (OpenJDK 21)\n"
            "// ==========================================================\n\n"
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        String name = \"Developer\";\n"
            "        System.out.println(\"Hello, World! Welcome \" + name + \" to CodeSync.\");\n"
            "        System.out.println(\"Java 21 (OpenJDK) runtime environment is ready.\");\n"
            "        System.out.println(\"Press Ctrl+Enter / Cmd+Enter to execute your code.\");\n"
            "    }\n"
            "}\n"
        )
    },
    "json": {
        "data.json": (
            "{\n"
            "  \"app\": \"CodeSync\",\n"
            "  \"version\": \"1.0.0\",\n"
            "  \"description\": \"Real-time collaborative code editor with sandboxed execution\",\n"
            "  \"features\": [\n"
            "    \"CRDT conflict-free editing\",\n"
            "    \"Monaco code editor with remote cursors\",\n"
            "    \"Docker sandboxed execution\",\n"
            "    \"Live web preview mode\"\n"
            "  ],\n"
            "  \"status\": \"healthy\"\n"
            "}\n"
        )
    },
    "html": {
        "index.html": (
            "<!DOCTYPE html>\n"
            "<html lang=\"en\">\n"
            "<head>\n"
            "  <meta charset=\"UTF-8\" />\n"
            "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n"
            "  <title>CodeSync Live Preview</title>\n"
            "  <style>\n"
            "    * { box-sizing: border-box; }\n"
            "    body {\n"
            "      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n"
            "      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);\n"
            "      color: #f8fafc;\n"
            "      display: flex;\n"
            "      align-items: center;\n"
            "      justify-content: center;\n"
            "      min-height: 90vh;\n"
            "      margin: 0;\n"
            "      padding: 1rem;\n"
            "    }\n"
            "    .container {\n"
            "      background: #1e293b;\n"
            "      border: 1px solid #334155;\n"
            "      border-radius: 16px;\n"
            "      padding: 2.5rem;\n"
            "      max-width: 500px;\n"
            "      width: 100%;\n"
            "      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);\n"
            "      text-align: center;\n"
            "    }\n"
            "    h1 {\n"
            "      font-size: 1.8rem;\n"
            "      color: #38bdf8;\n"
            "      margin-top: 0;\n"
            "    }\n"
            "    p {\n"
            "      color: #94a3b8;\n"
            "      line-height: 1.6;\n"
            "    }\n"
            "    .btn {\n"
            "      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);\n"
            "      color: #ffffff;\n"
            "      border: none;\n"
            "      padding: 0.75rem 1.5rem;\n"
            "      font-size: 1rem;\n"
            "      font-weight: 600;\n"
            "      border-radius: 8px;\n"
            "      cursor: pointer;\n"
            "      transition: transform 0.1s, box-shadow 0.2s;\n"
            "    }\n"
            "    .btn:hover {\n"
            "      transform: translateY(-2px);\n"
            "      box-shadow: 0 8px 15px rgba(59, 130, 246, 0.4);\n"
            "    }\n"
            "    #output {\n"
            "      margin-top: 1.5rem;\n"
            "      padding: 0.75rem;\n"
            "      border-radius: 8px;\n"
            "      background: #0f172a;\n"
            "      color: #10b981;\n"
            "      font-family: monospace;\n"
            "      min-height: 24px;\n"
            "    }\n"
            "  </style>\n"
            "</head>\n"
            "<body>\n"
            "  <div class=\"container\">\n"
            "    <h1>⚡ CodeSync Live Web Preview</h1>\n"
            "    <p>Edit HTML, CSS, and JS collaboratively. Changes update live in this sandboxed frame!</p>\n"
            "    <button class=\"btn\" onclick=\"handleClick()\">Trigger Interactive Action</button>\n"
            "    <div id=\"output\">Click the button above to test JS execution</div>\n"
            "  </div>\n\n"
            "  <script>\n"
            "    let clicks = 0;\n"
            "    function handleClick() {\n"
            "      clicks++;\n"
            "      document.getElementById('output').textContent = `Action triggered! Count: ${clicks} (${new Date().toLocaleTimeString()})`;\n"
            "    }\n"
            "  </script>\n"
            "</body>\n"
            "</html>\n"
        )
    }
}


def generate_room_id() -> str:
    """Generate a clean 8-character human-friendly room code (e.g. ABCD-1234)."""
    letters = ''.join(random.choices(string.ascii_uppercase, k=4))
    digits = ''.join(random.choices(string.digits, k=4))
    return f"{letters}-{digits}"


def get_supported_languages() -> List[LanguageInfo]:
    """Retrieve list of all supported languages."""
    return list(LANGUAGE_CATALOG.values())


def get_language_info(language: str) -> Optional[LanguageInfo]:
    """Retrieve metadata for a specific language."""
    norm = language.lower().strip()
    if norm in ("python3", "py"):
        norm = "python"
    elif norm in ("node", "js"):
        norm = "javascript"
    elif norm in ("c++",):
        norm = "cpp"
    return LANGUAGE_CATALOG.get(norm)


def get_template(language: str) -> Dict[str, str]:
    """Retrieve file templates for language."""
    norm = language.lower().strip()
    if norm in ("python3", "py"):
        norm = "python"
    elif norm in ("node", "js"):
        norm = "javascript"
    elif norm in ("c++",):
        norm = "cpp"
    return TEMPLATES.get(norm, TEMPLATES["python"])


def create_room_files(language: str) -> List[FileItem]:
    """Create the initial file list for a new room."""
    lang_info = get_language_info(language) or LANGUAGE_CATALOG["python"]
    template_files = get_template(lang_info.id)
    
    files: List[FileItem] = []
    for idx, (filename, content) in enumerate(template_files.items()):
        files.append(FileItem(
            id=f"file-{idx + 1}",
            name=filename,
            path=f"/{filename}",
            content=content,
            is_entry=True,
            language=lang_info.monaco_id
        ))
    return files
