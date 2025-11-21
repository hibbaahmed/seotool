const DEFAULT_FILENAME = 'header-image.jpg';

type SelfHostedConfig = {
  url: string;
  username: string;
  password: string;
};

type WPComConfig = {
  accessToken: string;
  siteId: string | number;
};

async function downloadRemoteImage(imageUrl: string) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status})`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: contentType });

  let inferredName: string | undefined;
  try {
    const urlObj = new URL(imageUrl);
    inferredName = urlObj.pathname.split('/').filter(Boolean).pop() || undefined;
  } catch {
    inferredName = imageUrl.split('/').pop();
  }

  let filename = inferredName?.split('?')[0]?.split('#')[0];
  if (!filename || !filename.includes('.')) {
    const extension =
      contentType.split('/')[1]?.split(';')[0]?.split('+')[0] || 'jpg';
    filename = `${DEFAULT_FILENAME.replace(/\.jpg$/i, '')}.${extension}`;
  }

  return { blob, filename, contentType };
}

export async function uploadFeaturedImageToSelfHosted(
  config: SelfHostedConfig,
  imageUrl?: string | null,
  altText?: string | null
) {
  if (!imageUrl) return null;

  try {
    const { blob, filename } = await downloadRemoteImage(imageUrl);
    const formData = new FormData();
    formData.append('file', blob, filename);
    if (altText) {
      formData.append('alt_text', altText);
    }

    const uploadResponse = await fetch(
      `${config.url.replace(/\/$/, '')}/wp-json/wp/v2/media`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.password}`
          ).toString('base64')}`,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(
        `WordPress media upload failed (${uploadResponse.status}): ${errorText}`
      );
    }

    const media = await uploadResponse.json();
    return {
      id: media?.id,
      sourceUrl: media?.source_url,
    };
  } catch (error) {
    console.error('⚠️ Failed to upload featured image to self-hosted WordPress:', error);
    return null;
  }
}

export async function uploadFeaturedImageToWPCom(
  config: WPComConfig,
  imageUrl?: string | null,
  altText?: string | null
) {
  if (!imageUrl) return null;

  try {
    const { blob, filename } = await downloadRemoteImage(imageUrl);
    const formData = new FormData();
    formData.append('media[]', blob, filename);
    if (altText) {
      formData.append('title', altText);
    }

    const uploadResponse = await fetch(
      `https://public-api.wordpress.com/rest/v1.1/sites/${config.siteId}/media/new`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(
        `WordPress.com media upload failed (${uploadResponse.status}): ${errorText}`
      );
    }

    const mediaPayload = await uploadResponse.json();
    const uploadedMedia = Array.isArray(mediaPayload?.media)
      ? mediaPayload.media[0]
      : mediaPayload;

    if (!uploadedMedia || (!uploadedMedia.ID && !uploadedMedia.id)) {
      throw new Error('WordPress.com media response missing ID');
    }

    return {
      id: uploadedMedia.ID ?? uploadedMedia.id,
      sourceUrl: uploadedMedia.URL ?? uploadedMedia.source_url,
    };
  } catch (error) {
    console.error('⚠️ Failed to upload featured image to WordPress.com:', error);
    return null;
  }
}


