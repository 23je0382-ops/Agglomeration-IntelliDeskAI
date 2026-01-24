from fastapi import APIRouter
from datetime import datetime, timedelta
from typing import List

from database import get_db
from models import Ticket
from schemas import AnalyticsResponse, CategoryStats

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/", response_model=AnalyticsResponse)
def get_analytics():
    """Get helpdesk analytics data"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Total tickets
        cursor.execute("SELECT COUNT(*) FROM tickets")
        total_tickets = cursor.fetchone()[0] or 0
        
        # Open tickets
        cursor.execute("SELECT COUNT(*) FROM tickets WHERE status IN ('open', 'in_progress')")
        open_tickets = cursor.fetchone()[0] or 0
        
        # Resolved tickets
        cursor.execute("SELECT COUNT(*) FROM tickets WHERE status IN ('resolved', 'closed')")
        resolved_tickets = cursor.fetchone()[0] or 0
        
        # Average resolution time (in hours)
        cursor.execute("SELECT created_at, resolved_at FROM tickets WHERE resolved_at IS NOT NULL")
        resolved_with_time = cursor.fetchall()
        
        avg_resolution_time = None
        if resolved_with_time:
            total_hours = 0
            count = 0
            for row in resolved_with_time:
                if row[0] and row[1]:
                    try:
                        created = datetime.fromisoformat(row[0])
                        resolved = datetime.fromisoformat(row[1])
                        delta = resolved - created
                        total_hours += delta.total_seconds() / 3600
                        count += 1
                    except:
                        pass
            if count > 0:
                avg_resolution_time = round(total_hours / count, 2)
        
        # Tickets by category (type)
        cursor.execute("SELECT type, COUNT(*) FROM tickets GROUP BY type")
        category_counts = cursor.fetchall()
        
        tickets_by_category = [
            CategoryStats(category=cat or "unknown", count=count)
            for cat, count in category_counts
        ]
        
        # Tickets by priority
        cursor.execute("SELECT priority, COUNT(*) FROM tickets GROUP BY priority")
        priority_counts = cursor.fetchall()
        
        tickets_by_priority = [
            CategoryStats(category=priority or "unknown", count=count)
            for priority, count in priority_counts
        ]
        
        # Top issues (most common ticket titles/patterns)
        cursor.execute("SELECT title FROM tickets ORDER BY created_at DESC LIMIT 100")
        recent_tickets = cursor.fetchall()
        
        # Simple approach: get unique titles, count occurrences
        title_counts = {}
        for (title,) in recent_tickets:
            normalized = title.lower().strip()
            title_counts[normalized] = title_counts.get(normalized, 0) + 1
        
        # Sort by count and get top 5
        top_issues = sorted(title_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_issues = [title for title, count in top_issues]
        
        return AnalyticsResponse(
            total_tickets=total_tickets,
            open_tickets=open_tickets,
            resolved_tickets=resolved_tickets,
            avg_resolution_time_hours=avg_resolution_time,
            tickets_by_category=tickets_by_category,
            tickets_by_priority=tickets_by_priority,
            top_issues=top_issues
        )

@router.get("/daily")
def get_daily_stats(days: int = 7):
    """Get daily ticket statistics for the past N days"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    start_date_str = start_date.isoformat()
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get tickets created in date range
        cursor.execute("""
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM tickets
            WHERE created_at >= ?
            GROUP BY DATE(created_at)
        """, (start_date_str,))
        daily_created = cursor.fetchall()
        
        # Get tickets resolved in date range
        cursor.execute("""
            SELECT DATE(resolved_at) as date, COUNT(*) as count
            FROM tickets
            WHERE resolved_at >= ?
            GROUP BY DATE(resolved_at)
        """, (start_date_str,))
        daily_resolved = cursor.fetchall()
        
        return {
            "period_days": days,
            "daily_created": [{"date": str(d), "count": c} for d, c in daily_created],
            "daily_resolved": [{"date": str(d), "count": c} for d, c in daily_resolved]
        }
