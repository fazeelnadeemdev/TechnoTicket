from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# ----------------- User Schemas -----------------
class UserLogin(BaseModel):
    email: str
    password: str
    department_context: Optional[str] = None  # Selected department upon login

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    role: str = "Admin"
    panel_type: Optional[str] = "Processor"  # SuperAdmin, Manager, Processor, Placer
    department: str = "Admin"
    departments: List[str] = Field(default_factory=list)  # e.g. ["Admin", "Maintenance"]
    team_type: str = "Internal"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    panel_type: Optional[str] = None
    department: Optional[str] = None
    departments: Optional[List[str]] = None
    team_type: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Store Schemas -----------------
class StoreBase(BaseModel):
    tech_id: str
    store_name: str
    market: str
    dm_name: Optional[str] = None
    district: Optional[str] = None
    door_code: Optional[str] = None
    tmobile_location_id: Optional[str] = None
    edge_id: Optional[str] = None
    magenta_sales_code: Optional[str] = None
    store_address: str
    state: Optional[str] = None
    store_phone: Optional[str] = None
    store_email: Optional[str] = None

class StoreCreate(StoreBase):
    pass

class StoreUpdate(BaseModel):
    tech_id: Optional[str] = None
    store_name: Optional[str] = None
    market: Optional[str] = None
    dm_name: Optional[str] = None
    district: Optional[str] = None
    door_code: Optional[str] = None
    tmobile_location_id: Optional[str] = None
    edge_id: Optional[str] = None
    magenta_sales_code: Optional[str] = None
    store_address: Optional[str] = None
    state: Optional[str] = None
    store_phone: Optional[str] = None
    store_email: Optional[str] = None

class StoreResponse(StoreBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- House Schemas -----------------
class HouseBase(BaseModel):
    status: str = "Active"
    market: str
    house_code: Optional[str] = None
    house_name: Optional[str] = None
    address: str
    lease_holders: Optional[str] = None
    mm_dm: Optional[str] = None
    monthly_rent: Optional[str] = None
    security_deposit: Optional[str] = None
    mode_of_payment: Optional[str] = None
    lease_start_date: Optional[str] = None
    lease_end_date: Optional[str] = None
    appliance_list: Optional[str] = None

class HouseCreate(HouseBase):
    pass

class HouseUpdate(BaseModel):
    status: Optional[str] = None
    market: Optional[str] = None
    house_code: Optional[str] = None
    house_name: Optional[str] = None
    address: Optional[str] = None
    lease_holders: Optional[str] = None
    mm_dm: Optional[str] = None
    monthly_rent: Optional[str] = None
    security_deposit: Optional[str] = None
    mode_of_payment: Optional[str] = None
    lease_start_date: Optional[str] = None
    lease_end_date: Optional[str] = None
    appliance_list: Optional[str] = None

class HouseResponse(HouseBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- MM / DM Info Schemas -----------------
class MMDMBase(BaseModel):
    market: str
    name: str
    title: Optional[str] = None
    ntid: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    bdi_login: Optional[str] = None

class MMDMCreate(MMDMBase):
    pass

class MMDMUpdate(BaseModel):
    market: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    ntid: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    bdi_login: Optional[str] = None

class MMDMResponse(MMDMBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Comment Schemas -----------------
class TicketCommentCreate(BaseModel):
    comment_text: str

class TicketCommentResponse(BaseModel):
    id: int
    ticket_id: int
    author_id: Optional[int] = None
    author_name: str
    author_role: Optional[str] = None
    author_department: Optional[str] = None
    comment_text: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Ticket Schemas -----------------
class TicketCreate(BaseModel):
    market: str
    location_type: str = "Store"  # Store or House
    store_id: Optional[int] = None
    house_id: Optional[int] = None
    location_display: str
    category: str
    department: str
    priority: str = "Medium"
    description: str
    images: List[str] = Field(default_factory=list)
    attachments: List[Any] = Field(default_factory=list)

class TicketUpdate(BaseModel):
    priority: Optional[str] = None
    status: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    solved_by_team: Optional[str] = None
    solved_by_name: Optional[str] = None

class TicketReopenRequest(BaseModel):
    reason: str

class TicketCloseRequest(BaseModel):
    payment_required: bool = False
    payment_method: Optional[str] = None
    card_last_four: Optional[str] = None
    payment_amount: Optional[float] = None
    invoice_url: Optional[str] = None
    closing_notes: str
    closing_checklist_verified: bool = True

class TicketResponse(BaseModel):
    id: int
    ticket_code: str
    creator_id: int
    creator_name: str
    creator_email: str
    creator_phone: Optional[str] = None
    market: str
    location_type: str
    store_id: Optional[int] = None
    house_id: Optional[int] = None
    location_display: str
    category: str
    department: str
    priority: str
    status: str
    description: str
    reopen_reason: Optional[str] = None
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    solved_by_team: Optional[str] = None
    solved_by_name: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    attachments: List[Any] = Field(default_factory=list)
    
    payment_required: bool = False
    payment_method: Optional[str] = None
    card_last_four: Optional[str] = None
    payment_amount: Optional[float] = None
    invoice_url: Optional[str] = None
    closing_notes: Optional[str] = None
    closing_checklist_verified: bool = False

    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None

    open_duration_days: str
    closed_duration_days: str
    comments: List[TicketCommentResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

# ----------------- Dashboard & Analytics Schemas -----------------
class KPICards(BaseModel):
    total: int
    pending: int
    assigned: int
    open: int
    completed: int
    closed: int
    hold: int
    re_open: int

class AgeBucket(BaseModel):
    department: str
    bucket_0_7: int = 0
    bucket_8_15: int = 0
    bucket_16_30: int = 0
    bucket_30_plus: int = 0

class MonthlyTrend(BaseModel):
    month: str
    count: int

class NameCount(BaseModel):
    name: str
    count: int
    color: Optional[str] = None

class DashboardMetricsResponse(BaseModel):
    kpi: KPICards
    monthly_trend: List[MonthlyTrend]
    department_age_buckets: List[AgeBucket]
    tickets_by_category: List[NameCount]
    tickets_by_status: List[NameCount]
    tickets_by_priority: List[NameCount]

TokenResponse.model_rebuild()
