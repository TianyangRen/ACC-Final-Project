# 电动牙刷分析系统技术文档

## 1. 项目概述
本项目是一个基于 **React** (前端) 和 **Spring Boot** (后端) 的全栈应用程序，旨在对电动牙刷产品进行搜索、分析和比较。项目通过读取 CSV 数据源，利用多种高级数据结构和算法（如 Trie、Boyer-Moore、红黑树等）实现了高效的搜索、拼写检查、自动补全和相关性排序功能。

## 2. 系统架构
- **前端**: React.js, Axios (用于 API 请求)
- **后端**: Java Spring Boot 3.x
- **数据存储**: 内存数据结构 (加载自 `all_toothbrushes.csv`)，MongoDB (用户认证)
- **构建工具**: Maven (后端), npm (前端)

## 3. 核心模块与算法实现细节

### 3.1 拼写检查 (Spell Checking) - Task 1
*   **目标**: 当用户输入错误的单词或词组时，提供纠错建议。
*   **实现原理**:
    *   **数据结构**: 使用 **Trie (字典树)** 存储从产品数据中提取的所有词汇（Vocabulary）。
    *   **算法**: **编辑距离 (Edit Distance / Levenshtein Distance)** + **组合搜索验证**。
*   **实现步骤**:
    1.  系统启动时，解析 CSV 文件，将所有产品名称分词后插入 Trie 中。
    2.  当用户输入单词或词组时，首先分词并在 Trie 中逐个查找是否存在（O(L) 时间复杂度，L为单词长度）。
    3.  **单词纠错**: 如果输入是单个单词且不存在，系统会获取词汇表中的所有单词，计算编辑距离，按距离排序返回前 5 个建议。
    4.  **词组纠错**: 如果输入是多个单词，系统会逐词进行纠错，为每个错误单词生成候选列表（编辑距离 ≤ 2），然后组合候选词并验证组合后的词组是否在产品数据中存在真实匹配结果。
    5.  使用排序算法（Java Stream API 的 TimSort）按编辑距离从小到大排序。
*   **关键类**: `SearchEngineService.checkSpelling`, `EditDistance`, `Trie`

### 3.2 单词补全 (Word Completion) - Task 2
*   **目标**: 根据用户输入的前缀，实时推荐可能的完整单词。
*   **实现原理**:
    *   **数据结构**: **Trie (字典树)**。
*   **实现步骤**:
    1.  在 Trie 中根据输入的前缀字符逐层向下遍历。
    2.  定位到前缀对应的 TrieNode 节点。
    3.  从该节点开始，使用深度优先搜索 (DFS) 递归遍历所有子节点。
    4.  收集所有标记为 `isEndOfWord` 的路径，组合成完整单词返回。
*   **关键类**: `Trie.findWordsWithPrefix`

### 3.3 词频统计 (Frequency Count) - Task 3
*   **目标**: 统计特定单词在所有产品描述中出现的总次数，用于分析热词。
*   **实现原理**:
    *   **算法**: **Boyer-Moore 字符串搜索算法**。
*   **实现步骤**:
    1.  针对查询词构建 Boyer-Moore 的坏字符规则表 (Bad Character Heuristic)。为了支持 Unicode 字符，字符集大小 (Radix) 设为 65536。
    2.  遍历所有产品的文本内容。
    3.  利用 Boyer-Moore 算法的跳跃特性，高效计算单词在文本中的出现次数。
*   **关键类**: `BoyerMoore`

### 3.4 搜索频率追踪 (Search Frequency) - Task 4
*   **目标**: 记录用户搜索行为，展示热门搜索排行。
*   **实现原理**:
    *   **数据结构**: **红黑树 (Red-Black Tree)**，Java 中使用 `TreeMap` 实现。
*   **实现步骤**:
    1.  维护一个 `Map<String, Integer>` 来存储搜索词及其频率。
    2.  每次用户发起搜索请求时，更新 Map 中对应词的计数。
    3.  获取排行榜时，将 Map 的 Entry 集合转换为流 (Stream)。
    4.  按 Value (频率) 降序排序，截取前 10 个返回给前端。
*   **关键类**: `SearchEngineService.trackSearch`

### 3.5 页面/产品排名 (Page Ranking) - Task 5
*   **目标**: 根据搜索关键词在产品信息中出现的频率对产品进行相关性排序，支持多词搜索的 AND 逻辑。
*   **实现原理**:
    *   **算法组合**: **倒排索引 (Inverted Index)** + **集合交集运算** + **Boyer-Moore** + **排序**。
*   **实现步骤**:
    1.  **查询分词**: 将用户输入的查询字符串按非字母字符分割成多个单词（例如 "usmile exclusive" → ["usmile", "exclusive"]）。
    2.  **初步筛选**: 利用 **倒排索引** (Task 6) 为每个单词快速获取包含该单词的产品集合。
    3.  **交集过滤 (AND 逻辑)**: 对所有单词的产品集合求交集 (`Set.retainAll`)，只保留同时包含所有搜索词的产品。
    4.  **品牌过滤**: 如果用户选择了特定品牌，进一步过滤产品列表。
    5.  **评分计算**: 对每个候选产品，使用 **Boyer-Moore** 算法计算每个搜索词在产品名称中的出现次数总和，作为相关性分数。如果查询包含多个词，额外检查完整短语的匹配并赋予更高权重（10倍）。
    6.  **排序**: 按相关性分数从高到低排序；支持按价格升序/降序进行二次排序。
