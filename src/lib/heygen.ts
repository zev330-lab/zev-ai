// HeyGen API stub for avatar video generation
// Connect API key via admin settings to activate

export interface HeyGenConfig {
  apiKey: string;
  avatarId: string;
  voiceId?: string;
}

export interface VideoRequest {
  script: string;
  title: string;
  avatarId?: string;
  background?: string;
}

export interface VideoResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  status?: string;
  error?: string;
}

export async function createVideo(config: HeyGenConfig, request: VideoRequest): Promise<VideoResult> {
  if (!config.apiKey) {
    return { success: false, error: 'HeyGen API key not configured. Set in admin settings.' };
  }

  try {
    const res = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: request.avatarId || config.avatarId,
              avatar_style: 'normal',
            },
            voice: {
              type: 'text',
              input_text: request.script,
              voice_id: config.voiceId || 'en-US-JennyNeural',
            },
            background: {
              type: 'color',
              value: request.background || '#0a0e1a',
            },
          },
        ],
        dimension: { width: 1080, height: 1920 },
        title: request.title,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message || `HeyGen API ${res.status}` };
    }

    return {
      success: true,
      videoId: data.data?.video_id,
      status: 'processing',
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'HeyGen API error' };
  }
}

export async function getVideoStatus(apiKey: string, videoId: string): Promise<VideoResult> {
  try {
    const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { 'X-Api-Key': apiKey },
    });

    const data = await res.json();
    return {
      success: true,
      videoId,
      videoUrl: data.data?.video_url,
      status: data.data?.status,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'HeyGen status check failed' };
  }
}
