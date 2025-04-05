addEventListener('fetch', event => {
  event.respondWith(handleIncomingRequest(event.request));
});

async function handleIncomingRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: getResponseHeaders()
    });
  }

  const url = new URL(request.url);
  const searchKeyword = url.searchParams.get('q');
  const maxImages = Math.min(Math.max(parseInt(url.searchParams.get('max')) || 60, 1), 60);
  const parseMethod = url.searchParams.get('method')?.toLowerCase() === 'html' ? 'HTML' : 'JSON';

  if (!searchKeyword) {
    return new Response(
      JSON.stringify({
        code: 400,
        message: '请提供 q 参数',
        time: Date.now(),
        data: null
      }),
      { status: 400, headers: getResponseHeaders() }
    );
  }

  try {
    const baiduUrl = `https://image.baidu.com/search/flip?tn=baiduimage&word=${encodeURIComponent(searchKeyword)}`;
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchKeyword)}&form=HDRSC3&first=1`;

    const [baiduHtml, bingHtml] = await Promise.all([
      fetchHtmlContent(baiduUrl),
      fetchHtmlContent(bingUrl)
    ]);

    const baiduImageUrls = parseMethod === 'HTML'
      ? extractImageUrlsFromHTML(baiduHtml, maxImages)
      : extractImageUrlsFromJSON(baiduHtml, maxImages);

    const bingImageUrls = extractImageUrlsFromBing(bingHtml, maxImages);

    const jsonResponse = {
      code: 200,
      message: "success",
      time: Date.now(),
      data: {
        baidu: baiduImageUrls,
        bing: bingImageUrls
      }
    };

    return new Response(JSON.stringify(jsonResponse), {
      headers: getResponseHeaders()
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(null, { status: 500 });
  }
}

function getResponseHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

async function fetchHtmlContent(apiUrl) {
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.8263.533 Safari/537.36',
        'Accept-Language': 'zh,zh-CN;q=0.9',
        'Referer': 'https://www.baidu.com/'
      }
    });
    return await response.text();
  } catch (error) {
    console.error('Fetch HTML error:', error);
    return null;
  }
}

function extractImageUrlsFromHTML(htmlContent, maxImages) {
  try {
    const imageUrls = [];
    const fromPageTitleMatches = htmlContent.match(/"fromPageTitle":"([^"]+)"/g);
    const objURLMatches = htmlContent.match(/"objURL":"(https?:\/\/[^"]+)"/g);
    const thumbURLMatches = htmlContent.match(/"thumbURL":"(https?:\/\/[^"]+)"/g);

    if (objURLMatches) {
      objURLMatches.forEach((match, index) => {
        if (index < maxImages) {
          const title = fromPageTitleMatches && fromPageTitleMatches[index]
            ? fromPageTitleMatches[index].split('"')[3]
            : null;
          const imageUrl = match.split('"')[3];
          const imageThumbURL = thumbURLMatches && thumbURLMatches[index]
            ? thumbURLMatches[index].split('"')[3]
            : null;

          imageUrls.push({ index: index + 1, title, url: imageUrl, thumbURL: imageThumbURL });
        }
      });
    }
    return imageUrls;
  } catch (err) {
    console.error('HTML parse error:', err);
    return [];
  }
}

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
  } catch (err) {
    console.error('JSON parse error:', err);
    return [];
  }
}

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
          imageUrls.push({
            index: index++,
            title: title,
            url: imageUrl,
            thumbURL: imageThumbURL
          });
        }
      } catch (parseErr) {
        continue; // ignore broken JSON
      }
    }

    return imageUrls;
  } catch (err) {
    console.error('Bing extract error:', err);
    return [];
  }
}
