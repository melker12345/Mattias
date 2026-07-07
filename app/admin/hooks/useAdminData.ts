'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  AdminTab,
  AdminCourse,
  AdminUser,
  AdminCompany,
  CourseResult,
} from '@/lib/types/admin';

const ENDPOINTS = {
  courses: '/api/admin/courses',
  users: '/api/admin/users',
  companies: '/api/admin/companies',
  courseResults: '/api/admin/course-results',
} as const;

type Resource = keyof typeof ENDPOINTS;

const TAB_RESOURCES: Record<AdminTab, Resource[]> = {
  overview: ['courses', 'users', 'companies'],
  courses: ['courses'],
  users: ['users'],
  companies: ['companies'],
  'course-results': ['courseResults'],
};

export function useAdminData(activeTab: AdminTab) {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [courseResults, setCourseResults] = useState<CourseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef<Set<Resource>>(new Set());
  const inFlightRef = useRef<Map<Resource, Promise<void>>>(new Map());

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
      case 'courseResults':
        setCourseResults(data as CourseResult[]);
        break;
    }
  }, []);

  const fetchResource = useCallback((resource: Resource, force = false): Promise<void> => {
    if (!force && loadedRef.current.has(resource)) return Promise.resolve();

    // Dedupe concurrent requests for the same resource (e.g. rapid tab switches
    // or React strict-mode double invoke) without blocking other resources.
    const existing = inFlightRef.current.get(resource);
    if (existing) return existing;

    const request = (async () => {
      try {
        const res = await fetch(ENDPOINTS[resource]);
        if (res.ok) {
          const data = await res.json();
          applyResource(resource, data);
          loadedRef.current.add(resource);
        }
      } finally {
        inFlightRef.current.delete(resource);
      }
    })();

    inFlightRef.current.set(resource, request);
    return request;
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

  const refreshAll = useCallback(async () => {
    loadedRef.current.clear();
    await fetchResources(Object.keys(ENDPOINTS) as Resource[], true);
  }, [fetchResources]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Only show the loading state when this tab still has data to fetch;
      // already-cached tabs switch instantly.
      const needsFetch = TAB_RESOURCES[activeTab].some((r) => !loadedRef.current.has(r));
      if (needsFetch) setLoading(true);
      try {
        await fetchResources(TAB_RESOURCES[activeTab]);
      } finally {
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
    courseResults,
    loading,
    refreshResource,
    refreshAll,
  };
}