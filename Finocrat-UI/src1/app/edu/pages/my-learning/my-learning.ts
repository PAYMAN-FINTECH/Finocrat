import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-learning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-learning.html',
  styleUrls: ['./my-learning.css']
})
export class MyLearningComponent implements OnInit {

  enrolledCourses: any[] = [];
  showSuccessMessage = false;
  successMessage: string | null = null;

  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? (window.history.state as any);
    console.log('MyLearning navigation state:', state);

    if (state?.message) {
      this.successMessage = state.message;
      this.showSuccessMessage = true;

      setTimeout(() => {
        this.ngZone.run(() => this.showSuccessMessage = false);
      }, 3000); // auto close after 3 sec
    } else if (state?.loginSuccess) {
      // Backend didn't provide message — show a sensible default
      this.successMessage = 'Login successful. Welcome back!';
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.ngZone.run(() => this.showSuccessMessage = false);
      }, 3000);
    }
  }

  browseCourses() {
    this.router.navigate(['/edu/courses']);
  }
}
