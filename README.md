# Baidu Image Search API
## 简介
这是一个简单的使用 Cloudflare Workers 部署的百度搜索图片 API。

## 部署
直接部署到 Cloudflare Workers 即可。

## 使用
### GET 请求
- `q` (必选): 搜索关键词。
- `max` (可选): 返回的最大图片数量，最小为 `1`，最大为 `60`，默认 `60`。
- `method` (可选): `html` 或 `json`，程序直接解析 HTML ，或提取出 JSON 后解析，默认 `json`。

### 响应示例
```json
{
  "code": 200, // 响应状态码
  "message": "success", // 响应信息
  "time": 1627290934123, // 当前时间戳
  "data": [
    {
      "index": 1, // 顺序索引号
      "title": "Cat image 1", // 图像的标题
      "url": "https://example.com/image1.jpg", // 图像的原 URL
      "thumbURL": "https://thumb。example.com/image1.jpg" // 图像在搜索引擎服务器的 URL
    },
    {
      "index": 2,
      "title": "Cat image 2",
      "url": "https://example.com/image2.jpg",
      "thumbURL": "https://example.com/thumb2.jpg"
    }
  ]
}
```

## 许可证
[AGPL-3.0](LICENSE)
