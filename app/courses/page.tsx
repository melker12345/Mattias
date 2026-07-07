import { createAdminClient } from '@/lib/supabase/admin';
import { CoursesClient, type Course } from './CoursesClient';

// Always read fresh from the DB (server-side), the same reliable way the home
// page loads courses — avoids the client -> /api/courses round trip.
export const dynamic = 'force-dynamic';

async function getPublishedCourses(): Promise<Course[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('courses')
      .select('id, title, description, price, duration, category, image')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    return (data ?? []) as Course[];
  } catch (error) {
    console.error('Error loading courses:', error);
    return [];
  }
}

export default async function CoursesPage() {
  const courses = await getPublishedCourses();
  return <CoursesClient initialCourses={courses} />;
}
