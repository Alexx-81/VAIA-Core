// API функции за артикули (Articles)
import { supabase } from '../supabase';
import type { Article, ArticleInsert, ArticleUpdate } from '../supabase/types';

export interface ArticleWithComputed extends Article {
  kg_per_piece: number;    // grams_per_piece / 1000
  pieces_per_kg: number;   // 1000 / grams_per_piece
}

// Добавя изчислени стойности към артикул
function addComputedFields(article: Article): ArticleWithComputed {
  return {
    ...article,
    kg_per_piece: article.grams_per_piece / 1000,
    pieces_per_kg: 1000 / article.grams_per_piece,
  };
}

// Взима всички артикули
export async function getArticles(): Promise<ArticleWithComputed[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data || []).map(addComputedFields);
}

// Взима активните артикули
export async function getActiveArticles(): Promise<ArticleWithComputed[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return (data || []).map(addComputedFields);
}

// Взима артикул по ID
export async function getArticleById(id: string): Promise<ArticleWithComputed | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? addComputedFields(data) : null;
}

// Създава нов артикул
export async function createArticle(article: ArticleInsert): Promise<ArticleWithComputed> {
  const { data, error } = await supabase
    .from('articles')
    .insert(article)
    .select()
    .single();

  if (error) throw error;
  return addComputedFields(data);
}

// Обновява артикул
export async function updateArticle(id: string, updates: ArticleUpdate): Promise<ArticleWithComputed> {
  const { data, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return addComputedFields(data);
}

// Изтрива артикул (soft delete - деактивира)
export async function deactivateArticle(id: string): Promise<void> {
  const { error } = await supabase
    .from('articles')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

// Активира артикул
export async function activateArticle(id: string): Promise<void> {
  const { error } = await supabase
    .from('articles')
    .update({ is_active: true })
    .eq('id', id);

  if (error) throw error;
}

// Взима най-използваните артикули (по last_sold_at)
export async function getMostUsedArticles(limit: number = 10): Promise<ArticleWithComputed[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('is_active', true)
    .not('last_sold_at', 'is', null)
    .order('last_sold_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(addComputedFields);
}

// Търси артикули по име
export async function searchArticles(query: string): Promise<ArticleWithComputed[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name');

  if (error) throw error;
  return (data || []).map(addComputedFields);
}

// Импортира артикули от масив
export async function importArticles(articles: ArticleInsert[]): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .upsert(articles, { onConflict: 'name' })
    .select();

  if (error) throw error;
  return data || [];
}
