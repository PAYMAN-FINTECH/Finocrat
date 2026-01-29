export interface SignupRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface SignupResponse {
  message: string;
}