addEventListener('fetch', event => {
  event.respondWith(handleIncomingRequest(event.request));
});

async function handleIncomingRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      },
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

  console.log(`Query: "${searchKeyword}", Max: ${maxImages}, Method: ${parseMethod}`);

  const searchApiUrl = `https://image.baidu.com/search/flip?tn=baiduimage&word=${encodeURIComponent(searchKeyword)}`;

  try {
    const htmlContent = await fetchHtmlContent(searchApiUrl);

    if (!htmlContent) {
      return new Response(null, { status: 500 });
    }

    const imageUrls = parseMethod === 'HTML' 
      ? extractImageUrlsFromHTML(htmlContent, maxImages)
      : extractImageUrlsFromJSON(htmlContent, maxImages);

    if (!imageUrls) {
      return new Response(null, { status: 500 });
    }

    const jsonResponse = {
      code: 200,
      message: "success",
      time: Date.now(),
      data: imageUrls.map((data, index) => ({
        index: index + 1,
        title: data.title,
        url: data.imageUrl,
        thumbURL: data.imageThumbURL
      }))
    };

    return new Response(JSON.stringify(jsonResponse), {
			headers: getResponseHeaders(),
		});		
  } catch (error) {
    console.error("Error:", error);
    return new Response(null, { status: 500 });
  }
}

function getResponseHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
}

async function fetchHtmlContent(apiUrl) {
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.8263.533 Safari/537.36',
        'Accept-Language': 'zh,zh-CN;q=0.9',
        'Referer': 'https://www.baidu.com/',
      }
    });
    return await response.text();
  } catch (error) {
    console.error('Error fetching HTML content:', error);
    return null;
  }
}

function extractImageUrlsFromHTML(htmlContent, maxImages) {
  try {
    const startTime = performance.now();

    const imageUrls = [];

    const fromPageTitleMatches = htmlContent.match(/"fromPageTitle":"([^"]+)"/g);
    const objURLMatches = htmlContent.match(/"objURL":"(https?:\/\/[^\"]+)"/g);
    const thumbURLMatches = htmlContent.match(/"thumbURL":"(https?:\/\/[^\"]+)"/g);

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

          imageUrls.push({ title, imageUrl, imageThumbURL });
        }
      });
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
//    console.log(`HTML processing time: ${duration.toFixed(3)} ms`);

    return imageUrls;
  } catch (error) {
    console.error('Error extracting image data:', error);
    return null;
  }
}

function extractImageUrlsFromJSON(htmlContent, maxImages) {
  try {
    const startTime = performance.now();

    const regex = /flip.setData\('imgData',\s*(\{.*?\})\s*\);/;
    const match = htmlContent.match(regex);
    
    if (!match || !match[1]) {
      console.error('Failed to find imgData in HTML content');
      return null;
    }

    const imgData = JSON.parse(match[1]);

    const imageUrls = imgData.data.slice(0, maxImages).map(item => ({
      title: item.fromPageTitle || null,
      imageUrl: item.objURL || null,
      imageThumbURL: item.thumbURL || null
    }));

    const endTime = performance.now();
    const duration = endTime - startTime;
//    console.log(`JSON processing time: ${duration.toFixed(3)} ms`);

    return imageUrls;
  } catch (error) {
    console.error('Error extracting image JSON data:', error);
    return null;
  }
}
