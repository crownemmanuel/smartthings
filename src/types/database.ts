// Supabase Database Types
export type Database = {
  public: {
    Tables: {
      shows: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      scenes: {
        Row: {
          id: string;
          show_id: string;
          name: string;
          order_index: number;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          show_id: string;
          name: string;
          order_index?: number;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          show_id?: string;
          name?: string;
          order_index?: number;
          color?: string;
          created_at?: string;
        };
      };
      device_groups: {
        Row: {
          id: string;
          scene_id: string;
          name: string;
          color: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          scene_id: string;
          name: string;
          color?: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          scene_id?: string;
          name?: string;
          color?: string;
          order_index?: number;
          created_at?: string;
        };
      };
      device_group_items: {
        Row: {
          id: string;
          device_group_id: string;
          device_id: string;
          device_name: string;
          device_type: string | null;
          turn_on: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_group_id: string;
          device_id: string;
          device_name: string;
          device_type?: string | null;
          turn_on?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_group_id?: string;
          device_id?: string;
          device_name?: string;
          device_type?: string | null;
          turn_on?: boolean;
          created_at?: string;
        };
      };
      sequences: {
        Row: {
          id: string;
          show_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          show_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          show_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      sequence_steps: {
        Row: {
          id: string;
          sequence_id: string;
          delay_ms: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sequence_id: string;
          delay_ms?: number;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sequence_id?: string;
          delay_ms?: number;
          order_index?: number;
          created_at?: string;
        };
      };
      step_actions: {
        Row: {
          id: string;
          step_id: string;
          device_group_id: string | null;
          device_id: string | null;
          device_name: string | null;
          action: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          step_id: string;
          device_group_id?: string | null;
          device_id?: string | null;
          device_name?: string | null;
          action: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          step_id?: string;
          device_group_id?: string | null;
          device_id?: string | null;
          device_name?: string | null;
          action?: string;
          created_at?: string;
        };
      };
      midi_mappings: {
        Row: {
          id: string;
          show_id: string;
          midi_note: number;
          midi_channel: number;
          action_type: string;
          target_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          show_id: string;
          midi_note: number;
          midi_channel?: number;
          action_type: string;
          target_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          show_id?: string;
          midi_note?: number;
          midi_channel?: number;
          action_type?: string;
          target_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

