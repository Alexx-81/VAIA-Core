export type TabId = 
  | 'dashboard'
  | 'qualities'
  | 'articles'
  | 'deliveries'
  | 'sales'
  | 'inventory'
  | 'reports'
  | 'settings';

export interface Tab {
  id: TabId;
  label: string;
}
