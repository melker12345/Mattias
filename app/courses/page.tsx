import { createAdminClient } from '@/lib/supabase/admin';
import { CoursesClient, type Course, type Bundle } from './CoursesClient';

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

async function getPublishedBundles(): Promise<Bundle[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('course_bundles')
      .select('id, title, description, price, image, bundle_courses(courses(id, title, price, is_published))')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    return (data ?? []).map((row: any) => {
      const courses = (row.bundle_courses ?? [])
        .map((bc: any) => bc.courses)
        .filter((c: any) => c && c.is_published)
        .map((c: any) => ({ id: c.id, title: c.title, price: Number(c.price) }));
      return {
        id: row.id,
        title: row.title,
        description: row.description ?? '',
        price: Number(row.price),
        image: row.image ?? undefined,
        courses,
        coursesTotal: courses.reduce((sum: number, c: any) => sum + c.price, 0),
      };
    });
  } catch (error) {
    console.error('Error loading bundles:', error);
    return [];
  }
}

export default async function CoursesPage() {
  const [courses, bundles] = await Promise.all([getPublishedCourses(), getPublishedBundles()]);
  return <CoursesClient initialCourses={courses} initialBundles={bundles} />;
}
