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
      menu_items: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          price: number
          category: string
          image_url: string | null
          is_available: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          price: number
          category: string
          image_url?: string | null
          is_available?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          price?: number
          category?: string
          image_url?: string | null
          is_available?: boolean
          updated_at?: string
        }
      }
      testimonials: {
        Row: {
          id: string
          created_at: string
          name: string
          role: string
          content: string
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          role: string
          content: string
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          role?: string
          content?: string
          image_url?: string | null
        }
      }
      hero_content: {
        Row: {
          id: string
          tagline: string
          title: string
          title_italic: string
          description: string
          image_url: string | null
          primary_cta_text: string
          secondary_cta_text: string
          updated_at: string
        }
        Insert: {
          id?: string
          tagline: string
          title: string
          title_italic: string
          description: string
          image_url?: string | null
          primary_cta_text: string
          secondary_cta_text: string
          updated_at?: string
        }
        Update: {
          id?: string
          tagline?: string
          title?: string
          title_italic?: string
          description?: string
          image_url?: string | null
          primary_cta_text?: string
          secondary_cta_text?: string
          updated_at?: string
        }
      }
      urgent_promo: {
        Row: {
          id: string
          enabled: boolean
          image_url: string | null
          title: string
          description: string
          cta_text: string
          cta_link: string
          updated_at: string
        }
        Insert: {
          id?: string
          enabled?: boolean
          image_url?: string | null
          title: string
          description: string
          cta_text: string
          cta_link: string
          updated_at?: string
        }
        Update: {
          id?: string
          enabled?: boolean
          image_url?: string | null
          title?: string
          description?: string
          cta_text?: string
          cta_link?: string
          updated_at?: string
        }
      }
      promo_highlights: {
        Row: {
          id: string
          title: string
          image_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          image_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          image_url?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      site_config: {
        Row: {
          id: string
          whatsapp_number: string
          instagram_url: string
          running_text: string
          announcement_text: string
          shipping_config: Json | null
          metadata_config: Json | null
          cart_content: Json | null
          contact_content: Json | null
          about_content: Json | null
          updated_at: string
        }
        Insert: {
          id?: string
          whatsapp_number: string
          instagram_url: string
          running_text: string
          announcement_text: string
          shipping_config?: Json | null
          metadata_config?: Json | null
          cart_content?: Json | null
          contact_content?: Json | null
          about_content?: Json | null
          updated_at?: string
        }
        Update: {
          id?: string
          whatsapp_number?: string
          instagram_url?: string
          running_text?: string
          announcement_text?: string
          shipping_config?: Json | null
          metadata_config?: Json | null
          cart_content?: Json | null
          contact_content?: Json | null
          about_content?: Json | null
          updated_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: string
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          description?: string | null
          updated_at?: string
        }
      }
      shipping_settings: {
        Row: {
          id: string
          title: string
          content: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          is_active?: boolean
          updated_at?: string
        }
      }
    }
  }
}
