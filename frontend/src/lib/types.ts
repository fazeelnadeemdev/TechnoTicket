export type UserRole = "Admin" | "MM" | "DM" | "Solver" | "Compliance";
export type Department = 
  | "Admin" 
  | "Maintenance" 
  | "Ordering" 
  | "Accounting" 
  | "IT" 
  | "HR" 
  | "RMA" 
  | "Escalation" 
  | "Management"
  | "Compliance";

export type TicketPriority = "Low" | "Medium" | "High";
export type TicketStatus = "Pending" | "Assigned" | "Open" | "Completed" | "Close" | "Hold" | "Re-Open";
export type LocationType = "Store" | "House";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department: Department;
  team_type: "Internal" | "External";
  created_at?: string;
}

export interface Store {
  id: number;
  tech_id: string;
  store_name: string;
  market: string;
  dm_name?: string;
  district?: string;
  door_code?: string;
  tmobile_location_id?: string;
  edge_id?: string;
  magenta_sales_code?: string;
  store_address: string;
  state?: string;
  store_phone?: string;
  store_email?: string;
  created_at?: string;
}

export interface House {
  id: number;
  status: string;
  market: string;
  house_code?: string;
  house_name?: string;
  address: string;
  lease_holders?: string;
  mm_dm?: string;
  monthly_rent?: string;
  security_deposit?: string;
  mode_of_payment?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  appliance_list?: string;
  created_at?: string;
}

export interface MMDMInfo {
  id: number;
  market: string;
  name: string;
  title?: string;
  ntid?: string;
  email?: string;
  phone?: string;
  bdi_login?: string;
  created_at?: string;
}

export interface TicketAttachment {
  name: string;
  url: string;
  size?: number;
}

export interface Ticket {
  id: number;
  ticket_code: string;
  creator_id: number;
  creator_name: string;
  creator_email: string;
  creator_phone?: string;
  market: string;
  location_type: LocationType;
  store_id?: number;
  house_id?: number;
  location_display: string;
  category: string;
  department: string;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  assigned_to_id?: number;
  assigned_to_name?: string;
  solved_by_team?: "Internal" | "External";
  solved_by_name?: string;
  images: string[];
  attachments: TicketAttachment[];
  
  payment_required: boolean;
  payment_method?: string;
  card_last_four?: string;
  payment_amount?: number;
  invoice_url?: string;
  closing_notes?: string;
  closing_checklist_verified: boolean;

  created_at: string;
  updated_at: string;
  closed_at?: string;

  open_duration_days: string;
  closed_duration_days: string;
}

export interface KPICards {
  total: number;
  pending: number;
  assigned: number;
  open: number;
  completed: number;
  closed: number;
  hold: number;
  re_open: number;
}

export interface AgeBucket {
  department: string;
  bucket_0_7: number;
  bucket_8_15: number;
  bucket_16_30: number;
  bucket_30_plus: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface NameCount {
  name: string;
  count: number;
  color?: string;
}

export interface DashboardMetrics {
  kpi: KPICards;
  monthly_trend: MonthlyTrend[];
  department_age_buckets: AgeBucket[];
  tickets_by_category: NameCount[];
  tickets_by_status: NameCount[];
  tickets_by_priority: NameCount[];
}

export interface SolverUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  team_type: "Internal" | "External";
  active_tickets_count: number;
}

