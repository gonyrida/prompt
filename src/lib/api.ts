import axios from "axios";
import { SupabaseService, type ResourceFilters, type PaginatedResponse } from './supabase';
import type { Database } from '@/integrations/supabase/types';

type Resource = Database['public']['Tables']['resources']['Row'];

export type ResourceType = "video" | "book" | "doc" | "pdf" | "article" | string;
export type DifficultyType = "beginner" | "intermediate" | "advanced" | string;

export interface ResourceDTO {
  id: string;
  title: string;
  description: string;
  url: string;
  type: ResourceType;
  language: string;
  framework?: string;
  difficulty: DifficultyType;
  tags: string[];
  author?: string;
  rating?: number;
  bookmarked?: boolean;
}

export interface ResourceQuery {
  query?: string;
  type?: string;
  language?: string;
  framework?: string;
  difficulty?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
}

export interface ResourceResponse {
  items: ResourceDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchResources(params: ResourceQuery): Promise<ResourceResponse> {
  try {
    // Try Supabase first
    const supabaseResult = await SupabaseService.getResources(params);
    return {
      items: supabaseResult.items.map(resource => ({
        id: resource.id,
        title: resource.title,
        description: resource.description || '',
        url: resource.url,
        type: resource.type,
        language: resource.language,
        framework: resource.framework || undefined,
        difficulty: resource.difficulty,
        tags: resource.tags,
        author: resource.author || undefined,
        rating: resource.rating || undefined,
        bookmarked: resource.bookmarked,
      })),
      total: supabaseResult.total,
      page: supabaseResult.page,
      pageSize: supabaseResult.pageSize,
      totalPages: supabaseResult.totalPages,
    };
  } catch (error) {
    console.warn('Supabase failed, falling back to Express API:', error);
    // Fallback to Express API
    const { data } = await axios.get<ResourceResponse>("/api/resources", {
      params: {
        ...params,
        // Mixed provider when asking for all types
        ...(params.type === 'all' ? { provider: 'mixed' } : {}),
        // Route to YouTube provider automatically when filtering videos
        ...(params.type === 'video' ? { provider: 'youtube' } : {}),
        // Prefer Google Books when looking for PDFs or free books
        ...((params.type === 'pdf' || (params.tags && params.tags.includes('free'))) ? { provider: 'googlebooks' } : {}),
        // Route to OpenLibrary for generic docs/books
        ...(params.type === 'doc' ? { provider: 'openlibrary' } : {}),
        ...(params.type === 'book' && !(params.tags && params.tags.includes('free')) ? { provider: 'openlibrary' } : {}),
        // Convert tags array to comma-separated for server convenience
        ...(params.tags && params.tags.length ? { tags: params.tags.join(",") } : {}),
      },
    });
    return data;
  }
}
