export interface SocialCredentials {
  platform: string;
  access_token: string;
  refresh_token?: string;
  user_id?: string;
  api_config?: Record<string, unknown>;
}

export interface PostPayload {
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  title?: string;
}

export interface PostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  platform: string;
}

// ---------- Twitter/X API v2 ----------

async function postToTwitter(creds: SocialCredentials, payload: PostPayload): Promise<PostResult> {
  const platform = 'twitter';
  try {
    let mediaId: string | undefined;

    if (payload.imageUrl) {
      const imageRes = await fetch(payload.imageUrl);
      if (imageRes.ok) {
        const imageBuffer = await imageRes.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString('base64');

        const formData = new URLSearchParams();
        formData.set('media_data', base64);
        formData.set('media_category', 'tweet_image');

        const uploadRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
          method: 'POST',
          headers: { Authorization: `Bearer ${creds.access_token}` },
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          mediaId = uploadData.media_id_string;
        }
      }
    }

    const tweetBody: Record<string, unknown> = { text: payload.content };
    if (mediaId) {
      tweetBody.media = { media_ids: [mediaId] };
    }

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetBody),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.detail || data.title || `Twitter API ${res.status}`, platform };
    }

    return {
      success: true,
      postId: data.data?.id,
      postUrl: `https://x.com/i/status/${data.data?.id}`,
      platform,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Twitter posting failed', platform };
  }
}

// ---------- LinkedIn API v2 ----------

async function postToLinkedIn(creds: SocialCredentials, payload: PostPayload): Promise<PostResult> {
  const platform = 'linkedin';
  try {
    let imageUrn: string | undefined;

    if (payload.imageUrl && creds.user_id) {
      const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.access_token}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202401',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          initializeUploadRequest: { owner: `urn:li:person:${creds.user_id}` },
        }),
      });

      if (initRes.ok) {
        const initData = await initRes.json();
        const uploadUrl = initData.value?.uploadUrl;
        imageUrn = initData.value?.image;

        if (uploadUrl) {
          const imageRes = await fetch(payload.imageUrl);
          const imageBuffer = await imageRes.arrayBuffer();

          await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${creds.access_token}`,
              'Content-Type': 'application/octet-stream',
            },
            body: imageBuffer,
          });
        }
      }
    }

    const postBody: Record<string, unknown> = {
      author: `urn:li:person:${creds.user_id}`,
      commentary: payload.content,
      visibility: 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED' },
      lifecycleState: 'PUBLISHED',
    };

    if (imageUrn) {
      postBody.content = {
        media: { title: payload.title || 'zev.ai', id: imageUrn },
      };
    }

    const res = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: (errData as Record<string, string>).message || `LinkedIn API ${res.status}`, platform };
    }

    const postUrn = res.headers.get('x-restli-id') || '';
    return {
      success: true,
      postId: postUrn,
      postUrl: `https://www.linkedin.com/feed/update/${postUrn}`,
      platform,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'LinkedIn posting failed', platform };
  }
}

// ---------- Instagram Graph API ----------

async function postToInstagram(creds: SocialCredentials, payload: PostPayload): Promise<PostResult> {
  const platform = 'instagram';
  try {
    if (!payload.imageUrl) {
      return { success: false, error: 'Instagram requires an image', platform };
    }

    const containerRes = await fetch(
      `https://graph.facebook.com/v21.0/${creds.user_id}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: payload.imageUrl,
          caption: payload.content,
          access_token: creds.access_token,
        }),
      },
    );

    const containerData = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      return { success: false, error: containerData.error?.message || 'Failed to create container', platform };
    }

    // Wait for container processing
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${creds.user_id}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: creds.access_token,
        }),
      },
    );

    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      return { success: false, error: publishData.error?.message || 'Failed to publish', platform };
    }

    return {
      success: true,
      postId: publishData.id,
      postUrl: `https://www.instagram.com/p/${publishData.id}`,
      platform,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Instagram posting failed', platform };
  }
}

// ---------- Threads API ----------

async function postToThreads(creds: SocialCredentials, payload: PostPayload): Promise<PostResult> {
  const platform = 'threads';
  try {
    const params: Record<string, string> = {
      text: payload.content,
      access_token: creds.access_token,
      media_type: payload.imageUrl ? 'IMAGE' : 'TEXT',
    };
    if (payload.imageUrl) {
      params.image_url = payload.imageUrl;
    }

    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/${creds.user_id}/threads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
    );

    const containerData = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      return { success: false, error: containerData.error?.message || 'Failed to create thread', platform };
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${creds.user_id}/threads_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: creds.access_token,
        }),
      },
    );

    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      return { success: false, error: publishData.error?.message || 'Failed to publish thread', platform };
    }

    return {
      success: true,
      postId: publishData.id,
      postUrl: `https://www.threads.net/post/${publishData.id}`,
      platform,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Threads posting failed', platform };
  }
}

// ---------- TikTok Content API ----------

async function postToTikTok(creds: SocialCredentials, payload: PostPayload): Promise<PostResult> {
  const platform = 'tiktok';
  try {
    if (!payload.imageUrl) {
      return { success: false, error: 'TikTok requires media. Generate video via HeyGen first.', platform };
    }

    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: payload.content.slice(0, 150),
          privacy_level: 'PUBLIC_TO_EVERYONE',
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_images: [payload.imageUrl],
        },
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO',
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error?.code) {
      return { success: false, error: data.error?.message || `TikTok API ${res.status}`, platform };
    }

    return {
      success: true,
      postId: data.data?.publish_id,
      platform,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'TikTok posting failed', platform };
  }
}

// ---------- Router ----------

export async function publishToPlatform(
  platform: string,
  creds: SocialCredentials,
  payload: PostPayload,
): Promise<PostResult> {
  switch (platform) {
    case 'twitter':
      return postToTwitter(creds, payload);
    case 'linkedin':
      return postToLinkedIn(creds, payload);
    case 'instagram':
      return postToInstagram(creds, payload);
    case 'threads':
      return postToThreads(creds, payload);
    case 'tiktok':
      return postToTikTok(creds, payload);
    default:
      return { success: false, error: `Unsupported platform: ${platform}`, platform };
  }
}
