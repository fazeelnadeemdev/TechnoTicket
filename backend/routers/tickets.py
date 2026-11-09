import io
import csv
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

CATEGORIES = [
    "Deposit", "Commission", "Loomis", "Brinks", "Accounting", "Travel",
    "Supplies", "Electricity", "Alarm", "Internet", "Dumpster", "Water",
    "Gas", "Maintenance", "Phones", "RMA", "Ordering", "Codes", "IT",
    "HR", "Escalation", "Management"
]

@router.get("/categories")
def get_categories():
    return CATEGORIES

@router.get("/markets")
def get_all_markets(db: Session = Depends(get_db)):
    store_markets = db.query(models.Store.market).distinct().all()
    house_markets = db.query(models.House.market).distinct().all()
    markets = set([m[0].upper() for m in store_markets if m[0]] + [m[0].upper() for m in house_markets if m[0]])
    return sorted(list(markets))

@router.get("", response_model=List[schemas.TicketResponse])
def get_tickets(
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    creator_id: Optional[int] = Query(None),
    assigned_to_id: Optional[int] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    scope: Optional[str] = Query("all"),  # all, own, assigned_to_me, assigned_by_me
    date_mode: Optional[str] = Query("created"),  # created or updated
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    status = status if isinstance(status, str) else None
    department = department if isinstance(department, str) else None
    market = market if isinstance(market, str) else None
    creator_id = creator_id if isinstance(creator_id, int) else None
    assigned_to_id = assigned_to_id if isinstance(assigned_to_id, int) else None
    priority = priority if isinstance(priority, str) else None
    search = search if isinstance(search, str) else None
    scope = scope if isinstance(scope, str) else "all"
    date_mode = date_mode if isinstance(date_mode, str) else "created"
    date_from = date_from if isinstance(date_from, str) else None
    date_to = date_to if isinstance(date_to, str) else None
    skip = skip if isinstance(skip, int) else 0
    limit = limit if isinstance(limit, int) else 100

    query = db.query(models.Ticket)

    # Scope handling
    if scope == "own":
        query = query.filter(models.Ticket.creator_id == current_user.id)
    elif scope == "assigned_to_me":
        query = query.filter(models.Ticket.assigned_to_id == current_user.id)
    elif scope == "assigned_by_me":
        query = query.filter(
            models.Ticket.creator_id == current_user.id,
            models.Ticket.assigned_to_id.isnot(None)
        )

    # Explicit Creator filter
    if creator_id:
        query = query.filter(models.Ticket.creator_id == creator_id)

    # Assigned Solver filter
    if assigned_to_id:
        query = query.filter(models.Ticket.assigned_to_id == assigned_to_id)

    # Status filter
    if status and status.lower() not in ("all", "all statuses"):
        query = query.filter(models.Ticket.status.ilike(status))

    # Department filter
    if department and department.lower() not in ("all", "all departments"):
        query = query.filter(models.Ticket.department.ilike(department))

    # Market filter
    if market and market.lower() not in ("all", "all markets"):
        query = query.filter(models.Ticket.market.ilike(market))

    # Priority filter
    if priority and priority.lower() not in ("all", "all priorities"):
        query = query.filter(models.Ticket.priority.ilike(priority))

    # Date Range filter
    date_col = models.Ticket.created_at if date_mode == "created" else models.Ticket.updated_at
    if date_from:
        try:
            d_from = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            query = query.filter(date_col >= d_from)
        except Exception:
            pass

    if date_to:
        try:
            d_to = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            query = query.filter(date_col <= d_to)
        except Exception:
            pass

    # Free text search
    if search and search.strip():
        term = f"%{search.strip()}%"
        # Search ticket code like Ticket#5001 or pure numbers
        ticket_id_filter = None
        digits = "".join(filter(str.isdigit, search))
        if digits:
            num = int(digits)
            # If search is 5003 or 3
            if num >= 5000:
                ticket_id_filter = (models.Ticket.id == (num - 5000))
            else:
                ticket_id_filter = (models.Ticket.id == num)

        search_conditions = [
            models.Ticket.description.ilike(term),
            models.Ticket.creator_name.ilike(term),
            models.Ticket.location_display.ilike(term),
            models.Ticket.category.ilike(term),
            models.Ticket.department.ilike(term),
            models.Ticket.solved_by_name.ilike(term),
            models.Ticket.market.ilike(term),
        ]
        if ticket_id_filter is not None:
            search_conditions.append(ticket_id_filter)

        query = query.filter(or_(*search_conditions))

    # Order by newest first
    sort_col = models.Ticket.created_at if date_mode == "created" else models.Ticket.updated_at
    tickets = query.order_by(desc(sort_col)).offset(skip).limit(limit).all()
    return tickets


@router.post("", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_in: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    loc_display = ticket_in.location_display
    if not loc_display:
        if ticket_in.location_type == "Store" and ticket_in.store_id:
            st = db.query(models.Store).filter(models.Store.id == ticket_in.store_id).first()
            if st:
                door_str = f" (Door: {st.door_code})" if st.door_code else ""
                loc_display = f"Store: [{st.tech_id}] {st.store_name} — {st.store_address}{door_str}"
        elif ticket_in.location_type == "House" and ticket_in.house_id:
            hs = db.query(models.House).filter(models.House.id == ticket_in.house_id).first()
            if hs:
                lease_str = f" — {hs.lease_holders}" if hs.lease_holders else ""
                code_str = f"[{hs.house_code}] " if hs.house_code else ""
                loc_display = f"House: {code_str}{hs.address}{lease_str} ({hs.status})"

    ticket = models.Ticket(
        creator_id=current_user.id,
        creator_name=current_user.name,
        creator_email=current_user.email,
        creator_phone=current_user.phone or "",
        market=ticket_in.market,
        location_type=ticket_in.location_type,
        store_id=ticket_in.store_id,
        house_id=ticket_in.house_id,
        location_display=loc_display or f"{ticket_in.location_type} ({ticket_in.market})",
        category=ticket_in.category,
        department=ticket_in.department,
        priority=ticket_in.priority,
        status="Pending",
        description=ticket_in.description,
        images=ticket_in.images,
        attachments=ticket_in.attachments,
        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
        updated_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/{ticket_id}", response_model=schemas.TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/{ticket_id}", response_model=schemas.TicketResponse)
def update_ticket(
    ticket_id: int,
    update_data: schemas.TicketUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if update_data.priority is not None:
        ticket.priority = update_data.priority
    if update_data.status is not None:
        ticket.status = update_data.status
        if update_data.status.lower() == "close" and not ticket.closed_at:
            ticket.closed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        elif update_data.status.lower() != "close":
            ticket.closed_at = None
    if update_data.department is not None:
        ticket.department = update_data.department
    if update_data.description is not None:
        ticket.description = update_data.description
    if update_data.assigned_to_id is not None:
        ticket.assigned_to_id = update_data.assigned_to_id
        assigned_user = db.query(models.User).filter(models.User.id == update_data.assigned_to_id).first()
        if assigned_user:
            ticket.assigned_to_name = assigned_user.name
            ticket.solved_by_name = assigned_user.name
            ticket.solved_by_team = assigned_user.team_type
            if ticket.status == "Pending":
                ticket.status = "Assigned"
    if update_data.assigned_to_name is not None:
        ticket.assigned_to_name = update_data.assigned_to_name
    if update_data.solved_by_team is not None:
        ticket.solved_by_team = update_data.solved_by_team
    if update_data.solved_by_name is not None:
        ticket.solved_by_name = update_data.solved_by_name

    ticket.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/reopen", response_model=schemas.TicketResponse)
def reopen_ticket(
    ticket_id: int,
    reopen_data: schemas.TicketReopenRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if not reopen_data.reason or not reopen_data.reason.strip():
        raise HTTPException(status_code=400, detail="Re-open reason is required.")

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    ticket.status = "Re-Open"
    ticket.reopen_reason = reopen_data.reason.strip()
    ticket.updated_at = now_utc
    ticket.closed_at = None

    # Add audit comment
    comment = models.TicketComment(
        ticket_id=ticket.id,
        author_id=current_user.id,
        author_name=current_user.name,
        author_role=current_user.role,
        author_department=current_user.department,
        comment_text=f"[Ticket Re-Opened]: {reopen_data.reason.strip()}",
        created_at=now_utc,
    )
    db.add(comment)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/{ticket_id}/comments", response_model=List[schemas.TicketCommentResponse])
def get_ticket_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket.comments


@router.post("/{ticket_id}/comments", response_model=schemas.TicketCommentResponse, status_code=status.HTTP_201_CREATED)
def add_ticket_comment(
    ticket_id: int,
    payload: schemas.TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if not payload.comment_text or not payload.comment_text.strip():
        raise HTTPException(status_code=400, detail="Comment text cannot be empty.")

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    comment = models.TicketComment(
        ticket_id=ticket.id,
        author_id=current_user.id,
        author_name=current_user.name,
        author_role=current_user.role,
        author_department=current_user.department,
        comment_text=payload.comment_text.strip(),
        created_at=now_utc,
    )
    db.add(comment)
    ticket.updated_at = now_utc
    db.commit()
    db.refresh(comment)
    return comment


@router.post("/{ticket_id}/close", response_model=schemas.TicketResponse)
def close_ticket(
    ticket_id: int,
    close_data: schemas.TicketCloseRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if not close_data.closing_checklist_verified:
        raise HTTPException(
            status_code=400,
            detail="Closing checklist verification is required before closing a ticket."
        )

    if close_data.payment_required:
        if not close_data.card_last_four and not close_data.payment_method:
            raise HTTPException(
                status_code=400,
                detail="Payment method or card last 4 digits are required when payment is marked as required."
            )
        if close_data.payment_amount is None or close_data.payment_amount < 0:
            raise HTTPException(
                status_code=400,
                detail="Valid payment amount is required when payment is marked as required."
            )

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    ticket.status = "Close"
    ticket.closed_at = now_utc
    ticket.updated_at = now_utc
    ticket.payment_required = close_data.payment_required
    ticket.payment_method = close_data.payment_method
    ticket.card_last_four = close_data.card_last_four
    ticket.payment_amount = close_data.payment_amount
    ticket.invoice_url = close_data.invoice_url
    ticket.closing_notes = close_data.closing_notes
    ticket.closing_checklist_verified = close_data.closing_checklist_verified

    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/reopen", response_model=schemas.TicketResponse)
def reopen_ticket(
    ticket_id: int,
    reopen_data: schemas.TicketReopenRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if not reopen_data.reason or not reopen_data.reason.strip():
        raise HTTPException(status_code=400, detail="Re-open reason is required.")

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    ticket.status = "Re-Open"
    ticket.reopen_reason = reopen_data.reason.strip()
    ticket.updated_at = now_utc
    ticket.closed_at = None

    # Add audit comment
    comment = models.TicketComment(
        ticket_id=ticket.id,
        author_id=current_user.id,
        author_name=current_user.name,
        author_role=current_user.role,
        author_department=current_user.department,
        comment_text=f"[Ticket Re-Opened]: {reopen_data.reason.strip()}",
        created_at=now_utc,
    )
    db.add(comment)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/{ticket_id}/comments", response_model=List[schemas.TicketCommentResponse])
def get_ticket_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket.comments


@router.post("/{ticket_id}/comments", response_model=schemas.TicketCommentResponse, status_code=status.HTTP_201_CREATED)
def add_ticket_comment(
    ticket_id: int,
    payload: schemas.TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if not payload.comment_text or not payload.comment_text.strip():
        raise HTTPException(status_code=400, detail="Comment text cannot be empty.")

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    comment = models.TicketComment(
        ticket_id=ticket.id,
        author_id=current_user.id,
        author_name=current_user.name,
        author_role=current_user.role,
        author_department=current_user.department,
        comment_text=payload.comment_text.strip(),
        created_at=now_utc,
    )
    db.add(comment)
    ticket.updated_at = now_utc
    db.commit()
    db.refresh(comment)
    return comment


@router.get("/export/csv")
def export_tickets_csv(
    mode: str = Query("filtered"),  # filtered, own, admin
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Exports tickets to CSV.
    Modes:
      1. 'filtered' -> exports according to current active query filters
      2. 'own' -> exports all tickets created by current user
      3. 'admin' -> exports all tickets for user's department
    """
    status = status if isinstance(status, str) else None
    department = department if isinstance(department, str) else None
    market = market if isinstance(market, str) else None
    creator_id = creator_id if isinstance(creator_id, int) else None
    assigned_to_id = assigned_to_id if isinstance(assigned_to_id, int) else None
    priority = priority if isinstance(priority, str) else None
    search = search if isinstance(search, str) else None
    scope = scope if isinstance(scope, str) else "all"
    date_mode = date_mode if isinstance(date_mode, str) else "created"
    date_from = date_from if isinstance(date_from, str) else None
    date_to = date_to if isinstance(date_to, str) else None
    skip = skip if isinstance(skip, int) else 0
    limit = limit if isinstance(limit, int) else 100

    query = db.query(models.Ticket)

    if mode == "own":
        query = query.filter(models.Ticket.creator_id == current_user.id)
    elif mode == "admin":
        active_dept = department or current_user.department
        if active_dept and active_dept.lower() != "admin":
            query = query.filter(models.Ticket.department.ilike(active_dept))
    else:  # filtered
        if department and department.lower() not in ("all", "all departments"):
            query = query.filter(models.Ticket.department.ilike(department))
        if status and status.lower() not in ("all", "all statuses"):
            query = query.filter(models.Ticket.status.ilike(status))
        if market and market.lower() not in ("all", "all markets"):
            query = query.filter(models.Ticket.market.ilike(market))
        if priority and priority.lower() not in ("all", "all priorities"):
            query = query.filter(models.Ticket.priority.ilike(priority))
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    models.Ticket.description.ilike(term),
                    models.Ticket.creator_name.ilike(term),
                    models.Ticket.location_display.ilike(term),
                    models.Ticket.category.ilike(term),
                )
            )

    tickets = query.order_by(desc(models.Ticket.created_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Ticket ID",
        "Priority",
        "Status",
        "Category",
        "Department",
        "Market",
        "Location Type",
        "Location Details",
        "Creator Name",
        "Creator Email",
        "Assigned To",
        "Solved By Team",
        "Solved By Name",
        "Description",
        "Payment Required",
        "Payment Method",
        "Card Last 4",
        "Payment Amount ($)",
        "Closing Notes",
        "Created At",
        "Closed At",
        "Open Days",
        "Closed Days"
    ])

    for t in tickets:
        writer.writerow([
            t.ticket_code,
            t.priority,
            t.status,
            t.category,
            t.department,
            t.market,
            t.location_type,
            t.location_display,
            t.creator_name,
            t.creator_email,
            t.assigned_to_name or "Unassigned",
            t.solved_by_team or "",
            t.solved_by_name or "",
            t.description,
            "Yes" if t.payment_required else "No",
            t.payment_method or "",
            t.card_last_four or "",
            f"{t.payment_amount:.2f}" if t.payment_amount is not None else "",
            t.closing_notes or "",
            t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else "",
            t.closed_at.strftime("%Y-%m-%d %H:%M") if t.closed_at else "",
            t.open_duration_days,
            t.closed_duration_days,
        ])

    output.seek(0)
    filename = f"techno_tickets_{mode}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
