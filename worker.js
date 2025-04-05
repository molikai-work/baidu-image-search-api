addEventListener('fetch', event => {
  event.respondWith(handleIncomingRequest(event.request));
});

/**
 * 处理传入的请求
 * @param {Request} request - 传入的请求对象
 * @returns {Promise<Response>} - 返回一个 Promise，包含响应对象
 */
async function handleIncomingRequest(request) {
  // 处理 OPTIONS 请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getResponseHeaders() });
  }

  const url = new URL(request.url);
  const searchKeyword = url.searchParams.get('q');
  const maxImages = Math.min(Math.max(parseInt(url.searchParams.get('max')) || 60, 1), 60);
  const parseMethod = url.searchParams.get('method')?.toLowerCase() === 'html' ? 'HTML' : 'JSON';

  // 如果没有提供搜索关键词
  if (!searchKeyword) {
    return new Response(
      JSON.stringify({
        code: 422,
        message: '缺少必填参数',
        time: Date.now(),
        data: null
      }),
      { status: 422, headers: getResponseHeaders() }
    );
  }

  try {
    // 构建百度和必应的搜索 URL
    const baiduUrl = `https://image.baidu.com/search/flip?tn=baiduimage&word=${encodeURIComponent(searchKeyword)}`;
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchKeyword)}&form=HDRSC3&first=1`;

    // 并行获取百度和必应的 HTML 内容
    const [baiduResult, bingResult] = await Promise.allSettled([
      fetchHtmlContent(baiduUrl),
      fetchHtmlContent(bingUrl)
    ]);

    // 处理获取的结果
    const baiduHtml = baiduResult.status === 'fulfilled' ? baiduResult.value : null;
    const bingHtml = bingResult.status === 'fulfilled' ? bingResult.value : null;

    // 提取百度和必应的图片 URL
    const baiduImageUrls = baiduHtml ? getBaiduImages(baiduHtml, parseMethod, maxImages) : [];
    const bingImageUrls = bingHtml ? getBingImages(bingHtml, maxImages) : [];

    // 构建响应数据
    const jsonResponse = {
      code: 200,
      message: 'success',
      time: Date.now(),
      data: { baidu: baiduImageUrls, bing: bingImageUrls }
    };

    // 返回 JSON 响应
    return new Response(JSON.stringify(jsonResponse), { headers: getResponseHeaders() });
  } catch (error) {
    console.error('处理请求时出错:', error);
    // 返回错误响应
    return new Response(
      JSON.stringify({
        code: 500,
        message: '服务器内部错误',
        time: Date.now(),
        data: null
      }),
      { status: 500, headers: getResponseHeaders() }
    );
  }
}

/**
 * 获取响应头
 * @returns {Object} - 响应头对象
 */
function getResponseHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * 获取 HTML 内容
 * @param {string} apiUrl - API URL
 * @returns {Promise<string|null>} - 返回 HTML 内容或 null
 */
async function fetchHtmlContent(apiUrl) {
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.8263.533 Safari/537.36',
        'Accept-Language': 'zh,zh-CN;q=0.9',
        'Referer': 'https://www.baidu.com/'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('获取 HTML 失败:', error);
    return null;
  }
}

/**
 * 获取百度图片 URL
 * @param {string} htmlContent - HTML 内容
 * @param {string} parseMethod - 解析方法 ('HTML' 或 'JSON')
 * @param {number} maxImages - 最大图片数量
 * @returns {Array} - 图片 URL 数组
 */
function getBaiduImages(htmlContent, parseMethod, maxImages) {
  return parseMethod === 'HTML'
    ? extractImageUrlsFromHTML(htmlContent, maxImages)
    : extractImageUrlsFromJSON(htmlContent, maxImages);
}

/**
 * 从 HTML 中提取图片 URL
 * @param {string} htmlContent - HTML 内容
 * @param {number} maxImages - 最大图片数量
 * @returns {Array} - 图片 URL 数组
 */
function extractImageUrlsFromHTML(htmlContent, maxImages) {
  try {
    const imageUrls = [];
    const fromPageTitleMatches = htmlContent.match(/"fromPageTitle":"([^"]+)"/g) || [];
    const objURLMatches = htmlContent.match(/"objURL":"(https?:\/\/[^"]+)"/g) || [];
    const thumbURLMatches = htmlContent.match(/"thumbURL":"(https?:\/\/[^"]+)"/g) || [];

    objURLMatches.slice(0, maxImages).forEach((match, index) => {
      const title = fromPageTitleMatches[index]?.split('"')[3] || null;
      const imageUrl = match.split('"')[3];
      const imageThumbURL = thumbURLMatches[index]?.split('"')[3] || null;
      imageUrls.push({ index: index + 1, title, url: imageUrl, thumbURL: imageThumbURL });
    });

    return imageUrls;
  } catch (error) {
    console.error('HTML 解析错误:', error);
    return [];
  }
}

/**
 * 从 JSON 中提取图片 URL
 * @param {string} htmlContent - HTML 内容
 * @param {number} maxImages - 最大图片数量
 * @returns {Array} - 图片 URL 数组
 */
function extractImageUrlsFromJSON(htmlContent, maxImages) {
  try {
    const regex = /flip.setData\('imgData',\s*(\{.*?\})\s*\);/;
    const match = htmlContent.match(regex);
    if (!match || !match[1]) return [];

    const imgData = JSON.parse(match[1]);
    return imgData.data.slice(0, maxImages).map((item, index) => ({
      index: index + 1,
      title: item.fromPageTitle || '',
      url: item.objURL || '',
      thumbURL: item.thumbURL || ''
    }));
  } catch (error) {
    console.error('JSON 解析错误:', error);
    return [];
  }
}

/**
 * 获取必应图片 URL
 * @param {string} htmlContent - HTML 内容
 * @param {number} maxImages - 最大图片数量
 * @returns {Array} - 图片 URL 数组
 */
function getBingImages(htmlContent, maxImages) {
  return extractImageUrlsFromBing(htmlContent, maxImages);
}

/**
 * 从必应 HTML 中提取图片 URL
 * @param {string} htmlContent - HTML 内容
 * @param {number} maxImages - 最大图片数量
 * @returns {Array} - 图片 URL 数组
 */
function extractImageUrlsFromBing(htmlContent, maxImages) {
  try {
    const imageUrls = [];
    const regex = /class="iusc"[^>]*?m="([^"]+)"/g;
    let match;
    let index = 1;

    while ((match = regex.exec(htmlContent)) !== null && imageUrls.length < maxImages) {
      const jsonStr = match[1]
        .replace(/&quot;/g, '"')
        .replace(/\\u002f/g, '/')
        .replace(/\\\\/g, '\\');

      try {
        const meta = JSON.parse(jsonStr);
        const imageUrl = meta.murl || null;
        const imageThumbURL = meta.turl || null;
        const title = meta.t || meta.desc || 'Bing Image';

        if (imageUrl && imageThumbURL) {
          imageUrls.push({ index: index++, title, url: imageUrl, thumbURL: imageThumbURL });
        }
      } catch (parseErr) {
        continue; // 忽略解析错误的 JSON
      }
    }

    return imageUrls;
  } catch (error) {
    console.error('Bing 提取错误:', error);
    return [];
  }
}
