'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  UserGroupIcon, 
  BookOpenIcon,
  CheckCircleIcon,
  PlayIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  imageUrl: string;
  lessons: Lesson[];
  enrolledUsers: number;
  completedUsers: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: 'video' | 'text' | 'quiz' | 'image';
  order: number;
  completed?: boolean;
}

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [params.id]);

  const fetchCourseDetails = async () => {
    try {
      // Mock data based on course ID - replace with actual API call
      const courseData: { [key: string]: Course } = {
        '1': {
          id: '1',
          title: 'APV Grundkurs - Säkerhet på byggarbetsplatsen',
          description: 'En grundläggande kurs om säkerhet på byggarbetsplatser enligt APV-regelverket. Kursen täcker de viktigaste säkerhetsaspekterna och ger dig kunskap om hur du arbetar säkert i byggbranschen.',
          duration: 120,
          price: 995,
          imageUrl: '/images/course-apv.jpg',
          enrolledUsers: 1247,
          completedUsers: 1189,
          lessons: [
            {
              id: '1',
              title: 'Introduktion till APV',
              description: 'Grundläggande information om APV-regelverket och dess betydelse',
              duration: 15,
              type: 'video',
              order: 1
            },
            {
              id: '2',
              title: 'Säkerhetsutrustning',
              description: 'Vilken säkerhetsutrustning som krävs och hur den används korrekt',
              duration: 20,
              type: 'video',
              order: 2
            },
            {
              id: '3',
              title: 'Riskbedömning',
              description: 'Hur man identifierar och bedömer risker på byggarbetsplatsen',
              duration: 25,
              type: 'text',
              order: 3
            },
            {
              id: '4',
              title: 'Kunskapstest',
              description: 'Testa din förståelse för kursmaterialet',
              duration: 10,
              type: 'quiz',
              order: 4
            }
          ]
        },
        '2': {
          id: '2',
          title: 'Säkerhet i Byggbranschen',
          description: 'Komplett kurs om säkerhet och arbetsmiljö inom byggbranschen. Lär dig identifiera och hantera risker, förstå säkerhetsregler och skapa en säker arbetsmiljö för dig och dina kollegor.',
          duration: 180,
          price: 1995,
          imageUrl: '/images/course-safety.jpg',
          enrolledUsers: 892,
          completedUsers: 845,
          lessons: [
            {
              id: '1',
              title: 'Byggbranschens säkerhetskrav',
              description: 'Översikt över säkerhetskrav och regelverk inom byggbranschen',
              duration: 20,
              type: 'video',
              order: 1
            },
            {
              id: '2',
              title: 'Personlig skyddsutrustning (PSU)',
              description: 'Vilken skyddsutrustning som krävs för olika arbetsuppgifter',
              duration: 25,
              type: 'video',
              order: 2
            },
            {
              id: '3',
              title: 'Arbetsmiljö och ergonomi',
              description: 'Skapa en ergonomisk och säker arbetsmiljö',
              duration: 30,
              type: 'text',
              order: 3
            },
            {
              id: '4',
              title: 'Skyddsronder och säkerhetskontroller',
              description: 'Hur man utför säkerhetskontroller och skyddsronder',
              duration: 20,
              type: 'video',
              order: 4
            },
            {
              id: '5',
              title: 'Olycksfall och första hjälpen',
              description: 'Hantering av olycksfall och grundläggande första hjälpen',
              duration: 25,
              type: 'text',
              order: 5
            },
            {
              id: '6',
              title: 'Sluttest',
              description: 'Avslutande kunskapstest för kursen',
              duration: 15,
              type: 'quiz',
              order: 6
            }
          ]
        },
        '3': {
          id: '3',
          title: 'Projektledning för Byggprojekt',
          description: 'Avancerad kurs i projektledning specifikt anpassad för byggprojekt. Perfekt för dig som vill utveckla din karriär och lära dig leda komplexa byggprojekt effektivt.',
          duration: 240,
          price: 2995,
          imageUrl: '/images/course-project.jpg',
          enrolledUsers: 456,
          completedUsers: 423,
          lessons: [
            {
              id: '1',
              title: 'Projektplanering och struktur',
              description: 'Grundläggande projektplanering och strukturer för byggprojekt',
              duration: 30,
              type: 'video',
              order: 1
            },
            {
              id: '2',
              title: 'Resurshantering',
              description: 'Hantering av personal, material och utrustning',
              duration: 25,
              type: 'video',
              order: 2
            },
            {
              id: '3',
              title: 'Tidsplanering och schemaläggning',
              description: 'Skapa och hantera projektets tidsplan',
              duration: 35,
              type: 'text',
              order: 3
            },
            {
              id: '4',
              title: 'Kvalitetskontroll',
              description: 'Säkerställa kvalitet genom hela projektet',
              duration: 20,
              type: 'video',
              order: 4
            },
            {
              id: '5',
              title: 'Kommunikation och samarbete',
              description: 'Effektiv kommunikation med team och intressenter',
              duration: 25,
              type: 'text',
              order: 5
            },
            {
              id: '6',
              title: 'Riskhantering i projekt',
              description: 'Identifiera och hantera projektrisker',
              duration: 30,
              type: 'video',
              order: 6
            },
            {
              id: '7',
              title: 'Projektavslutning',
              description: 'Avsluta projekt och dokumentera lärdomar',
              duration: 20,
              type: 'text',
              order: 7
            },
            {
              id: '8',
              title: 'Certifieringstest',
              description: 'Avslutande test för projektledarcertifiering',
              duration: 20,
              type: 'quiz',
              order: 8
            }
          ]
        },
        '4': {
          id: '4',
          title: 'ADR - Farligt Gods Transport',
          description: 'Specialiserad kurs för transport av farligt gods enligt ADR-reglementet. Krävs för många transportjobb och ger dig kunskap om säker hantering av farliga ämnen.',
          duration: 150,
          price: 1795,
          imageUrl: '/images/course-adr.jpg',
          enrolledUsers: 678,
          completedUsers: 645,
          lessons: [
            {
              id: '1',
              title: 'ADR-reglementet grunderna',
              description: 'Introduktion till ADR och dess betydelse för transport',
              duration: 20,
              type: 'video',
              order: 1
            },
            {
              id: '2',
              title: 'Klassificering av farligt gods',
              description: 'Olika klasser av farligt gods och deras egenskaper',
              duration: 25,
              type: 'video',
              order: 2
            },
            {
              id: '3',
              title: 'Förpackning och märkning',
              description: 'Korrekt förpackning och märkning av farligt gods',
              duration: 20,
              type: 'text',
              order: 3
            },
            {
              id: '4',
              title: 'Transportdokumentation',
              description: 'Nödvändig dokumentation för transport av farligt gods',
              duration: 15,
              type: 'text',
              order: 4
            },
            {
              id: '5',
              title: 'Säkerhet vid transport',
              description: 'Säkerhetsåtgärder under transport',
              duration: 25,
              type: 'video',
              order: 5
            },
            {
              id: '6',
              title: 'Nödsituationer och olycksfall',
              description: 'Hantering av nödsituationer och olycksfall',
              duration: 20,
              type: 'text',
              order: 6
            },
            {
              id: '7',
              title: 'ADR-certifieringstest',
              description: 'Test för ADR-certifiering',
              duration: 15,
              type: 'quiz',
              order: 7
            }
          ]
        },
        '5': {
          id: '5',
          title: 'Vinterväghållning',
          description: 'Kurs i vinterväghållning och snöröjning. Lär dig säkra metoder för vinterarbete på vägar och hur du hanterar snö, is och kalla förhållanden.',
          duration: 90,
          price: 1295,
          imageUrl: '/images/course-winter.jpg',
          enrolledUsers: 345,
          completedUsers: 312,
          lessons: [
            {
              id: '1',
              title: 'Vinterväglag och förhållanden',
              description: 'Förstå olika vinterväglag och deras påverkan',
              duration: 15,
              type: 'video',
              order: 1
            },
            {
              id: '2',
              title: 'Snöröjningstekniker',
              description: 'Effektiva metoder för snöröjning',
              duration: 20,
              type: 'video',
              order: 2
            },
            {
              id: '3',
              title: 'Saltning och sandning',
              description: 'Korrekt användning av salt och sand',
              duration: 15,
              type: 'text',
              order: 3
            },
            {
              id: '4',
              title: 'Säkerhet vid vinterarbete',
              description: 'Säkerhetsåtgärder för vinterarbete',
              duration: 20,
              type: 'video',
              order: 4
            },
            {
              id: '5',
              title: 'Vinterväghållningstest',
              description: 'Test av vinterväghållningskunskaper',
              duration: 10,
              type: 'quiz',
              order: 5
            }
          ]
        },
        '6': {
          id: '6',
          title: 'Ledarskap i Byggbranschen',
          description: 'Utveckla dina ledarskapsförmågor för byggbranschen. Praktiska verktyg och metoder för effektiv ledning av byggteam och projekt.',
          duration: 300,
          price: 3495,
          imageUrl: '/images/course-leadership.jpg',
          enrolledUsers: 234,
          completedUsers: 198,
          lessons: [
            {
              id: '1',
              title: 'Ledarskapsteorier och stilar',
              description: 'Olika ledarskapsteorier och hur de appliceras',
              duration: 25,
              type: 'video',
              order: 1
            },
            {
              id: '2',
              title: 'Teambyggande och motivation',
              description: 'Bygga starka team och motivera medarbetare',
              duration: 30,
              type: 'video',
              order: 2
            },
            {
              id: '3',
              title: 'Konflikthantering',
              description: 'Hantera och lösa konflikter på arbetsplatsen',
              duration: 25,
              type: 'text',
              order: 3
            },
            {
              id: '4',
              title: 'Kommunikation som ledare',
              description: 'Effektiv kommunikation med team och intressenter',
              duration: 20,
              type: 'video',
              order: 4
            },
            {
              id: '5',
              title: 'Beslutsfattande och problemlösning',
              description: 'Strategier för beslutsfattande och problemlösning',
              duration: 30,
              type: 'text',
              order: 5
            },
            {
              id: '6',
              title: 'Förändringsledning',
              description: 'Leda förändringar i organisationen',
              duration: 25,
              type: 'video',
              order: 6
            },
            {
              id: '7',
              title: 'Ledarskap i kris',
              description: 'Leda under kritiska situationer',
              duration: 20,
              type: 'text',
              order: 7
            },
            {
              id: '8',
              title: 'Personlig utveckling som ledare',
              description: 'Strategier för kontinuerlig utveckling',
              duration: 15,
              type: 'video',
              order: 8
            },
            {
              id: '9',
              title: 'Ledarskapscertifieringstest',
              description: 'Avslutande test för ledarskapscertifiering',
              duration: 20,
              type: 'quiz',
              order: 9
            }
          ]
        }
      };

      const mockCourse = courseData[params.id];
      
      if (!mockCourse) {
        setCourse(null);
        setLoading(false);
        return;
      }
      
      setCourse(mockCourse);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching course:', error);
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!session) {
      // Redirect to sign in
      window.location.href = '/auth/signin';
      return;
    }

    setEnrolling(true);
    try {
      // TODO: Implement actual enrollment API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setEnrolled(true);
    } catch (error) {
      console.error('Error enrolling:', error);
    } finally {
      setEnrolling(false);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoCameraIcon className="w-5 h-5" />;
      case 'text':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'quiz':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'image':
        return <PhotoIcon className="w-5 h-5" />;
      default:
        return <BookOpenIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Kursen hittades inte</h1>
          <p className="text-gray-600 mb-8">Kursen du letar efter finns inte eller har tagits bort.</p>
          <a href="/courses" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
            Tillbaka till kurser
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden mb-8"
        >
          <div className="md:flex">
            <div className="md:w-1/3">
              <div className="h-64 md:h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <BookOpenIcon className="w-24 h-24 text-white" />
              </div>
            </div>
            <div className="md:w-2/3 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-gray-600 mb-6 leading-relaxed">{course.description}</p>
              
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  <span>{course.duration} minuter</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <UserGroupIcon className="w-5 h-5 mr-2" />
                  <span>{course.enrolledUsers} anmälda</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  <span>{course.completedUsers} slutförda</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-primary-600">
                  {course.price} kr
                </div>
                {!enrolled ? (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {enrolling ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Registrerar...
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-5 h-5 mr-2" />
                        Registrera dig
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Registrerad
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Course Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Kursinnehåll</h2>
          
          <div className="space-y-4">
            {course.lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-600 rounded-full mr-4">
                  {getLessonIcon(lesson.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {index + 1}. {lesson.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{lesson.description}</p>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {lesson.duration} min
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
