export interface ErrorResponse {
    error: string;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export type PublicUser = Omit<User, 'password_hash'>;

export interface SkillTree {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

export interface TreeWithDetails extends SkillTree {
    skills: Skill[];
    edges: SkillEdge[];
}

export interface Status {
  id: number;
  user_id: number;
  label: string;
  sort_order: number;
  created_at: string;
}

export interface Skill {
  id: number;
  tree_id: number;
  label: string;
  description: string | null;
  status_id: number | null;
  x_position: number;
  y_position: number;
  created_at: string;
}

export interface SkillEdge {
  id: number;
  from_skill_id: number;
  to_skill_id: number;
}

// Handler types for skill-related actions
export type SkillChangedHandler = (updatedSkill: Skill) => void;
export type SkillDeletedHandler = (deletedSkillID: number) => void;

// Handler types for status-related actions
export type StatusChangedHandler = (updatedStatus: Status) => void;
export type StatusDeletedHandler = (deletedStatusID: number) => void;