*   **关键类**: `SearchEngineService.searchProducts`

### 3.6 倒排索引 (Inverted Indexing) - Task 6
*   **目标**: 实现 O(1) 级别的文档查找，即通过单词直接找到包含该单词的所有产品。
*   **实现原理**:
    *   **数据结构**: 增强型的 **Trie (字典树)**。
*   **实现步骤**:
    1.  修改 `TrieNode` 类，增加一个 `List<Object> references` 字段。
    2.  在构建 Trie (插入单词) 时，将当前产品对象 (`Product`) 的引用添加到该单词末尾节点的 `references` 列表中。
    3.  搜索时，只需在 Trie 中找到单词对应的节点，即可直接获取该节点存储的所有产品引用列表。
*   **关键类**: `TrieNode`, `Trie.insert`, `Trie.searchReferences`

### 3.7 正则表达式 (Regular Expressions)
*   **目标**: 用于数据清洗、文本分词以及前端表单验证。
*   **后端应用 (`SearchEngineService.java`)**:
    *   **分词**: 使用 `\\W+` (非单词字符) 将搜索查询和产品名称分割成单词数组，用于构建 Trie 和搜索。
    *   **价格解析**: 使用 `[^\\d.]` (非数字和非小数点) 清洗价格字符串，提取数值进行排序。
*   **前端应用 (`LoginModal.js`)**:
    *   **姓名验证**: `/^[a-zA-Z]+$/` 确保姓名只包含字母。
    *   **邮箱验证**: `/^[a-zA-Z0-9._%+-]+@(gmail|yahoo|hotmail|outlook)\.(com|net|org|ca)$/` 限制特定域名的邮箱注册。
    *   **密码强度**: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/` 强制密码包含大小写字母和数字，长度8-32位。

## 4. 后端 API 接口说明

| 方法 | 路径 | 描述 | 参数 |
| :--- | :--- | :--- | :--- |
| GET | `/api/brands` | 获取所有可用品牌列表 | 无 |
| GET | `/api/products` | 获取所有产品列表（支持排序和品牌过滤） | `sort`: 排序方式 (default/price_asc/price_desc)<br>`brands`: 品牌列表（逗号分隔） |
| GET | `/api/search` | 搜索产品（包含排名逻辑、多词AND搜索、品牌过滤） | `query`: 搜索关键词<br>`sort`: 排序方式<br>`brands`: 品牌列表 |
| GET | `/api/spellcheck` | 检查拼写并提供建议（支持单词和词组） | `word`: 待检查单词或词组 |
| GET | `/api/autocomplete` | 获取自动补全建议 | `prefix`: 单词前缀 |
| GET | `/api/frequency` | 获取单词在语料库中的总频率 | `word`: 单词 |
| GET | `/api/top-searches` | 获取搜索频率最高的前10个词 | 无 |

## 5. 目录结构说明

```
backend/
├── src/main/java/com/toothbrush/
│   ├── controller/       # REST API 控制器 (SearchController)
│   ├── model/            # 数据模型 (Product)
│   ├── service/          # 业务逻辑 (SearchEngineService)
│   └── util/             # 工具类与算法实现
│       ├── BoyerMoore.java   # 字符串搜索算法
│       ├── EditDistance.java # 编辑距离算法
│       ├── Trie.java         # 字典树实现
│       └── TrieNode.java     # 字典树节点
└── pom.xml               # Maven 依赖配置

frontend/
├── src/
│   ├── components/       # React 组件
│   │   └── LoginModal.js # 用户登录/注册模态框
│   ├── App.js            # 主应用逻辑
│   ├── App.css           # 样式文件
│   ├── index.js          # 入口文件
│   └── index.css         # 全局样式
└── package.json          # NPM 依赖配置
```

## 6. 新增功能说明

### 6.1 多词搜索与词组纠错
*   **功能**: 支持用户输入多个单词进行搜索（例如："usmile exclusive"），系统会找到同时包含所有单词的产品（AND 逻辑）。
*   **拼写纠错增强**: 对于多词查询，系统会逐词进行拼写检查，并验证纠正后的词组是否有真实的搜索结果。
*   **技术实现**: 
    - 查询分词 (`split("\\W+")`)
    - 倒排索引交集运算 (`Set.retainAll`)
    - 组合候选词验证

### 6.2 品牌筛选
*   **功能**: 用户可以在导航栏中选择一个或多个品牌来过滤搜索结果。
*   **技术实现**:
    - 后端提供 `/api/brands` 接口，返回所有唯一品牌列表
    - 前端使用多选下拉菜单，支持复选框选择
    - 搜索和产品列表请求时携带 `brands` 参数进行过滤

### 6.3 无结果提示
*   **功能**: 当搜索没有结果时，显示友好的提示信息，引导用户更换关键词。
*   **UI实现**: 在产品列表区域显示 "No results found" 消息和建议文本。

### 6.4 用户认证系统
*   **功能**: 用户可以注册、登录账户，实现个性化体验。
*   **技术栈**: MongoDB 存储用户数据，Spring Boot 提供 REST API。
*   **前端**: React 模态框 (`LoginModal`) 处理用户交互。
