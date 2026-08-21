export interface LanguageConfig {
  id: string;
  name: string;
  filename: string;
  monacoLanguage: string;
  runCommand: string;
  defaultCode: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  python: {
    id: 'python',
    name: 'Python 3',
    filename: 'main.py',
    monacoLanguage: 'python',
    runCommand: 'python3 main.py',
    defaultCode: `def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

print("=== Fibonacci Sequence ===")
for i, num in enumerate(fibonacci(10)):
    print(f"Fib({i}) = {num}")
`,
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    filename: 'main.js',
    monacoLanguage: 'javascript',
    runCommand: 'node main.js',
    defaultCode: `// Real-Time Collaborative JavaScript Runner
const users = ['Alice', 'Bob', 'Charlie'];

function greetCollaborators(team) {
  console.log("Active Session Participants:");
  team.forEach((name, idx) => {
    console.log(\`  \${idx + 1}. \${name}\`);
  });
}

greetCollaborators(users);
console.log("Memory usage:", process.memoryUsage().heapUsed, "bytes");
`,
  },
  cpp: {
    id: 'cpp',
    name: 'C++ (GCC 12)',
    filename: 'main.cpp',
    monacoLanguage: 'cpp',
    runCommand: 'g++ -O2 -std=c++17 -o main main.cpp && ./main',
    defaultCode: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "CRDT Code Execution: C++17\\n";
    std::vector<int> nums = {10, 20, 30, 40, 50};
    
    int sum = std::accumulate(nums.begin(), nums.end(), 0);
    std::cout << "Sum of elements: " << sum << "\\n";
    
    return 0;
}
`,
  },
  c: {
    id: 'c',
    name: 'C (GCC)',
    filename: 'main.c',
    monacoLanguage: 'c',
    runCommand: 'gcc -O2 -o main main.c && ./main',
    defaultCode: `#include <stdio.h>

int main() {
    printf("Hello from Sandboxed C in Docker!\\n");
    for (int i = 1; i <= 5; ++i) {
        printf("Step %d\\n", i);
    }
    return 0;
}
`,
  },
  java: {
    id: 'java',
    name: 'Java (OpenJDK 17)',
    filename: 'Main.java',
    monacoLanguage: 'java',
    runCommand: 'javac Main.java && java Main',
    defaultCode: `import java.util.List;

public class Main {
    public static void main(String[] args) {
        System.out.println("Java Sandboxed Execution");
        List<String> items = List.of("CRDT", "Yjs", "Monaco", "Docker");
        items.forEach(item -> System.out.println("Feature: " + item));
    }
}
`,
  },
  go: {
    id: 'go',
    name: 'Go',
    filename: 'main.go',
    monacoLanguage: 'go',
    runCommand: 'go run main.go',
    defaultCode: `package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println("Concurrent Go Execution in Sandboxed Container")
	ch := make(chan string)

	go func() {
		time.Sleep(100 * time.Millisecond)
		ch <- "Message from goroutine"
	}()

	fmt.Println(<-ch)
}
`,
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    filename: 'main.rs',
    monacoLanguage: 'rust',
    runCommand: 'rustc -O -o main main.rs && ./main',
    defaultCode: `fn main() {
    println!("=== Rust Sandboxed Runner ===");
    let numbers = vec![1, 2, 3, 4, 5];
    let squares: Vec<i32> = numbers.iter().map(|&x| x * x).collect();
    
    println!("Original: {:?}", numbers);
    println!("Squared:  {:?}", squares);
}
`,
  },
  bash: {
    id: 'bash',
    name: 'Bash',
    filename: 'script.sh',
    monacoLanguage: 'shell',
    runCommand: 'bash script.sh',
    defaultCode: `echo "=== Environment Info ==="
echo "Date: $(date)"
echo "Kernel: $(uname -a)"
echo "User: $(whoami)"
`,
  },
};
