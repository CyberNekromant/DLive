export enum TaskType {
  PILL = 'pill',
  NAILS = 'nails',
  EARS = 'ears',
  OTHER = 'other'
}

export interface Pet {
  id: string;
  name: string;
  breed: string;
  weight?: number;
  imageUrl: string;
}

export interface Task {
  id: string;
  petId: string;
  type: TaskType;
  title: string;
  frequencyDays: number; // Repeat every X days
  lastDoneDate: string | null; // ISO Date string
  nextDueDate: string; // ISO Date string
}