/**
 * Hand-authored Supabase schema types. Kept in sync with
 * `supabase/migrations/*.sql`. Once the project is provisioned you can
 * regenerate with `supabase gen types typescript` and replace this file.
 */

export type Difficulty = 'easy' | 'medium' | 'hard'
export type CorrectOption = 'A' | 'B' | 'C' | 'D'
export type QuestionSource = 'medmcqa' | 'pyq' | 'original'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          country: string | null
          state: string | null
          college: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          country?: string | null
          state?: string | null
          college?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      battle_profiles: {
        Row: {
          user_id: string
          battle_username: string
          avatar_key: string
          rating: number
          highest_rating: number
          games: number
          wins: number
          losses: number
          current_streak: number
          rank_key: string
          country: string | null
          state: string | null
          college: string | null
          username_changed_at: string | null
          avatar_changed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          battle_username: string
          avatar_key?: string
          rating?: number
          highest_rating?: number
          country?: string | null
          state?: string | null
          college?: string | null
        }
        Update: Partial<Database['public']['Tables']['battle_profiles']['Insert']> & {
          rating?: number
          highest_rating?: number
          games?: number
          wins?: number
          losses?: number
          current_streak?: number
          rank_key?: string
          username_changed_at?: string | null
          avatar_changed_at?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          follower_user_id: string
          following_battle_profile_id: string
          created_at: string
        }
        Insert: {
          follower_user_id: string
          following_battle_profile_id: string
        }
        Update: Partial<Database['public']['Tables']['follows']['Insert']>
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          source: QuestionSource
          source_id: string
          question: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: CorrectOption
          explanation: string | null
          subject: string
          subject_group: string | null
          topic: string | null
          subtopic: string | null
          difficulty: Difficulty
          is_active: boolean
          created_at: string
        }
        Insert: {
          source: QuestionSource
          source_id: string
          question: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: CorrectOption
          explanation?: string | null
          subject: string
          subject_group?: string | null
          topic?: string | null
          subtopic?: string | null
          difficulty?: Difficulty
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['questions']['Insert']>
        Relationships: []
      }
      decks: {
        Row: {
          id: string
          owner_user_id: string | null
          title: string
          description: string | null
          subject: string | null
          is_official: boolean
          is_public: boolean
          card_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          owner_user_id?: string | null
          title: string
          description?: string | null
          subject?: string | null
          is_official?: boolean
          is_public?: boolean
        }
        Update: Partial<Database['public']['Tables']['decks']['Insert']>
        Relationships: []
      }
      cards: {
        Row: {
          id: string
          deck_id: string
          front: string
          back: string
          explanation: string | null
          position: number
          created_at: string
        }
        Insert: {
          deck_id: string
          front: string
          back: string
          explanation?: string | null
          position?: number
        }
        Update: Partial<Database['public']['Tables']['cards']['Insert']>
        Relationships: []
      }
      deck_saves: {
        Row: { user_id: string; deck_id: string; created_at: string }
        Insert: { user_id: string; deck_id: string }
        Update: Partial<{ user_id: string; deck_id: string }>
        Relationships: []
      }
      card_reviews: {
        Row: {
          id: string
          user_id: string
          card_id: string
          ease: number
          interval_days: number
          repetitions: number
          due_at: string
          last_reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          card_id: string
          ease?: number
          interval_days?: number
          repetitions?: number
          due_at?: string
        }
        Update: Partial<Database['public']['Tables']['card_reviews']['Insert']> & {
          last_reviewed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_battle: {
        Row: {
          battle_username: string
          avatar_key: string
          rating: number
          rank_key: string
          country: string | null
          state: string | null
          college: string | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: {
      difficulty: Difficulty
      correct_option: CorrectOption
      question_source: QuestionSource
    }
  }
}
