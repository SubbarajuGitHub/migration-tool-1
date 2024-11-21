import Mux from "@mux/mux-node";
export const dynamic = 'force-dynamic';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

interface AdditionalMetaData {
  environment?: string,
  platformId: string
}

interface VideoPlatformCredentails {
  publicKey: string,
  secretKey: string,
  additionalMetadata: AdditionalMetaData
}

// for api-video
export async function verifyApiVideo(data: VideoPlatformCredentails) {
  const endpoint = data.additionalMetadata?.environment === 'sandbox' ? "https://sandbox.api.video" : "https://sandbox.api.video";

  try {
    const response = await fetch(`${endpoint}/videos`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(data.secretKey as string)}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.data) {
      return new Response('ok', { status: 200 });
    } else {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}

// for fastpix
export async function verifyFastPix(data: VideoPlatformCredentails) {
  const endpoint = "https://v1.fastpix.io/on-demand";
 
  try {

    const response = await fetch(`${endpoint}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(`${data.publicKey}:${data.secretKey}`)}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.data) {
      return new Response('ok', { status: 200 });
    } else {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}

// for vimeo
export async function verifyVimeo(data: VideoPlatformCredentails) {
  const endpoint = "https://api.vimeo.com";
 
  try {

    const response = await fetch(`${endpoint}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${data.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      return new Response('ok', { status: 200 });
    } else {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  const data = await request.json();

  switch (data.additionalMetadata?.platformId) {
    
    case 'api-video': {
      const result = await verifyApiVideo(data);
      return result;
    }

    case 'cloudflare-stream':
      try {
        const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
          headers: {
            Authorization: `Bearer ${data.secretKey}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        if (result.success) {
          return new Response('ok', { status: 200 });
        } else {
          return Response.json({ error: 'Invalid credentials' }, { status: 401 });
        }
      } catch (error) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      case 's3':
      const client = new S3Client({
        credentials: {
          accessKeyId: data.publicKey,
          secretAccessKey: data.secretKey!,
        },
        region: data.additionalMetadata.region,
      });

      const input = {
        Bucket: data.additionalMetadata.bucket,
      };

      const command = new HeadBucketCommand(input);

      try {
        await client.send(command);
        return new Response('ok', { status: 200 });
      } catch (error) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }

    case 'mux':
      const mux = new Mux({
        tokenId: data.publicKey as string,
        tokenSecret: data.secretKey as string,
      });

      try {
        await mux.video.assets.list();
        return new Response('ok', { status: 200 });
      } catch (error) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }

    case "vimeo":
        const response = await verifyVimeo(data);
        return  response;
  
    case "fastPix":
      const result = await verifyFastPix(data);
      return result;

    default:
      return Response.json({ error: 'Invalid platform provided' }, { status: 404 });
  }
}
