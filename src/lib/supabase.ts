import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Resource = Database['public']['Tables']['resources']['Row'];
type ResourceInsert = Database['public']['Tables']['resources']['Insert'];
type ResourceUpdate = Database['public']['Tables']['resources']['Update'];

// Export supabase instance for direct use
export { supabase };

export interface ResourceFilters {
  query?: string;
  type?: string;
  language?: string;
  framework?: string;
  difficulty?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class SupabaseService {
  // Resources
  static async getResources(filters: ResourceFilters = {}): Promise<PaginatedResponse<Resource>> {
    const {
      query,
      type,
      language,
      framework,
      difficulty,
      tags,
      page = 1,
      pageSize = 12
    } = filters;

    let supabaseQuery = supabase
      .from('resources')
      .select('*', { count: 'exact' });

    // Apply filters
    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (type && type !== 'all') {
      supabaseQuery = supabaseQuery.eq('type', type);
    }
    if (language && language !== 'all') {
      supabaseQuery = supabaseQuery.eq('language', language);
    }
    if (framework && framework !== 'all') {
      supabaseQuery = supabaseQuery.eq('framework', framework);
    }
    if (difficulty && difficulty !== 'all') {
      supabaseQuery = supabaseQuery.eq('difficulty', difficulty);
    }
    if (tags && tags.length > 0) {
      supabaseQuery = supabaseQuery.overlaps('tags', tags);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    const { data, error, count } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: data || [],
      total,
      page,
      pageSize,
      totalPages
    };
  }

  static async getUserResources(userId: string, filters: ResourceFilters = {}): Promise<PaginatedResponse<Resource>> {
    const {
      query,
      type,
      language,
      framework,
      difficulty,
      tags,
      page = 1,
      pageSize = 12
    } = filters;

    let supabaseQuery = supabase
      .from('resources')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (type && type !== 'all') {
      supabaseQuery = supabaseQuery.eq('type', type);
    }
    if (language && language !== 'all') {
      supabaseQuery = supabaseQuery.eq('language', language);
    }
    if (framework && framework !== 'all') {
      supabaseQuery = supabaseQuery.eq('framework', framework);
    }
    if (difficulty && difficulty !== 'all') {
      supabaseQuery = supabaseQuery.eq('difficulty', difficulty);
    }
    if (tags && tags.length > 0) {
      supabaseQuery = supabaseQuery.overlaps('tags', tags);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    const { data, error, count } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to fetch user resources: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: data || [],
      total,
      page,
      pageSize,
      totalPages
    };
  }

  static async getResource(id: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch resource: ${error.message}`);
    }

    return data;
  }

  static async createResource(resource: ResourceInsert): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .insert(resource)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create resource: ${error.message}`);
    }

    return data;
  }

  static async updateResource(id: string, userId: string, updates: ResourceUpdate): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update resource: ${error.message}`);
    }

    return data;
  }

  static async deleteResource(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete resource: ${error.message}`);
    }
  }

  // User Favorites
  static async getUserFavorites(userId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        resource_id,
        resources (*)
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user favorites: ${error.message}`);
    }

    return data?.map(item => item.resources).filter(Boolean) as Resource[];
  }

  static async addToFavorites(userId: string, resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('user_favorites')
      .insert({ user_id: userId, resource_id: resourceId });

    if (error) {
      throw new Error(`Failed to add to favorites: ${error.message}`);
    }
  }

  static async removeFromFavorites(userId: string, resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('resource_id', resourceId);

    if (error) {
      throw new Error(`Failed to remove from favorites: ${error.message}`);
    }
  }

  static async isFavorite(userId: string, resourceId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check favorite status: ${error.message}`);
    }

    return !!data;
  }

  // Chat Sessions
  static async getChatSessions(userId: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch chat sessions: ${error.message}`);
    }

    return data || [];
  }

  static async createChatSession(userId: string, title?: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: title || 'New Chat',
        messages: []
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create chat session: ${error.message}`);
    }

    return data;
  }

  static async updateChatSession(id: string, updates: { title?: string; messages?: any[] }) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update chat session: ${error.message}`);
    }

    return data;
  }

  static async deleteChatSession(id: string) {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete chat session: ${error.message}`);
    }
  }
}
