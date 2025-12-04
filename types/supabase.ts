export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      integrations: {
        Row: {
          id: string
          user_id: string
          provider: string
          name: string
          config: Json
          access_token: string | null
          refresh_token: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          name: string
          config?: Json
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          name?: string
          config?: Json
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      publishing_jobs: {
        Row: {
          id: string
          user_id: string
          integration_id: string
          payload: Json
          status: string
          attempts: number
          run_at: string
          last_error: string | null
          external_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          integration_id: string
          payload: Json
          status?: string
          attempts?: number
          run_at?: string
          last_error?: string | null
          external_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          integration_id?: string
          payload?: Json
          status?: string
          attempts?: number
          run_at?: string
          last_error?: string | null
          external_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publishing_jobs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publishing_jobs_integration_id_fkey"
            columns: ["integration_id"]
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          }
        ]
      }
      credits: {
        Row: {
          created_at: string
          credits: number
          customer_id: string | null
          email: string
          id: number
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          customer_id?: string | null
          email: string
          id?: number
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          customer_id?: string | null
          email?: string
          id?: number
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscription: {
        Row: {
          created_at: string
          customer_id: string | null
          email: string
          end_at: string | null
          id: number
          subscription_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          email: string
          end_at?: string | null
          id?: number
          subscription_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          email?: string
          end_at?: string | null
          id?: number
          subscription_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          image_url: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          image_url?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      competitive_analysis: {
        Row: {
          analysis_output: string
          analysis_type: string
          company_name: string
          competitor_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_output: string
          analysis_type: 'comprehensive' | 'quick' | 'keyword_focused' | string
          company_name: string
          competitor_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_output?: string
          analysis_type?: string
          company_name?: string
          competitor_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitive_analysis_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      content_writer_outputs: {
        Row: {
          additional_context: string | null
          content_output: string
          content_type: string
          created_at: string
          id: string
          length: string | null
          target_audience: string | null
          tone: string | null
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_context?: string | null
          content_output: string
          content_type: string
          created_at?: string
          id?: string
          length?: string | null
          target_audience?: string | null
          tone?: string | null
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_context?: string | null
          content_output?: string
          content_type?: string
          created_at?: string
          id?: string
          length?: string | null
          target_audience?: string | null
          tone?: string | null
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_writer_outputs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      image_search_outputs: {
        Row: {
          additional_context: string | null
          count: number
          created_at: string
          id: string
          image_urls: string[]
          original_image_urls: string[]
          query: string
          search_results: string
          size: string | null
          style: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_context?: string | null
          count: number
          created_at?: string
          id?: string
          image_urls?: string[]
          original_image_urls?: string[]
          query: string
          search_results: string
          size?: string | null
          style: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_context?: string | null
          count?: number
          created_at?: string
          id?: string
          image_urls?: string[]
          original_image_urls?: string[]
          query?: string
          search_results?: string
          size?: string | null
          style?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_search_outputs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      seo_research_outputs: {
        Row: {
          additional_context: string | null
          created_at: string
          id: string
          industry: string | null
          query: string
          research_output: string
          research_type: string
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_context?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          query: string
          research_output: string
          research_type: string
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_context?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          query?: string
          research_output?: string
          research_type?: string
          target_audience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_research_outputs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      wordpress_sites: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          onboarding_profile_id: string | null
          password: string
          provider: string
          refresh_token: string | null
          site_id: string | null
          token_expires_at: string | null
          updated_at: string
          url: string
          user_id: string
          username: string
          wpcom_account_email: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          onboarding_profile_id?: string | null
          password: string
          provider: string
          refresh_token?: string | null
          site_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
          url: string
          user_id: string
          username: string
          wpcom_account_email?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          onboarding_profile_id?: string | null
          password?: string
          provider?: string
          refresh_token?: string | null
          site_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
          url?: string
          user_id?: string
          username?: string
          wpcom_account_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wordpress_sites_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      publishing_logs: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          post_id: number
          published_at: string
          site_id: string
          status: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          post_id: number
          published_at?: string
          site_id: string
          status?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          post_id?: number
          published_at?: string
          site_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publishing_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publishing_logs_site_id_fkey"
            columns: ["site_id"]
            referencedRelation: "wordpress_sites"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
