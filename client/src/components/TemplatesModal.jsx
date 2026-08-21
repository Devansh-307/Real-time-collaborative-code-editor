import React from 'react';
import { Sparkles, Code2, Play, X, Check, FileText } from 'lucide-react';

export const TEMPLATE_PRESETS = {
  python: [
    {
      id: 'py-hello',
      title: 'Hello World (Clean Starter)',
      description: 'Standard Python entry point with greetings and environment check.',
      code: `# ==========================================================
# Welcome to CodeSync - Real-time Collaborative Code Editor
# Language: Python 3.12
# ==========================================================

def main():
    name = "Developer"
    print(f"Hello, World! Welcome {name} to CodeSync.")
    print("Python 3.12 runtime environment is ready.")
    print("Press Ctrl+Enter / Cmd+Enter to execute your code.")

if __name__ == '__main__':
    main()
`,
    },
    {
      id: 'py-binary-search',
      title: 'Binary Search Algorithm',
      description: 'Efficient O(log n) search algorithm with test cases.',
      code: `def binary_search(arr: list[int], target: int) -> int:
    """Perform binary search on a sorted list. Returns index or -1."""
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

if __name__ == "__main__":
    data = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
    target = 23
    idx = binary_search(data, target)
    print(f"Dataset: {data}")
    print(f"Searching for {target} -> Found at index: {idx}")
`,
    },
    {
      id: 'py-data-processing',
      title: 'Data Processing & Statistics',
      description: 'Calculates mean, median, standard deviation of a dataset.',
      code: `import statistics

def analyze_grades(scores: list[float]) -> dict:
    return {
        "count": len(scores),
        "mean": round(statistics.mean(scores), 2),
        "median": round(statistics.median(scores), 2),
        "min": min(scores),
        "max": max(scores),
    }

scores = [88.5, 92.0, 79.5, 95.0, 84.0, 91.5, 100.0, 76.0]
stats = analyze_grades(scores)
print("=== Student Scores Analysis ===")
for k, v in stats.items():
    print(f"  {k.capitalize()}: {v}")
`,
    }
  ],
  javascript: [
    {
      id: 'js-hello',
      title: 'Hello World (Node.js)',
      description: 'Simple Node.js 22 starter script.',
      code: `// ==========================================================
// Welcome to CodeSync - Real-time Collaborative Code Editor
// Language: JavaScript (Node.js 22)
// ==========================================================

function main() {
  const name = 'Developer';
  console.log(\`Hello, World! Welcome \${name} to CodeSync.\`);
  console.log('Node.js 22 runtime environment is ready.');
  console.log('Press Ctrl+Enter / Cmd+Enter to execute your code.');
}

main();
`,
    },
    {
      id: 'js-async-fetch',
      title: 'Async Promise Processing',
      description: 'Demonstrates modern ES2024 async/await concurrency.',
      code: `async function processQueue(items) {
  console.log(\`Processing \${items.length} tasks concurrently...\`);
  const results = await Promise.all(
    items.map(async (item, i) => {
      const delay = (i + 1) * 50;
      return new Promise((resolve) =>
        setTimeout(() => resolve(\`Task \${item} completed in \${delay}ms\`), delay)
      );
    })
  );
  return results;
}

processQueue(['Auth', 'Database', 'Cache', 'Analytics']).then((logs) => {
  logs.forEach((log) => console.log('  ✓', log));
});
`,
    }
  ],
  cpp: [
    {
      id: 'cpp-hello',
      title: 'Hello World (C++20)',
      description: 'Standard C++20 starter with GCC 14.',
      code: `// ==========================================================
// Welcome to CodeSync - Real-time Collaborative Code Editor
// Language: C++ (GCC 14)
// ==========================================================

#include <iostream>
#include <string>

int main() {
    std::string name = "Developer";
    std::cout << "Hello, World! Welcome " << name << " to CodeSync." << std::endl;
    std::cout << "C++20 (GCC 14) runtime environment is ready." << std::endl;
    std::cout << "Press Ctrl+Enter / Cmd+Enter to execute your code." << std::endl;
    return 0;
}
`,
    }
  ],
  java: [
    {
      id: 'java-hello',
      title: 'Hello World (Java 21)',
      description: 'Standard Java 21 class definition.',
      code: `// ==========================================================
// Welcome to CodeSync - Real-time Collaborative Code Editor
// Language: Java (OpenJDK 21)
// ==========================================================

public class Main {
    public static void main(String[] args) {
        String name = "Developer";
        System.out.println("Hello, World! Welcome " + name + " to CodeSync.");
        System.out.println("Java 21 (OpenJDK) runtime environment is ready.");
        System.out.println("Press Ctrl+Enter / Cmd+Enter to execute your code.");
    }
}
`,
    }
  ]
};

export default function TemplatesModal({
  isOpen,
  onClose,
  language = 'python',
  onSelectTemplate,
}) {
  if (!isOpen) return null;

  const currentPresets = TEMPLATE_PRESETS[language] || TEMPLATE_PRESETS['python'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#30363d] bg-gradient-to-b from-[#1c232d] to-[#161b22] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Code Templates & Presets
              </h3>
              <p className="text-xs text-slate-400">
                Choose a starter template to load into your active file
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#30363d] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* List of presets */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {currentPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onSelectTemplate(preset.code);
                onClose();
              }}
              className="p-3.5 rounded-xl bg-[#21262d] hover:bg-[#283038] border border-[#30363d] hover:border-blue-500/50 cursor-pointer transition-all active:scale-98 group flex flex-col space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-100 group-hover:text-sky-400 transition-colors">
                  {preset.title}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  Insert
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {preset.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
