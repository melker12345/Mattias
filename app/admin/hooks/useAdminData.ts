'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  AdminTab,
  AdminCourse,
  AdminUser,
  AdminCompany,
  APVSubmission,
} from '@/lib/types/admin';

const ENDPOINTS = {
  courses: '/api/admin/courses',
  users: '/api/admin/users',
  companies: '/api/admin/companies',
  submissions: '/api/admin/submissions',
} as const;

type Resource = keyof typeof ENDPOINTS;

const TAB_RESOURCES: Record<AdminTab, Resource[]> = {
  overview: ['courses', 'users', 'companies'],
  courses: ['courses'],
  users: ['users'],
  companies: ['companies'],
  'apv-submissions': ['submissions'],
};

export function useAdminData(activeTab: AdminTab) {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [submissions, setSubmissions] = useState<APVSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef<Set<Resource>>(new Set());
  const fetchingRef = useRef(false);

  const applyResource = useCallback((resource: Resource, data: unknown) => {
    switch (resource) {
      case 'courses':
        setCourses(data as AdminCourse[]);
        break;
      case 'users':
        setUsers(data as AdminUser[]);
        break;
      case 'companies':
        setCompanies(data as AdminCompany[]);
        break;
      case 'submissions':
        setSubmissions(data as APVSubmission[]);
        break;
    }
  }, []);

  const fetchResource = useCallback(async (resource: Resource, force = false) => {
    if (!force && loadedRef.current.has(resource)) return;

    const res = await fetch(ENDPOINTS[resource]);
    if (res.ok) {
      const data = await res.json();
      applyResource(resource, data);
      loadedRef.current.add(resource);
    }
  }, [applyResource]);

  const fetchResources = useCallback(async (resources: Resource[], force = false) => {
    const toFetch = force
      ? resources
      : resources.filter((r) => !loadedRef.current.has(r));
    if (toFetch.length === 0) return;
    await Promise.all(toFetch.map((r) => fetchResource(r, force)));
  }, [fetchResource]);

  const refreshResource = useCallback(async (resource: Resource) => {
    loadedRef.current.delete(resource);
    await fetchResource(resource, true);
  }, [fetchResource]);

  const refreshTab = useCallback(async (tab: AdminTab) => {
    await fetchResources(TAB_RESOURCES[tab], true);
  }, [fetchResources]);

  const refreshAll = useCallback(async () => {
    loadedRef.current.clear();
    await fetchResources(Object.keys(ENDPOINTS) as Resource[], true);
  }, [fetchResources]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      try {
        await fetchResources(TAB_RESOURCES[activeTab]);
      } finally {
        fetchingRef.current = false;
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, fetchResources]);

  return {
    courses,
    users,
    companies,
    submissions,
    loading,
    refreshResource,
    refreshTab,
    refreshAll,
  };
}