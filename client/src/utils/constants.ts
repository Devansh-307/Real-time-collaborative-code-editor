import { LanguageOption } from '../types';

export const SERVER_HTTP_URL =
  import.meta.env.VITE_SERVER_HTTP_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000`;

export const SERVER_WS_URL =
  import.meta.env.VITE_SERVER_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:4000`;

export const DEFAULT_LANGUAGES: LanguageOption[] = [
  {
    id: 'python',
    name: 'Python 3',
    monacoLanguage: 'python',
    defaultCode: `def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

print("=== Collaborative Python Demo ===")
for i, num in enumerate(fibonacci(10)):
    print(f"Fib({i}) = {num}")
`,
  },
  {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    monacoLanguage: 'javascript',
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
  {
    id: 'cpp',
    name: 'C++ (GCC 12)',
    monacoLanguage: 'cpp',
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
  {
    id: 'c',
    name: 'C (GCC)',
    monacoLanguage: 'c',
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
  {
    id: 'java',
    name: 'Java (OpenJDK 17)',
    monacoLanguage: 'java',
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
  {
    id: 'go',
    name: 'Go',
    monacoLanguage: 'go',
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
  {
    id: 'rust',
    name: 'Rust',
    monacoLanguage: 'rust',
    defaultCode: `fn main() {
    println!("=== Rust Sandboxed Runner ===");
    let numbers = vec![1, 2, 3, 4, 5];
    let squares: Vec<i32> = numbers.iter().map(|&x| x * x).collect();
    
    println!("Original: {:?}", numbers);
    println!("Squared:  {:?}", squares);
}
`,
  },
  {
    id: 'bash',
    name: 'Bash',
    monacoLanguage: 'shell',
    defaultCode: `echo "=== Environment Info ==="
echo "Date: $(date)"
echo "Kernel: $(uname -a)"
echo "User: $(whoami)"
`,
  },
];
