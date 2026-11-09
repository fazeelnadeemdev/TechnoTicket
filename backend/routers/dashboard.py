from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/metrics", response_model=schemas.DashboardMetricsResponse)
def get_dashboard_metrics(
    market: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    date_mode: Optional[str] = Query("created"),  # created or updated
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    market = market if isinstance(market, str) else None
    priority = priority if isinstance(priority, str) else None
    date_mode = date_mode if isinstance(date_mode, str) else "created"
    date_from = date_from if isinstance(date_from, str) else None
    date_to = date_to if isinstance(date_to, str) else None
    department = department if isinstance(department, str) else None

    query = db.query(models.Ticket)

    if market and market.lower() not in ("all", "all markets"):
        query = query.filter(models.Ticket.market.ilike(market))

    if priority and priority.lower() not in ("all", "all priorities"):
        query = query.filter(models.Ticket.priority.ilike(priority))

    if department and department.lower() not in ("all", "all departments"):
        query = query.filter(models.Ticket.department.ilike(department))

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

    all_filtered_tickets = query.all()
    total_count = len(all_filtered_tickets)

    # 1. KPI Cards
    status_counts = {
        "pending": 0,
        "assigned": 0,
        "open": 0,
        "completed": 0,
        "closed": 0,
        "hold": 0,
        "re_open": 0,
    }

    for t in all_filtered_tickets:
        st = (t.status or "").lower()
        if st == "pending":
            status_counts["pending"] += 1
        elif st == "assigned":
            status_counts["assigned"] += 1
        elif st == "open":
            status_counts["open"] += 1
        elif st == "completed":
            status_counts["completed"] += 1
        elif st in ("close", "closed"):
            status_counts["closed"] += 1
        elif st == "hold":
            status_counts["hold"] += 1
        elif st in ("re-open", "reopen", "re_open"):
            status_counts["re_open"] += 1

    kpis = schemas.KPICards(
        total=total_count,
        pending=status_counts["pending"],
        assigned=status_counts["assigned"],
        open=status_counts["open"],
        completed=status_counts["completed"],
        closed=status_counts["closed"],
        hold=status_counts["hold"],
        re_open=status_counts["re_open"],
    )

    # 2. Tickets Summary Last 1 Year (Monthly Trend)
    # Generate past 12 months buckets
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    monthly_dict = {}
    for i in range(11, -1, -1):
        # Month calculation
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1
        key = f"{datetime(year, month, 1).strftime('%b %Y')}"
        monthly_dict[key] = 0

    for t in all_filtered_tickets:
        t_date = t.created_at if date_mode == "created" else t.updated_at
        if t_date:
            key = t_date.strftime("%b %Y")
            if key in monthly_dict:
                monthly_dict[key] += 1

    monthly_trend = [
        schemas.MonthlyTrend(month=k, count=v) for k, v in monthly_dict.items()
    ]

    # 3. Department-wise Ticket Status by Age Buckets (0-7, 8-15, 16-30, 30+)
    # Track departments present
    dept_buckets_map: Dict[str, schemas.AgeBucket] = {}
    for t in all_filtered_tickets:
        dept = t.department or "Admin"
        if dept not in dept_buckets_map:
            dept_buckets_map[dept] = schemas.AgeBucket(department=dept)

        ref_time = t.closed_at if t.closed_at else now
        days = max(0, (ref_time - t.created_at).days) if t.created_at else 0

        if days <= 7:
            dept_buckets_map[dept].bucket_0_7 += 1
        elif days <= 15:
            dept_buckets_map[dept].bucket_8_15 += 1
        elif days <= 30:
            dept_buckets_map[dept].bucket_16_30 += 1
        else:
            dept_buckets_map[dept].bucket_30_plus += 1

    department_age_buckets = list(dept_buckets_map.values())
    if not department_age_buckets:
        department_age_buckets = [
            schemas.AgeBucket(department="Maintenance"),
            schemas.AgeBucket(department="Admin"),
            schemas.AgeBucket(department="IT"),
            schemas.AgeBucket(department="Accounting"),
        ]

    # 4. Tickets by Category
    category_counts: Dict[str, int] = {}
    for t in all_filtered_tickets:
        cat = t.category or "Other"
        category_counts[cat] = category_counts.get(cat, 0) + 1

    category_colors = [
        "#7E22CE", "#9333EA", "#A855F7", "#C084FC",
        "#2563EB", "#3B82F6", "#60A5FA", "#0D9488",
        "#14B8A6", "#10B981", "#F59E0B", "#F97316",
        "#EF4444", "#EC4899", "#8B5CF6", "#6366F1"
    ]
    tickets_by_category = [
        schemas.NameCount(
            name=cat,
            count=count,
            color=category_colors[idx % len(category_colors)]
        )
        for idx, (cat, count) in enumerate(sorted(category_counts.items(), key=lambda x: -x[1]))
    ]

    # 5. Tickets by Status
    status_palette = {
        "Pending": "#F59E0B",
        "Assigned": "#3B82F6",
        "Open": "#10B981",
        "Completed": "#06B6D4",
        "Close": "#6B7280",
        "Hold": "#8B5CF6",
        "Re-Open": "#EF4444",
    }
    status_distribution: Dict[str, int] = {}
    for t in all_filtered_tickets:
        st_name = t.status.title() if t.status else "Open"
        if st_name == "Closed":
            st_name = "Close"
        status_distribution[st_name] = status_distribution.get(st_name, 0) + 1

    tickets_by_status = [
        schemas.NameCount(
            name=st,
            count=count,
            color=status_palette.get(st, "#9333EA")
        )
        for st, count in status_distribution.items()
    ]

    # 6. Tickets by Priority
    priority_palette = {
        "High": "#EF4444",
        "Medium": "#F59E0B",
        "Low": "#10B981",
    }
    priority_distribution: Dict[str, int] = {"High": 0, "Medium": 0, "Low": 0}
    for t in all_filtered_tickets:
        pr = (t.priority or "Medium").title()
        priority_distribution[pr] = priority_distribution.get(pr, 0) + 1

    tickets_by_priority = [
        schemas.NameCount(
            name=pr,
            count=count,
            color=priority_palette.get(pr, "#9333EA")
        )
        for pr, count in priority_distribution.items() if count > 0
    ]

    return schemas.DashboardMetricsResponse(
        kpi=kpis,
        monthly_trend=monthly_trend,
        department_age_buckets=department_age_buckets,
        tickets_by_category=tickets_by_category,
        tickets_by_status=tickets_by_status,
        tickets_by_priority=tickets_by_priority,
    )
