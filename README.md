# Baidu Image Search API
## 简介
这是一个简单的使用 Cloudflare Workers 部署的百度和bing搜索图片 API。

注意：未使用任何 API，程序是直接解析 HTML 页面得来的数据，不保证稳定性，且baidu有时会出现获取不到数据的情况

## 部署
直接部署到 Cloudflare Workers 即可。

## 使用
### GET 请求
- `q` (必选): 搜索关键词。
- `max` (可选): 返回的最大图片数量，最小为 `1`，最大为 `60`，默认 `60`。


### 响应示例
```json
{
  "code": 200, // 响应状态码
  "message": "success", // 响应信息
  "time": 1627290934123, // 当前时间戳
  "data": [
  "data": {
    "baidu": [ {
        "index": 1,// 顺序索引号
        "title": "Fructose – NutraWiki",// 图像的标题
        "url": "https://nutrawiki.org/wp-content/uploads/2015/03/fructose.png",// 图像的原始 URL
        "thumbURL": "https://ts3.mm.bing.net/th?id=OIP.7zVy7JkzTjJqYoQg1t4bywHaFm&amp;pid=15.1"// 图像在搜索引擎的 URL
      },
      {
        "index": 2,
        "title": "Fructose - Assignment Point",
        "url": "https://assignmentpoint.com/wp-content/uploads/2017/08/Fructose.jpg",
        "thumbURL": "https://ts3.mm.bing.net/th?id=OIP.wx3Om3QlNfd-2EaS01JD4AHaDt&amp;pid=15.1"
      }],
    "bing": [
      {
        "index": 1,
        "title": "Fructose – NutraWiki",
        "url": "https://nutrawiki.org/wp-content/uploads/2015/03/fructose.png",
        "thumbURL": "https://ts3.mm.bing.net/th?id=OIP.7zVy7JkzTjJqYoQg1t4bywHaFm&amp;pid=15.1"
      },
      {
        "index": 2,
        "title": "Fructose - Assignment Point",
        "url": "https://assignmentpoint.com/wp-content/uploads/2017/08/Fructose.jpg",
        "thumbURL": "https://ts3.mm.bing.net/th?id=OIP.wx3Om3QlNfd-2EaS01JD4AHaDt&amp;pid=15.1"
      },
    ]
  ]
}
```

## 许可证
[AGPL-3.0](LICENSE)
