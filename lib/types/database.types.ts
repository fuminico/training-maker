export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'trainer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'trainer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'trainer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          status: 'draft' | 'editing' | 'audio_generating' | 'video_generating' | 'completed' | 'failed'
          pptx_file_path: string | null
          slide_count: number
          total_estimated_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          status?: 'draft' | 'editing' | 'audio_generating' | 'video_generating' | 'completed' | 'failed'
          pptx_file_path?: string | null
          slide_count?: number
          total_estimated_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          status?: 'draft' | 'editing' | 'audio_generating' | 'video_generating' | 'completed' | 'failed'
          pptx_file_path?: string | null
          slide_count?: number
          total_estimated_seconds?: number
          created_at?: string
          updated_at?: string
        }
      }
      project_settings: {
        Row: {
          project_id: string
          default_voice: string
          default_speed: number
          default_pause_ms: number
          video_resolution: string
          video_fps: number
          created_at: string
          updated_at: string
        }
        Insert: {
          project_id: string
          default_voice?: string
          default_speed?: number
          default_pause_ms?: number
          video_resolution?: string
          video_fps?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          project_id?: string
          default_voice?: string
          default_speed?: number
          default_pause_ms?: number
          video_resolution?: string
          video_fps?: number
          created_at?: string
          updated_at?: string
        }
      }
      slides: {
        Row: {
          id: string
          project_id: string
          slide_index: number
          title: string | null
          original_text: string | null
          generated_script: string | null
          edited_script: string | null
          char_count: number
          estimated_seconds: number
          tts_voice_override: string | null
          tts_speed_override: number | null
          audio_file_path: string | null
          slide_image_path: string | null
          status: 'draft' | 'tts_pending' | 'tts_generating' | 'tts_done' | 'tts_failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          slide_index: number
          title?: string | null
          original_text?: string | null
          generated_script?: string | null
          edited_script?: string | null
          char_count?: number
          estimated_seconds?: number
          tts_voice_override?: string | null
          tts_speed_override?: number | null
          audio_file_path?: string | null
          slide_image_path?: string | null
          status?: 'draft' | 'tts_pending' | 'tts_generating' | 'tts_done' | 'tts_failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          slide_index?: number
          title?: string | null
          original_text?: string | null
          generated_script?: string | null
          edited_script?: string | null
          char_count?: number
          estimated_seconds?: number
          tts_voice_override?: string | null
          tts_speed_override?: number | null
          audio_file_path?: string | null
          slide_image_path?: string | null
          status?: 'draft' | 'tts_pending' | 'tts_generating' | 'tts_done' | 'tts_failed'
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          project_id: string
          job_type: 'pptx_parse' | 'tts_generation' | 'video_generation'
          status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
          payload: Json | null
          progress: number
          error_message: string | null
          created_at: string
          started_at: string | null
          finished_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          job_type: 'pptx_parse' | 'tts_generation' | 'video_generation'
          status?: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
          payload?: Json | null
          progress?: number
          error_message?: string | null
          created_at?: string
          started_at?: string | null
          finished_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          job_type?: 'pptx_parse' | 'tts_generation' | 'video_generation'
          status?: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
          payload?: Json | null
          progress?: number
          error_message?: string | null
          created_at?: string
          started_at?: string | null
          finished_at?: string | null
        }
      }
      media_files: {
        Row: {
          id: string
          project_id: string
          slide_id: string | null
          file_type: 'pptx' | 'slide_image' | 'audio' | 'video'
          path: string
          duration_sec: number | null
          size_bytes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          slide_id?: string | null
          file_type: 'pptx' | 'slide_image' | 'audio' | 'video'
          path: string
          duration_sec?: number | null
          size_bytes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          slide_id?: string | null
          file_type?: 'pptx' | 'slide_image' | 'audio' | 'video'
          path?: string
          duration_sec?: number | null
          size_bytes?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
