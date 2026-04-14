export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'coach' | 'client';
          full_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role: 'coach' | 'client';
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: 'coach' | 'client';
          full_name?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          coach_id: string;
          client_id: string;
          total_sessions: number;
          total_months: number;
          start_date: string;
          status: 'active' | 'completed' | 'paused';
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          client_id: string;
          total_sessions?: number;
          total_months?: number;
          start_date: string;
          status?: 'active' | 'completed' | 'paused';
        };
        Update: {
          coach_id?: string;
          client_id?: string;
          total_sessions?: number;
          total_months?: number;
          start_date?: string;
          status?: 'active' | 'completed' | 'paused';
        };
        Relationships: [
          {
            foreignKeyName: "programs_coach_id_fkey";
            columns: ["coach_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          {
            foreignKeyName: "programs_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      practices: {
        Row: {
          id: string;
          program_id: string;
          week_number: number;
          title: string;
          description: string;
          posted_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          week_number: number;
          title: string;
          description: string;
          posted_at?: string;
        };
        Update: {
          program_id?: string;
          week_number?: number;
          title?: string;
          description?: string;
          posted_at?: string;
        };
        Relationships: [];
      };
      checkins: {
        Row: {
          id: string;
          program_id: string;
          client_id: string;
          content_text: string | null;
          voice_note_url: string | null;
          voice_note_duration_sec: number | null;
          practice_completed: boolean;
          checkin_date: string;
          coach_read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          client_id: string;
          content_text?: string | null;
          voice_note_url?: string | null;
          voice_note_duration_sec?: number | null;
          practice_completed?: boolean;
          checkin_date: string;
          coach_read_at?: string | null;
          created_at?: string;
        };
        Update: {
          content_text?: string | null;
          voice_note_url?: string | null;
          voice_note_duration_sec?: number | null;
          practice_completed?: boolean;
          coach_read_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          program_id: string;
          sender_id: string;
          content_text: string | null;
          voice_note_url: string | null;
          voice_note_duration_sec: number | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          sender_id: string;
          content_text?: string | null;
          voice_note_url?: string | null;
          voice_note_duration_sec?: number | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          content_text?: string | null;
          read_at?: string | null;
        };
        Relationships: [];
      };
      journey_entries: {
        Row: {
          id: string;
          program_id: string;
          week_number: number;
          session_date: string;
          title: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          week_number: number;
          session_date: string;
          title: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          week_number?: number;
          session_date?: string;
          title?: string;
          body?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: 'ios' | 'android';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: 'ios' | 'android';
        };
        Update: {
          token?: string;
          platform?: 'ios' | 'android';
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: 'coach' | 'client';
      program_status: 'active' | 'completed' | 'paused';
    };
    CompositeTypes: {};
  };
}
