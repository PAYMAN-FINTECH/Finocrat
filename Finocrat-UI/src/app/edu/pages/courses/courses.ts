import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../../services/eduservices/course.service';
import { Course } from '../../../Models/eduModels/course.model';

@Component({
  selector: 'edu-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './courses.html',
  styleUrls: ['./courses.css']
})
export class CoursesComponent {
  constructor(private route: ActivatedRoute, private courseService: CourseService) {}
 showPaymentSuccess = false;
 paymentamount = "0";
 paymentorderid = "";

ngOnInit(): void {

    this.route.queryParams.subscribe(params => {

      if (params['payment'] === 'success') {
        this.showPaymentSuccess = true;
        this.paymentamount = params['amount'] || "0";
        this.paymentorderid = params['orderId'] || "";


        // Hide message after 5 seconds
        setTimeout(() => {
          this.showPaymentSuccess = false;
        }, 5000);
      }

    });

    this.loadCourses();
    this.loadTopics();
    this.loadLevels();

  }

  courses: Course[] = [];

  // Topic/Track tabs with course counts (loaded from API)
  topics: { name: string; count: number }[] = [{ name: 'All', count: 0 }];

  // Experience level tabs with course counts (loaded from API)
  levels: { name: string; count: number }[] = [{ name: 'All Levels', count: 0 }];

  selectedTopic = 'All';
  selectedLevel = 'All Levels';
  searchTerm = '';
  visibleCount = 12;
  pageSize = 12;

  loadCourses() {
    this.courseService.getAll().subscribe(courses => {
      this.courses = courses;
    });
  }

  loadTopics() {
    this.courseService.getTopics().subscribe(topics => {
      this.topics = [{ name: 'All', count: 0 }, ...topics];
    });
  }

  loadLevels() {
    this.courseService.getLevels().subscribe(levels => {
      this.levels = [{ name: 'All Levels', count: 0 }, ...levels];
    });
  }

  get filteredCourses() {
    const term = this.searchTerm.trim().toLowerCase();
    return this.courses.filter(c => {
      const matchesTopic = this.selectedTopic === 'All' || c.category === this.selectedTopic;
      const matchesLevel = this.selectedLevel === 'All Levels' || c.level === this.selectedLevel;
      const matchesSearch = !term ||
        c.title.toLowerCase().includes(term) ||
        c.author.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term);
      return matchesTopic && matchesLevel && matchesSearch;
    });
  }

  get visibleCourses() {
    return this.filteredCourses.slice(0, this.visibleCount);
  }

  get totalCount() {
    return this.courses.length;
  }

  selectTopic(topic: string) {
    this.selectedTopic = topic;
    this.visibleCount = this.pageSize;
  }

  selectLevel(level: string) {
    this.selectedLevel = level;
    this.visibleCount = this.pageSize;
  }

  onSearchChange() {
    this.visibleCount = this.pageSize;
  }

  loadMore() {
    this.visibleCount += this.pageSize;
  }

}

