import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { checklistTemplates as hardcodedTemplates, getAllCategories, type ChecklistTemplate, type ChecklistItem } from '@/data/checklists';

/**
 * Hook that merges hardcoded checklist templates with user-created
 * checklists stored in the database. DB checklists appear first,
 * followed by the built-in system templates.
 */
export function useChecklists() {
  const { user } = useAuth();
  const [dbChecklists, setDbChecklists] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDbChecklists([]);
      setLoading(false);
      return;
    }

    const fetchChecklists = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('checklists')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching checklists:', error);
          setDbChecklists([]);
          return;
        }

        const mapped: ChecklistTemplate[] = (data || []).map((row) => {
          const items: ChecklistItem[] = Array.isArray(row.items)
            ? (row.items as any[]).map((item: any) => ({
                id: item.id || `db_${row.id}_${Math.random().toString(36).slice(2)}`,
                text: item.text || '',
                category: item.category || 'Geral',
                legislation: item.legislation || undefined,
              }))
            : [];

          return {
            id: `db_${row.id}`,
            name: `${row.name}${row.user_id ? ' ★' : ''}`,
            description: row.establishment_type,
            icon: '📋',
            items,
            legislationBase: Array.isArray(row.legislation_references)
              ? (row.legislation_references as string[]).join(', ')
              : undefined,
          };
        });

        setDbChecklists(mapped);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [user]);

  const allChecklists = useMemo(() => {
    // DB checklists first (user's custom ones), then hardcoded system templates
    return [...dbChecklists, ...hardcodedTemplates];
  }, [dbChecklists]);

  return { checklists: allChecklists, loading };
}
