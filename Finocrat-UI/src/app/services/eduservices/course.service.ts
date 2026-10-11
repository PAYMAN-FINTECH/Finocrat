import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, CourseLevelCount, CourseTopicCount } from '../../Models/eduModels/course.model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private baseUrl = 'https://edu.thefinocrat.com/api/EduCourses';

  constructor(private http: HttpClient) {}

  getAll(topic?: string, level?: string, search?: string): Observable<Course[]> {
    let params = new HttpParams();
    if (topic) params = params.set('topic', topic);
    if (level) params = params.set('level', level);
    if (search) params = params.set('search', search);

    return this.http.get<Course[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/${id}`);
  }

  getTopics(): Observable<CourseTopicCount[]> {
    return this.http.get<CourseTopicCount[]>(`${this.baseUrl}/topics`);
  }

  getLevels(): Observable<CourseLevelCount[]> {
    return this.http.get<CourseLevelCount[]>(`${this.baseUrl}/levels`);
  }

  create(course: Partial<Course>): Observable<Course> {
    return this.http.post<Course>(this.baseUrl, course);
  }

  update(id: number, course: Partial<Course>): Observable<Course> {
    return this.http.put<Course>(`${this.baseUrl}/${id}`, course);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
