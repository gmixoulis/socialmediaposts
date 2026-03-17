import { db } from "./db/client.js";
import { posts } from "./db/schema.js";
import { count } from "drizzle-orm";

const FALLBACK: [string, string][] = [
  ["The Art of Clean Code", "Writing clean code creates software others can read and maintain long after you're gone."],
  ["Understanding REST APIs", "REST defines constraints for creating scalable web services over HTTP."],
  ["Docker in Production", "Containerisation ensures your app runs consistently from dev to prod."],
  ["JavaScript Promises Explained", "Promises represent the eventual completion or failure of an async operation."],
  ["The Power of TypeScript", "Static typing catches errors at compile time rather than runtime."],
  ["CSS Grid vs Flexbox", "Grid handles two-dimensional layouts; Flexbox excels at one-dimensional."],
  ["Building Accessible Web Apps", "Accessibility expands your audience and is simply the right thing to do."],
  ["Introduction to Machine Learning", "ML enables computers to learn from data without explicit programming."],
  ["Git Best Practices", "Commit often, push regularly, write meaningful commit messages."],
  ["Database Indexing Strategies", "Indexes turn O(n) table scans into O(log n) lookups."],
  ...([
    "Async/Await Deep Dive", "Microservices Architecture", "React Hooks Explained",
    "Python Data Classes", "GraphQL vs REST", "Redis Caching Patterns",
    "Load Balancing 101", "Kubernetes for Beginners", "The 12-Factor App",
    "Domain-Driven Design", "Event-Driven Architecture", "Web Security Essentials",
    "OAuth 2.0 Explained", "JWT Best Practices", "Testing Pyramid",
    "CI/CD Pipeline Setup", "Monitoring and Observability", "API Rate Limiting",
    "Database Sharding", "The CAP Theorem", "WebSockets vs HTTP",
    "Server-Sent Events", "Progressive Web Apps", "Web Performance Optimization",
    "Lazy Loading Images", "Code Review Culture", "Pair Programming Benefits",
    "Technical Debt Management", "Agile vs Waterfall", "Remote Work for Developers",
    "Open Source Contribution Guide", "Documentation as Code", "The Unix Philosophy",
    "Semantic Versioning", "Feature Flags in Production", "A/B Testing for Engineers",
    "Blue-Green Deployments", "Chaos Engineering", "Service Mesh Concepts",
    "gRPC Introduction", "Protocol Buffers Explained", "JSON Schema Validation",
    "API Versioning Strategies", "Error Handling Best Practices", "Logging Effectively",
    "Regular Expressions Guide", "Functional Programming Concepts", "Immutability Benefits",
    "Dependency Injection Patterns", "Design Patterns Overview", "SOLID Principles",
    "Refactoring Legacy Code", "Code Smells to Avoid", "Algorithm Complexity",
    "Data Structures Overview", "Graph Algorithms in Practice", "Dynamic Programming",
    "Recursion Explained", "Memory Management", "Concurrency vs Parallelism",
    "Thread Safety Patterns", "Reactive Programming", "Blockchain Fundamentals",
    "Smart Contracts Explained", "Cryptography Essentials", "TLS/SSL Deep Dive",
    "Network Protocols Explained", "DNS Resolution", "HTTP/2 and HTTP/3",
    "CDN Architecture", "Edge Computing", "Serverless Functions",
    "Cloud Native Development", "Infrastructure as Code", "Terraform Best Practices",
    "Ansible for Automation", "GitOps Workflow", "Zero Downtime Deployments",
    "Distributed Tracing", "API Gateway Patterns", "Event Sourcing Explained",
    "CQRS Pattern", "Hexagonal Architecture", "Test-Driven Development",
    "Behaviour-Driven Development", "Contract Testing", "Snapshot Testing",
    "Property-Based Testing", "Mutation Testing", "Performance Profiling",
    "Memory Leak Detection",
  ] as string[]).map((t, i): [string, string] => [
    t,
    `Understanding ${t.toLowerCase()} is foundational to modern software engineering.`,
  ]),
];

export async function seedPosts(): Promise<void> {
  const [{ total }] = await db.select({ total: count() }).from(posts);
  if (total >= 100) return;

  let data: { title: string; body: string; authorName: string }[] = [];

  try {
    const resp = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (resp.ok) {
      const raw = (await resp.json()) as { title: string; body: string; userId: number }[];
      data = raw.slice(0, 100).map((p) => ({
        title: p.title,
        body: p.body,
        authorName: `User ${p.userId}`,
      }));
      console.log(`Seeded ${data.length} posts from JSONPlaceholder.`);
    }
  } catch {
    // network unavailable → use fallback
  }

  if (data.length === 0) {
    data = FALLBACK.slice(0, 100).map(([title, body], i) => ({
      title,
      body,
      authorName: `User ${(i % 10) + 1}`,
    }));
    console.log(`Seeded ${data.length} posts from local fallback.`);
  }

  // Insert in batches of 50 to stay within SQLite parameter limits
  for (let i = 0; i < data.length; i += 50) {
    await db.insert(posts).values(data.slice(i, i + 50));
  }
}
