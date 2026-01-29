import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/eduservices/auth.service';

@Component({
  selector: 'edu-course-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './course-details.html',
  styleUrls: ['./course-details.css']
})
export class CourseDetailsComponent implements OnInit {

  courseId!: number;
  course: any;
  isLoggedIn = false;
  showModal = false;

  buyCourse() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  confirmPurchase() {
    alert('✅ Purchase successful (Demo)');
    this.showModal = false;
    this.router.navigate(['/']);
  }

  courses = [
    {
      id: 1,
      image: 'assets/images/course-aws.jpg',
      category: 'Cloud Computing',
      level: 'Intermediate',
      title: 'AWS Cloud Architect Certification Program',
      subtitle: 'Master AWS architecture, DevOps and cloud deployment.',
      description: 'Learn AWS architecture, DevOps, and cloud deployment with real-world projects.',
      author: 'Abhishek Nair',
      rating: 4.6,
      price: 89999,
      duration: '320 minutes'
    },
    {
      id: 2,
      image: 'assets/images/course-marketing.jpg',
      category: 'Marketing',
      level: 'Beginner',
      title: 'Digital Marketing & SEO Expert Course',
      subtitle: 'Become a digital marketer with SEO, Ads and analytics.',
      description: 'Become a digital marketer with SEO, Google Ads, and analytics mastery.',
      author: 'Pooja Sethi',
      rating: 4.2,
      price: 24999,
      duration: '265 minutes'
    },
    {
      id: 3,
      image: 'assets/images/course-ios.jpg',
      category: 'Mobile Development',
      level: 'Intermediate',
      title: 'iOS App Development with Swift',
      subtitle: 'Build professional iOS apps using Swift and Xcode.',
      description: 'Develop professional iOS apps with Swift and Xcode from scratch.',
      author: 'Ananya Ghosh',
      rating: 4.7,
      price: 29999,
      duration: '280 minutes'
    },
    {
      id: 4,
      image: 'assets/images/course-gamedev.jpg',
      category: 'Game Development',
      level: 'Intermediate',
      title: 'Game Development with Unity 3D',
      subtitle: 'Create 2D and 3D games using Unity and C#.',
      description: 'Create professional 2D and 3D games using Unity and C# scripting.',
      author: 'Mehul Jain',
      rating: 4.1,
      price: 34999,
      duration: '300 minutes'
    },
    {
      id: 5,
      image: 'assets/images/course-photography.jpg',
      category: 'Creative Arts',
      level: 'Beginner',
      title: 'Photography & Cinematography Workshop',
      subtitle: 'Master photography and cinematic video techniques.',
      description: 'Learn professional photography and cinematography techniques.',
      author: 'Dr. Kavya Menon',
      rating: 4.0,
      price: 29999,
      duration: '210 minutes'
    },
    {
      id: 6,
      image: 'assets/images/course-python.jpg',
      category: 'Programming',
      level: 'Intermediate',
      title: 'Complete Python Programming Masterclass',
      subtitle: 'From beginner to advanced Python development.',
      description: 'Learn Python from beginner to advanced with hands-on projects.',
      author: 'Ankit Sharma',
      rating: 4.9,
      price: 19999,
      duration: '350 minutes'
    },
    {
      id: 7,
      image: 'assets/images/course-figma.jpg',
      category: 'Design',
      level: 'Beginner',
      title: 'UI/UX Design Masterclass with Figma',
      subtitle: 'Design beautiful user interfaces with Figma.',
      description: 'Learn professional UI/UX design with Figma and prototyping.',
      author: 'Ritika Deshmukh',
      rating: 4.7,
      price: 14999,
      duration: '180 minutes'
    }
  ];

  constructor(private route: ActivatedRoute,private authService: AuthService,private router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.course = this.courses.find(c => c.id === this.courseId);
  }

}
