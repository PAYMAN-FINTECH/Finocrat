import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'edu-courses',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './courses.html',
  styleUrls: ['./courses.css']
})
export class CoursesComponent {

  courses = [
    {
      id: 1,
      image: 'assets/images/course-aws.jpg',
      category: 'Cloud Computing',
      level: 'Intermediate',
      title: 'AWS Cloud Architect Certification Program',
      description: 'Learn AWS architecture, DevOps, and cloud deployment.',
      author: 'Abhishek Nair',
      rating: 4.6,
      price: 89999
    },
    {
      id: 2,
      image: 'assets/images/course-marketing.jpg',
      category: 'Marketing',
      level: 'Beginner',
      title: 'Digital Marketing & SEO Expert Course',
      description: 'Become a digital marketer with SEO, Google Ads, and analytics.',
      author: 'Pooja Sethi',
      rating: 4.2,
      price: 24999
    },
    {
      id: 3,
      image: 'assets/images/course-ios.jpg',
      category: 'Mobile Development',
      level: 'Intermediate',
      title: 'iOS App Development with Swift',
      description: 'Develop professional iOS apps with Swift and Xcode.',
      author: 'Ananya Ghosh',
      rating: 4.7,
      price: 29999
    },
    {
      id: 4,
      image: 'assets/images/course-gamedev.jpg',
      category: 'Game Development',
      level: 'Intermediate',
      title: 'Game Development with Unity 3D',
      description: 'Create 2D and 3D games using Unity and C# scripting.',
      author: 'Mehul Jain',
      rating: 4.1,
      price: 34999
    },
    {
      id: 5,
      image: 'assets/images/course-photography.jpg',
      category: 'Creative Arts',
      level: 'Beginner',
      title: 'Photography & Cinematography Workshop',
      description: 'Learn professional photography and cinematography techniques.',
      author: 'Dr. Kavya Menon',
      rating: 4.0,
      price: 29999
    },
    {
      id: 6,
      image: 'assets/images/course-python.jpg',
      category: 'Programming',
      level: 'Intermediate',
      title: 'Complete Python Programming Masterclass',
      description: 'Learn Python from beginner to advanced with hands-on projects.',
      author: 'Ankit Sharma',
      rating: 4.9,
      price: 19999
    },
    {
      id: 7,
      image: 'assets/images/course-figma.jpg',
      category: 'Design',
      level: 'Beginner',
      title: 'UI/UX Design Masterclass with Figma',
      description: 'Learn professional UI/UX design with Figma and prototyping.',
      author: 'Ritika Deshmukh',
      rating: 4.7,
      price: 14999
    },
    {
      id: 8,
      image: 'assets/images/course-blockchain.jpg',
      category: 'Blockchain',
      level: 'Beginner',
      title: 'Blockchain & Cryptocurrency Fundamentals',
      subtitle: 'Learn blockchain technology and cryptocurrency basics.',
      description: 'Understand blockchain technology, smart contracts, and cryptocurrency fundamentals.',
      author: 'By Aditya Chhabra',
      rating: 4.8,
      price: 111000,
      duration: '280 minutes'
    },
    {
      id: 9,
      image: 'assets/images/course-react.jpg',
      category: 'Web Development',
      level: 'Intermediate',
      title: 'React & Next.js Professional Developer Course',
      subtitle: 'Learn React and Next.js for professional web development.',
      description: 'Master React and Next.js for building modern web applications.',
      author: 'By Ram Chandra',
      rating: 4.6,
      price: 100000,
      duration: '244 minutes'
    },
    {
      id: 10,
      image: 'assets/images/course-fullstack.jpg',
      category: 'Web Development',
      level: 'beginner',
      title: 'Full Stack Web Development Bootcamp',
      subtitle: 'Learn to build complete web apps using React, Node.js, and MongoDB.',
      description: 'Master full stack web development with React, Node.js, and MongoDB.',
      author: 'By Prasdh Kumar',
      rating: 4.2,
      price: 19000,
      duration: '72 minutes'
    },
    {
      id: 11,
      image: 'assets/images/course-android.jpg',
      category: 'Mobile Development',
      level: 'beginner',
      title: 'Android App Development with Kotlin',
      subtitle: 'Learn to build Android apps using Kotlin programming language.',
      description: 'Master Android app development with Kotlin and build real-world applications.',
      author: 'By Kumar',
      rating: 4.5,
      price: 89000,
      duration: '180 minutes'
    },
    {
      id: 12,
      image: 'assets/images/course-product.jpg',
      category: 'Mobile Development',
      level: 'beginner',
      title: 'AI-Powered Product Management Program',
      subtitle: 'Learn AI-powered product management techniques.',
      description: 'Master AI-powered product management and build intelligent products.',
      author: 'By Jhon Doe',
      rating: 4.5,
      price: 139000,
      duration: '190 minutes'
    },
    {
      id: 13,
      image: 'assets/images/course-ai.jpg',
      category: 'AI & Machine Learning',
      level: 'Beginner',
      title: 'Complete AI & Machine Learning Bootcamp',
      subtitle: 'Learn AI and machine learning from scratch.',
      description: 'Master AI and machine learning concepts with hands-on projects.',
      author: 'By Jhon Doe',
      rating: 4.4,
      price: 119000,
      duration: '190 minutes'
    }
  ];

}
