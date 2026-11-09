import json
from datetime import datetime, timezone

def get_utc_now():
    return datetime.now(timezone.utc)
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="Admin")  # Admin, MM, DM, Solver, Compliance
    department = Column(String(50), nullable=False, default="Admin")  # Admin, Maintenance, Ordering, Accounting, IT, HR, RMA, Escalation, Management
    team_type = Column(String(50), nullable=False, default="Internal")  # Internal, External
    created_at = Column(DateTime, default=get_utc_now)

    created_tickets = relationship("Ticket", back_populates="creator", foreign_keys="Ticket.creator_id")
    assigned_tickets = relationship("Ticket", back_populates="assigned_to", foreign_keys="Ticket.assigned_to_id")


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    tech_id = Column(String(50), index=True, nullable=False)  # BDI ID (e.g. TECH2837)
    store_name = Column(String(200), nullable=False)  # Store Name
    market = Column(String(100), index=True, nullable=False)  # e.g. ARIZONA, BAY AREA, etc.
    dm_name = Column(String(150), nullable=True)  # DM Name
    district = Column(String(100), nullable=True)  # District
    door_code = Column(String(50), nullable=True)  # Door Code
    tmobile_location_id = Column(String(50), nullable=True)  # T Mobile Location ID
    edge_id = Column(String(50), nullable=True)  # EDGE ID
    magenta_sales_code = Column(String(50), nullable=True)  # Magenta Sales Code
    store_address = Column(String(300), nullable=False)  # Store Address
    state = Column(String(20), nullable=True)  # State
    store_phone = Column(String(50), nullable=True)  # Store Phone Number
    store_email = Column(String(150), nullable=True)  # Store Email
    created_at = Column(DateTime, default=get_utc_now)

    tickets = relationship("Ticket", back_populates="store")


class House(Base):
    __tablename__ = "houses"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String(50), default="Active", index=True)  # Active or Inactive
    market = Column(String(100), index=True, nullable=False)  # e.g. ARIZONA, BAY AREA, etc.
    house_code = Column(String(50), index=True, nullable=True)  # Code (e.g. AZ5453, AZ2058)
    house_name = Column(String(200), nullable=True)
    address = Column(String(300), nullable=False)  # Full Street Address
    lease_holders = Column(String(300), nullable=True)  # Lease Holders
    mm_dm = Column(String(150), nullable=True)  # MM / DM
    monthly_rent = Column(String(50), nullable=True)  # Monthly Rent
    security_deposit = Column(String(50), nullable=True)  # Security Deposit
    mode_of_payment = Column(String(100), nullable=True)  # Mode of Payment
    lease_start_date = Column(String(50), nullable=True)  # Lease Start Date
    lease_end_date = Column(String(50), nullable=True)  # Lease End Date
    appliance_list = Column(Text, nullable=True)  # Appliance List
    created_at = Column(DateTime, default=get_utc_now)

    tickets = relationship("Ticket", back_populates="house")


class MMDMInfo(Base):
    __tablename__ = "mm_dm_info"

    id = Column(Integer, primary_key=True, index=True)
    market = Column(String(100), index=True, nullable=False)
    name = Column(String(150), nullable=False)
    title = Column(String(150), nullable=True)
    ntid = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    bdi_login = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    
    # Creator info
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator_name = Column(String(120), nullable=False)
    creator_email = Column(String(150), nullable=False)
    creator_phone = Column(String(50), nullable=True)

    # Location
    market = Column(String(100), index=True, nullable=False)
    location_type = Column(String(20), nullable=False, default="Store")  # Store or House
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    house_id = Column(Integer, ForeignKey("houses.id"), nullable=True)
    location_display = Column(String(300), nullable=False)

    # Classification
    category = Column(String(50), index=True, nullable=False)
    department = Column(String(50), index=True, nullable=False)
    priority = Column(String(20), nullable=False, default="Medium")  # Low, Medium, High
    status = Column(String(20), index=True, nullable=False, default="Pending")  # Pending, Assigned, Open, Completed, Close, Hold, Re-Open
    description = Column(Text, nullable=False)

    # Assignment & Resolution
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_to_name = Column(String(120), nullable=True)
    solved_by_team = Column(String(50), nullable=True)  # Internal or External
    solved_by_name = Column(String(120), nullable=True)

    # File uploads (JSON array of URLs)
    images = Column(JSON, default=list)
    attachments = Column(JSON, default=list)

    # Closing & Payment Validation
    payment_required = Column(Boolean, default=False)
    payment_method = Column(String(50), nullable=True)
    card_last_four = Column(String(10), nullable=True)
    payment_amount = Column(Float, nullable=True)
    invoice_url = Column(String(500), nullable=True)
    closing_notes = Column(Text, nullable=True)
    closing_checklist_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=get_utc_now, index=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, index=True)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    creator = relationship("User", back_populates="created_tickets", foreign_keys=[creator_id])
    assigned_to = relationship("User", back_populates="assigned_tickets", foreign_keys=[assigned_to_id])
    store = relationship("Store", back_populates="tickets")
    house = relationship("House", back_populates="tickets")

    @property
    def ticket_code(self) -> str:
        return f"Ticket#{5000 + self.id}"

    @property
    def open_duration_days(self) -> str:
        ref_time = self.closed_at if self.closed_at else datetime.now(timezone.utc).replace(tzinfo=None)
        if self.created_at:
            delta = ref_time - self.created_at
            days = max(0, delta.days)
            return f"{days} days"
        return "0 days"

    @property
    def closed_duration_days(self) -> str:
        if self.closed_at and self.created_at:
            delta = self.closed_at - self.created_at
            days = max(0, delta.days)
            return f"{days} days"
        return "Not closed"
