export interface Worker {
    id: string;
    full_name: string;
    phone_number: string;
    photo_url?: string;
    skill_type: 'Mason' | 'Laborer' | 'Carpenter' | 'Electrician' | 'Plumber' | 'Supervisor' | 'Other';
    daily_wage: number;
    status: 'active' | 'inactive';
    created_at: string;
    // KYC Fields
    address?: string;
    aadhaar_number?: string;
    alternate_phone?: string;
    gender?: 'Male' | 'Female' | 'Other';
    age?: number;
    id_document_url?: string;
}

export interface AttendanceRecord {
    id: string;
    worker_id: string;
    date: string;
    hajri_count: number;
    kharchi_amount?: number;
    status: 'Present' | 'Absent';
}

export interface PayrollEntry {
    id: string;
    worker_id: string;
    amount: number;
    payment_date: string;
    payment_type: 'salary_payment' | 'cash_advance' | 'bonus';
}

export interface Estimate {
    id: string
    name: string
    created_at: string
    is_active?: boolean
}

export interface EstimateItem {
    id: string
    estimate_id: string
    description: string
    unit: string
    quantity: number
    rate: number
    amount: number // Calculated as quantity * rate
    category: string
    extra_data?: Record<string, any>
}

export interface MaterialType {
    id: string
    name: string
    default_rate: number
    created_at: string
}

export interface Expense {
    id: string
    material_id?: string // Optional, as expense could be non-material (future proofing)
    category: 'Material' | 'Other'
    amount: number
    quantity?: number
    rate?: number
    description?: string
    date: string
    created_at: string
}

export interface Project {
    id: string
    name?: string
    client_name?: string
    site_address?: string
    gst_number?: string
    phone?: string
    project_start_date?: string
    architect_name?: string
    engineer_name?: string
    construction_types?: string[]
    project_team?: {
        name: string
        role: string
    }[]
    created_at?: string
}
