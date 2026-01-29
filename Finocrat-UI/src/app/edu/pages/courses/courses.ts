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
    }
  ];

}
