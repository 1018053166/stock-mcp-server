# 股票信息查询MCP服务 📈

从东方财富网实时爬取股票数据的MCP服务，支持实时行情、K线、排行榜、股东数据等多种功能。

## ✨ 功能特性

### 实时行情
- ✅ 单只股票实时数据查询
- ✅ 批量股票数据获取
- ✅ 股票搜索（代码/名称）

### K线数据
- ✅ 日K/周K/月K线
- ✅ 1/5/15/30/60分钟线
- ✅ 自定义数据量

### 市场分析
- ✅ 涨跌幅排行榜
- ✅ 行业板块排行
- ✅ 市场概况（沪深指数）

### 股东数据
- ✅ 股东人数历史变化
- ✅ 十大流通股东
- ✅ 股东增长趋势分析

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
npm start
```

### 3. 配置MCP客户端

将以下配置添加到MCP客户端配置文件（如Claude Desktop的`claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "stock-server": {
      "command": "node",
      "args": ["/Users/work/projects/leecode/src/index.js"]
    }
  }
}
```

## 📚 API工具列表

### 1. get_stock_realtime
获取股票实时行情数据

**参数：**
- `stockCode` (string): 股票代码，如 "000001", "600000"

**返回数据：**
```json
{
  "stockCode": "000001",
  "stockName": "平安银行",
  "currentPrice": 12.50,
  "changePercent": 1.50,
  "changeAmount": 0.18,
  "openPrice": 12.35,
  "highPrice": 12.60,
  "lowPrice": 12.30,
  "volume": 125000,
  "turnover": 1550000,
  "amplitude": 2.43,
  "turnoverRate": 0.85,
  "pe": 5.20,
  "pb": 0.65
}
```

### 2. batch_get_stocks
批量获取多只股票数据

**参数：**
- `stockCodes` (array): 股票代码数组，如 `["000001", "600000"]`

### 3. search_stock
搜索股票

**参数：**
- `keyword` (string): 股票代码或名称关键词

### 4. get_kline
获取K线数据

**参数：**
- `stockCode` (string): 股票代码
- `period` (string): 周期类型
  - `101`: 日K线
  - `102`: 周K线
  - `103`: 月K线
  - `1`: 1分钟
  - `5`: 5分钟
  - `15`: 15分钟
  - `30`: 30分钟
  - `60`: 60分钟
- `count` (number): 获取数量，默认100

### 5. get_rank_list
获取涨跌幅排行榜

**参数：**
- `type` (string): `up`-涨幅榜 / `down`-跌幅榜，默认`up`
- `count` (number): 获取数量，默认20

### 6. get_sector_rank
获取行业板块排行

**参数：**
- `count` (number): 获取数量，默认20

### 7. get_market_overview
获取市场概况

返回上证指数、深证成指、创业板指三大指数实时数据

### 8. get_shareholder_count
获取股东人数数据

**参数：**
- `stockCode` (string): 股票代码

**返回数据：**
```json
{
  "stockCode": "000001",
  "shareholderData": [
    {
      "endDate": "2024-03-31",
      "holderNum": 685234,
      "holderNumChange": 12345,
      "holderNumChangeRate": 1.83,
      "avgHoldingAmount": 45678.90
    }
  ],
  "latestHolderNum": 685234,
  "latestChange": 12345,
  "latestChangeRate": 1.83
}
```

### 9. get_top_ten_holders
获取十大流通股东

**参数：**
- `stockCode` (string): 股票代码

### 10. get_shareholder_trend
获取股东增长趋势分析

**参数：**
- `stockCode` (string): 股票代码

**返回数据：**
```json
{
  "stockCode": "000001",
  "trend": "increasing",
  "trendDescription": "持续增长",
  "avgChangeRate": "2.15",
  "analysis": {
    "increasePeriods": 3,
    "decreasePeriods": 1,
    "totalPeriods": 4,
    "latestHolderNum": 685234,
    "latestChange": 12345
  }
}
```

## 🛠️ 技术栈

- **Node.js** - ES Modules
- **@modelcontextprotocol/sdk** - MCP协议实现
- **axios** - HTTP请求库
- **东方财富网API** - 数据源

## 📁 项目结构

```
leecode/
├── src/
│   ├── index.js      # MCP服务器主文件
│   └── fetcher.js    # 股票数据爬取模块
├── package.json      # 项目配置
├── mcp-config.json   # MCP配置示例
└── README.md         # 说明文档
```

## ⚠️ 注意事项

1. 请合理使用API，避免频繁请求导致IP被封
2. 批量查询会在请求之间自动延迟200ms
3. 数据来源于东方财富网，仅供参考，不构成投资建议
4. 股东数据使用SECUCODE格式（如"000001.SZ"），系统会自动处理

## 📝 使用示例

在支持MCP的客户端中（如Claude Desktop），可以直接调用工具：

```
帮我查询平安银行的实时行情
获取贵州茅台最近100天的日K线
显示今天涨幅前20的股票
分析宁德时代的股东增长趋势
```

## 🔄 更新日志

### v1.0.0 (2025-12-26)
- ✅ 实现基础实时行情查询
- ✅ 添加K线数据支持
- ✅ 添加排行榜功能
- ✅ 添加股东数据分析
- ✅ 移除数据库依赖，纯实时查询

## 📄 License

MIT

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📧 联系方式

如有问题或建议，欢迎联系。
