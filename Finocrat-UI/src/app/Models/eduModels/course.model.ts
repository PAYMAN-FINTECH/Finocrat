export interface Course {
  id: number;
  image?: string;
  category: string;
  level: string;
  title: string;
  subtitle?: string;
  description?: string;
  author: string;
  rating: number;
  price: number;
  duration?: string;
}

export interface CourseTopicCount {
  name: string;
  count: number;
}

export interface CourseLevelCount {
  name: string;
  count: number;
}
