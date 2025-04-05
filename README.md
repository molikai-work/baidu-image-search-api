# Baidu Image Search API
## 简介
这是一个简单的使用 Cloudflare Workers 部署的百度和必应搜索图片 API。

注意：未使用任何 API，程序是直接解析 HTML 页面得来的数据，不保证稳定性，有时可能会出现获取不到数据的情况。

## 部署
直接部署到 Cloudflare Workers 即可。

## 使用
### 请求方法
- HTTP 方法：GET
- 请求 URL：https://example.workers.dev/

### 请求参数
| 参数名 |   类型   | 必填 |   描述   |
|--------|--------|------|----------|
|   q    | string |  是  | 搜索关键词，例如 `furry`。 |
|  max   |  int   |  否  | 百度图片返回的数量，默认为 `60`，最小为 `1`，最大为 `60`。 |
| method | string |  否  | 百度图片解析方法，`html` 或 `json`，默认为 `json`。 |

### 响应格式
GET https://example.workers.dev/?q=furry

```json
{
  "code": 200, // 状态码
  "message": "success", // 返回的消息
  "time": 1743865000000, // 请求时间戳
  "data": { // 内容数据
    "baidu": [ // 百度来源
      {
        "index": 1, // 顺序索引号
        "title": "<strong>furry</strong> 兽控诱捕器-动物视频-搜狐视频", // 图片标题
        "url": "https://e3f49eaa46b57.cdn.sohucs.com/2022/2/23/1/5/MTAwMTM1XzE2NDU1NDk1MjUxMjA=.jpg", // 图片原始 URL
        "thumbURL": "https://img1.baidu.com/it/u=3607605448,743716640&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=500" // 图片在搜索引擎的 URL
      },
      {
        "index": 2,
        "title": "【<strong>furry</strong>/绘画过程】从黑暗中将你救赎",
        "url": "https://e3f49eaa46b57.cdn.sohucs.com/2021/12/9/19/50/MTAwMTM1XzE2MzkwNTA2NDc0MjE=.jpg",
        "thumbURL": "https://img2.baidu.com/it/u=3959076932,3694806540&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=500"
      }
      // ...
    ],
    "bing": [ // 必应来源
      {
        "index": 1,
        "title": "Furry - Wicipedia",
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/fb/Anthro_vixen_colored.jpg",
        "thumbURL": "https://ts1.mm.bing.net/th?id=OIP.GBcO_p7LHyh34SUhZgX5UwHaHa&amp;pid=15.1"
      },
      {
        "index": 2,
        "title": "Furry - v1.0 | Stable Diffusion Embedding | Civitai",
        "url": "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/6bb0f894-e6a8-42f9-a6e1-7275232f61b5/width=1200/6bb0f894-e6a8-42f9-a6e1-7275232f61b5.jpeg",
        "thumbURL": "https://ts4.mm.bing.net/th?id=OIP.5XLvBf52PZ22y-2oWftNlQHaJh&amp;pid=15.1"
      }
      // ...
    ]
  }
}
```

## 许可证
[AGPL-3.0](LICENSE)
