import type { APIRoute } from 'astro';
import { themeToCss } from '../tokens/theme';

export const GET: APIRoute = () => new Response(themeToCss(), { headers: { 'content-type': 'text/css' } });
